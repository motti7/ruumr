import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Ruler,
  UsersRound,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import {
  chooseCurrentApartment,
  ensureTeamApartmentDiscovery,
  scheduleApartmentVisit,
} from "@/api/teamApartmentDiscovery";
import { APARTMENT_LIFECYCLE } from "@/lib/apartmentPreferences";
import { useToast } from "@/components/ui/use-toast";
import { getLanguageDirection, isRtlLanguage } from "@/lib/languageDirection";
import { DEMO_STAGES, setDemoStage } from "@/lib/demoStage";

function displayAddress(apartment, language) {
  return language === "he"
    ? apartment?.address_he || apartment?.address
    : apartment?.address_en || apartment?.address;
}

function displayDescription(apartment, language) {
  return language === "he"
    ? apartment?.description_he || apartment?.description
    : apartment?.description_en || apartment?.description;
}

function displayAmenities(apartment, language) {
  return language === "he"
    ? apartment?.amenities_he || []
    : apartment?.amenities_en || [];
}

function displayCommute(apartment, language) {
  return language === "he"
    ? apartment?.commute_note_he
    : apartment?.commute_note_en;
}

function apartmentFromDiscovery(discovery, apartmentId) {
  const all = [
    ...(discovery?.suggested_apartments || []),
    discovery?.current_apartment,
    discovery?.selected_apartment,
    discovery?.winning_apartment,
  ].filter(Boolean);
  return all.find((apartment) => String(apartment.id) === String(apartmentId)) || all[0] || null;
}

export default function ApartmentDetail() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [state, setState] = useState({ loading: true, discovery: null });
  const [visitTime, setVisitTime] = useState("");
  const [saving, setSaving] = useState(false);
  const visitTimeInputRef = useRef(null);
  const apartmentId = searchParams.get("apartmentId") || "";
  const direction = getLanguageDirection(i18n);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await ensureTeamApartmentDiscovery();
        if (!cancelled) setState({ loading: false, discovery: result.discovery || null });
      } catch (error) {
        console.error("[ruumr] apartment detail load failed", error);
        if (!cancelled) setState({ loading: false, discovery: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const discovery = state.discovery;
  const apartment = apartmentFromDiscovery(discovery, apartmentId);
  const isCurrent =
    apartment?.id &&
    [discovery?.current_apartment?.id, discovery?.winning_apartment?.id, discovery?.selected_apartment?.id]
      .filter(Boolean)
      .map(String)
      .includes(String(apartment.id));
  const lifecycle = discovery?.lifecycle_state || "";
  const scheduledDate = discovery?.visit_time ? new Date(discovery.visit_time) : null;
  const score = discovery?.eligible_apartments?.find((item) => String(item.apartment_id) === String(apartment?.id));

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language === "he" ? "he-IL" : "en-US", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }),
    [i18n.language]
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === "he" ? "he-IL" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language]
  );

  const handleSchedule = async () => {
    const selectedVisitTime = visitTime || visitTimeInputRef.current?.value || "";
    if (!selectedVisitTime || !discovery?.id) {
      toast({ title: t("apartment_visit_time_required") });
      return;
    }
    setSaving(true);
    try {
      const result = await scheduleApartmentVisit({
        discoveryId: discovery.id,
        visitTime: new Date(selectedVisitTime).toISOString(),
      });
      setState({ loading: false, discovery: result.discovery || discovery });
      toast({ title: t("apartment_visit_scheduled") });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_visit_error") });
    } finally {
      setSaving(false);
    }
  };

  const handleChoose = async () => {
    if (!discovery?.id) return;
    setSaving(true);
    try {
      const result = await chooseCurrentApartment({ discoveryId: discovery.id });
      setState({ loading: false, discovery: result.discovery || discovery });
      setDemoStage(DEMO_STAGES.APARTMENT_SERVICES);
      toast({ title: t("apartment_chosen_toast") });
      navigate(createPageUrl("ApartmentServices"));
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_choose_error") });
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center" dir={direction}>
        <div className={`bg-white rounded-2xl border border-gray-100 p-6 ${textAlignClass}`}>
          <p className="font-extrabold text-gray-900">{t("apartment_detail_not_found")}</p>
          <button onClick={() => navigate(createPageUrl("Home"))} className="mt-4 gradient-orange text-white font-extrabold px-5 py-3 rounded-xl">
            {t("nav_home")}
          </button>
        </div>
      </div>
    );
  }

  const images = apartment.images?.length ? apartment.images : [apartment.image].filter(Boolean);
  const amenities = displayAmenities(apartment, i18n.language);
  const canChoose = lifecycle === APARTMENT_LIFECYCLE.APARTMENT_VIEWING && isCurrent;

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir={direction}>
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowRight className="w-5 h-5 text-gray-700" />
        </button>
        <div className={`${textAlignClass} flex-1`}>
          <h1 className="text-2xl font-extrabold text-gray-900">{t("apartment_detail_title")}</h1>
          <p className="text-xs font-bold text-gray-500">{displayAddress(apartment, i18n.language)}</p>
        </div>
      </div>

      <main className="p-4 space-y-4">
        <section className="space-y-2">
          <img src={images[0]} alt="" className="w-full h-64 object-cover rounded-2xl shadow-sm" />
          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {images.slice(1, 3).map((image) => (
                <img key={image} src={image} alt="" className="w-full h-28 object-cover rounded-xl" />
              ))}
            </div>
          )}
        </section>

        <section className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-gray-900">
                {i18n.language === "he" ? apartment.title_he || apartment.title : apartment.title_en || apartment.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{displayDescription(apartment, i18n.language)}</p>
            </div>
            <div className={isRtl ? "text-left" : "text-right"}>
              <p className="text-xl font-extrabold text-[--theme-orange]">{priceFormatter.format(apartment.price || 0)}</p>
              <p className="text-[11px] font-bold text-gray-400">{t("apartment_price_month")}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <Metric icon={<BedDouble className="w-4 h-4" />} label={t("apartment_bedrooms")} value={apartment.bedrooms} />
            <Metric icon={<Ruler className="w-4 h-4" />} label={t("apartment_size")} value={`${apartment.size_sqm || "-"} ${t("sqm")}`} />
            <Metric icon={<Home className="w-4 h-4" />} label={t("apartment_floor")} value={apartment.floor ?? "-"} />
          </div>
        </section>

        {amenities.length > 0 && (
          <section className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
            <h3 className="font-extrabold text-gray-900 mb-3">{t("apartment_amenities")}</h3>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <span key={amenity} className="px-3 py-2 rounded-full bg-orange-50 text-orange-700 text-xs font-extrabold">
                  {amenity}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
          <div className="flex items-center gap-2 text-gray-900 mb-3">
            <UsersRound className="w-5 h-5 text-[--theme-orange]" />
            <h3 className="font-extrabold">{t("apartment_team_fit")}</h3>
          </div>
          {score ? (
            <p className="text-sm font-bold text-green-700">
              {t("apartment_happiness_score", { points: score.points, amazingVotes: score.amazing_votes })}
            </p>
          ) : (
            <p className="text-sm text-gray-500">{t("apartment_detail_rate_hint")}</p>
          )}
          {displayCommute(apartment, i18n.language) && (
            <p className="text-sm text-gray-500 mt-2">{displayCommute(apartment, i18n.language)}</p>
          )}
        </section>

        <section className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
          <div className="flex items-center gap-2 text-gray-900 mb-3">
            <MapPin className="w-5 h-5 text-[--theme-orange]" />
            <h3 className="font-extrabold">{t("apartment_location")}</h3>
          </div>
          <p className="text-sm text-gray-500">{displayAddress(apartment, i18n.language)}</p>
          <button
            onClick={() => navigate(createPageUrl("ApartmentMap"))}
            className="mt-3 w-full py-3 rounded-xl bg-gray-900 text-white font-extrabold"
          >
            {t("apartment_open_map")}
          </button>
        </section>

        <section className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
          <div className="flex items-center gap-2 text-gray-900 mb-3">
            <CalendarDays className="w-5 h-5 text-[--theme-orange]" />
            <h3 className="font-extrabold">{t("apartment_schedule_visit")}</h3>
          </div>
          {scheduledDate && isCurrent ? (
            <p className="rounded-xl bg-green-50 border border-green-100 px-3 py-3 text-sm font-bold text-green-700">
              {t("apartment_visit_scheduled_for", { time: dateFormatter.format(scheduledDate) })}
            </p>
          ) : canChoose ? (
            <div className="space-y-2">
              <input
                ref={visitTimeInputRef}
                type="datetime-local"
                value={visitTime}
                onChange={(event) => setVisitTime(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <button onClick={handleSchedule} disabled={saving} className="w-full py-3 rounded-xl gradient-orange text-white font-extrabold disabled:opacity-60">
                {t("apartment_schedule_cta")}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("apartment_detail_schedule_hint")}</p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`${createPageUrl("ApartmentChat")}?apartmentId=${encodeURIComponent(apartment.id)}`)}
            className="py-3.5 rounded-xl bg-white border border-gray-100 text-gray-900 font-extrabold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {t("apartment_chat_cta")}
          </button>
          <button
            onClick={handleChoose}
            disabled={!canChoose || saving}
            className="py-3.5 rounded-xl bg-green-600 text-white font-extrabold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t("apartment_choose_cta")}
          </button>
        </div>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}
        <span className="text-[11px] font-bold">{label}</span>
      </div>
      <p className="text-lg font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

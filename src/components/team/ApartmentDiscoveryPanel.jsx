import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BedDouble,
  CalendarDays,
  Check,
  ExternalLink,
  Heart,
  Home,
  Loader2,
  MapPin,
  RotateCcw,
  ThumbsDown,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  changeApartmentPreferences,
  chooseCurrentApartment,
  ensureTeamApartmentDiscovery,
  rejectCurrentApartment,
  requestMoreApartmentSuggestions,
  scheduleApartmentVisit,
  submitApartmentPreferences,
} from "@/api/teamApartmentDiscovery";
import {
  APARTMENT_LIFECYCLE,
  APARTMENT_PREFERENCES,
  preferencesAreComplete,
} from "@/lib/apartmentPreferences";
import { useToast } from "@/components/ui/use-toast";

const CONFETTI_STORAGE_KEY = "ruumr_team_apartment_transition_confetti_seen";
const LIFECYCLE_STORAGE_KEY = "ruumr_apartment_lifecycle";
const REJECTION_REASONS = [
  "not_available",
  "too_small",
  "too_far",
  "too_expensive",
  "bad_condition",
  "other",
];

const CITY_LABELS = {
  "תל אביב": { en: "Tel Aviv", he: "תל אביב" },
  "רמת גן": { en: "Ramat Gan", he: "רמת גן" },
  "גבעתיים": { en: "Givatayim", he: "גבעתיים" },
  "גבעת שמואל": { en: "Givat Shmuel", he: "גבעת שמואל" },
  "פתח תקווה": { en: "Petah Tikva", he: "פתח תקווה" },
  "ירושלים": { en: "Jerusalem", he: "ירושלים" },
  "חיפה": { en: "Haifa", he: "חיפה" },
  "באר שבע": { en: "Be'er Sheva", he: "באר שבע" },
  "נתניה": { en: "Netanya", he: "נתניה" },
  "הרצליה": { en: "Herzliya", he: "הרצליה" },
};

function displayCity(city, language) {
  const label = CITY_LABELS[String(city || "").trim()];
  return label?.[language === "he" ? "he" : "en"] || city;
}

function displayAddress(apartment, language) {
  if (language === "he") {
    return apartment?.address_he || apartment?.address || apartment?.neighborhood_he || apartment?.neighborhood;
  }
  if (apartment?.address_en) {
    const rawCity = String(apartment.city || "");
    return apartment.address_en.replace(rawCity, displayCity(rawCity, language));
  }
  const neighborhood = apartment?.neighborhood_en || apartment?.neighborhood;
  return [neighborhood, displayCity(apartment?.city, language)].filter(Boolean).join(", ");
}

function lifecycleFrom(discovery) {
  if (!discovery) return APARTMENT_LIFECYCLE.TEAM_BUILDING;
  if (discovery.lifecycle_state) return discovery.lifecycle_state;
  if (discovery.status === "finalized") return APARTMENT_LIFECYCLE.APARTMENT_VIEWING;
  if (discovery.status === "apartment_found") return APARTMENT_LIFECYCLE.APARTMENT_FOUND;
  if (discovery.status === "needs_city") return APARTMENT_LIFECYCLE.TEAM_BUILDING;
  return APARTMENT_LIFECYCLE.APARTMENT_RANKING;
}

function publishLifecycle(discovery) {
  if (typeof window === "undefined") return;
  const lifecycle = lifecycleFrom(discovery);
  window.localStorage?.setItem(LIFECYCLE_STORAGE_KEY, lifecycle);
  window.dispatchEvent(new CustomEvent("ruumr-apartment-lifecycle", { detail: { lifecycle } }));
}

export default function ApartmentDiscoveryPanel({ userId, isEstablished }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [discovery, setDiscovery] = useState(null);
  const [status, setStatus] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [visitTime, setVisitTime] = useState("");
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const visitTimeInputRef = useRef(null);

  useEffect(() => {
    if (!isEstablished) {
      publishLifecycle(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const result = await ensureTeamApartmentDiscovery();
        if (cancelled) return;
        const nextDiscovery = result.discovery || null;
        setDiscovery(nextDiscovery);
        setStatus(result.status || nextDiscovery?.status || null);
        const mine = nextDiscovery?.preferences?.[String(userId)]?.preferences
          || nextDiscovery?.rankings?.[String(userId)]?.preferences
          || nextDiscovery?.rankings?.[String(userId)]?.rankings;
        setPreferences(mine || {});
        publishLifecycle(nextDiscovery);
      } catch (error) {
        console.error(error);
        if (!cancelled) toast({ title: t("apartment_discovery_load_error") });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEstablished, t, toast, userId]);

  useEffect(() => {
    if (!discovery) return;
    publishLifecycle(discovery);
    const lifecycle = lifecycleFrom(discovery);
    if (lifecycle !== APARTMENT_LIFECYCLE.APARTMENT_RANKING) return;
    try {
      const teamKey = discovery.team_key || "team";
      const seenKey = `${CONFETTI_STORAGE_KEY}:${teamKey}`;
      if (window.localStorage?.getItem(seenKey)) return;
      window.localStorage?.setItem(seenKey, "true");
      confetti({ particleCount: 120, spread: 72, origin: { y: 0.3 } });
    } catch {
      confetti({ particleCount: 90, spread: 64, origin: { y: 0.3 } });
    }
  }, [discovery]);

  const apartments = discovery?.suggested_apartments || [];
  const lifecycle = lifecycleFrom(discovery);
  const submittedCount = discovery?.preferences ? Object.keys(discovery.preferences).length : 0;
  const memberCount = discovery?.member_count || discovery?.member_user_ids?.length || 0;
  const mySubmittedPreferences = discovery?.preferences?.[String(userId)]?.preferences;
  const canSubmit = preferencesAreComplete(apartments, preferences)
    && lifecycle === APARTMENT_LIFECYCLE.APARTMENT_RANKING;
  const selectedCityLabel = displayCity(discovery?.selected_city, i18n.language);

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

  const saveDiscoveryResult = (result) => {
    setDiscovery(result.discovery);
    setStatus(result.status || result.discovery?.status || null);
    publishLifecycle(result.discovery);
  };

  const handlePreference = (apartmentId, preference) => {
    if (lifecycle !== APARTMENT_LIFECYCLE.APARTMENT_RANKING) return;
    setPreferences((current) => ({ ...current, [apartmentId]: preference }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !discovery?.id) {
      toast({ title: t("apartment_preference_incomplete") });
      return;
    }
    setIsSaving(true);
    try {
      const result = await submitApartmentPreferences({ discoveryId: discovery.id, preferences });
      saveDiscoveryResult(result);
      const nextStatus = result.discovery?.status;
      toast({
        title:
          nextStatus === "apartment_viewing"
            ? t("apartment_preference_finalized")
            : nextStatus === "no_eligible_apartment"
              ? t("apartment_no_eligible_toast")
              : t("apartment_preference_saved"),
      });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_preference_error") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePreferences = async () => {
    if (!discovery?.id) return;
    setIsSaving(true);
    try {
      const result = await changeApartmentPreferences({ discoveryId: discovery.id });
      setPreferences({});
      saveDiscoveryResult(result);
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_preference_error") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFindMore = async () => {
    if (!discovery?.id) return;
    setIsSaving(true);
    try {
      const result = await requestMoreApartmentSuggestions({ discoveryId: discovery.id });
      setPreferences({});
      saveDiscoveryResult(result);
      toast({ title: result.no_more_suggestions ? t("apartment_no_more_toast") : t("apartment_more_options_loaded") });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_find_more_error") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleVisit = async () => {
    const selectedVisitTime = visitTime || visitTimeInputRef.current?.value || "";
    if (!selectedVisitTime || !discovery?.id) {
      toast({ title: t("apartment_visit_time_required") });
      return;
    }
    setIsSaving(true);
    try {
      const result = await scheduleApartmentVisit({
        discoveryId: discovery.id,
        visitTime: new Date(selectedVisitTime).toISOString(),
      });
      saveDiscoveryResult(result);
      toast({ title: t("apartment_visit_scheduled") });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_visit_error") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectCurrentApartment = async () => {
    if (!discovery?.id) return;
    setIsSaving(true);
    try {
      const result = await rejectCurrentApartment({ discoveryId: discovery.id, reason: rejectionReason });
      saveDiscoveryResult(result);
      toast({ title: t("apartment_rejected_saved") });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_reject_error") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChooseCurrentApartment = async () => {
    if (!discovery?.id) return;
    setIsSaving(true);
    try {
      const result = await chooseCurrentApartment({ discoveryId: discovery.id });
      saveDiscoveryResult(result);
      toast({ title: t("apartment_chosen_toast") });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_choose_error") });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEstablished) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[--theme-orange] animate-spin" />
        <span className="font-bold text-gray-700">{t("apartment_discovery_loading")}</span>
      </div>
    );
  }

  if (status === "not_established") return null;
  if (!discovery) return null;

  if (discovery.status === "needs_city") {
    return <NeedsCityState discovery={discovery} />;
  }

  if (discovery.status === "collecting_options" || (apartments.length === 0 && lifecycle === APARTMENT_LIFECYCLE.APARTMENT_RANKING)) {
    return (
      <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
        <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
          <h3 className="font-extrabold text-gray-900">{t("apartment_options_pending_title")}</h3>
          <p className="text-sm text-gray-600 leading-6 mt-2">
            {t("apartment_options_pending_body", { city: selectedCityLabel })}
          </p>
        </div>
      </ApartmentShell>
    );
  }

  if (lifecycle === APARTMENT_LIFECYCLE.APARTMENT_FOUND) {
    return (
      <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
        <FoundView
          apartment={discovery.selected_apartment || discovery.current_apartment || discovery.winning_apartment}
          priceFormatter={priceFormatter}
        />
      </ApartmentShell>
    );
  }

  if (lifecycle === APARTMENT_LIFECYCLE.APARTMENT_VIEWING) {
    return (
      <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
        <ViewingView
          discovery={discovery}
          priceFormatter={priceFormatter}
          dateFormatter={dateFormatter}
          visitTime={visitTime}
          visitTimeInputRef={visitTimeInputRef}
          setVisitTime={setVisitTime}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onSchedule={handleScheduleVisit}
          onReject={handleRejectCurrentApartment}
          onChoose={handleChooseCurrentApartment}
          isSaving={isSaving}
        />
      </ApartmentShell>
    );
  }

  if (discovery.status === "no_more_suggestions" || discovery.no_more_suggestions) {
    return (
      <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
        <EmptyOptionsState
          title={t("apartment_no_more_title")}
          body={t("apartment_no_more_body")}
          icon={<XCircle className="w-6 h-6" />}
        />
      </ApartmentShell>
    );
  }

  if (discovery.status === "no_eligible_apartment" || discovery.no_eligible_apartment) {
    return (
      <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
        <NoEligibleState
          onChangePreferences={handleChangePreferences}
          onFindMore={handleFindMore}
          isSaving={isSaving}
        />
      </ApartmentShell>
    );
  }

  return (
    <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
      <div>
        <p className="text-sm text-gray-600 leading-6">
          {t("apartment_found_in_city", { city: selectedCityLabel })}
        </p>
        <p className="text-sm text-gray-500 leading-6 mt-1">{t("apartment_preference_prompt")}</p>
      </div>

      <div className="space-y-3">
        {apartments.map((apartment, index) => (
          <ApartmentPreferenceCard
            key={apartment.id}
            apartment={apartment}
            index={index}
            selectedPreference={preferences[apartment.id]}
            onPreference={handlePreference}
            priceFormatter={priceFormatter}
          />
        ))}
      </div>

      <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-700">
            {t("apartment_preference_progress", { submitted: submittedCount, total: memberCount })}
          </p>
          {mySubmittedPreferences && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
              <Check className="w-4 h-4" />
              {t("apartment_your_preference_saved")}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSaving}
          className="w-full py-3.5 rounded-2xl gradient-orange text-white font-extrabold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {mySubmittedPreferences ? t("apartment_update_preferences") : t("apartment_submit_preferences")}
        </button>
      </div>
    </ApartmentShell>
  );
}

function ApartmentShell({ discovery, selectedCityLabel, children }) {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="gradient-orange p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Home className="w-7 h-7" />
          </div>
          <div className="flex-1 text-right">
            <h2 className="text-2xl font-extrabold">{t("apartment_team_ready_title")}</h2>
            <p className="text-white/85 text-sm mt-1">{t("apartment_team_ready_subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-orange-50 p-3">
            <div className="flex items-center gap-2 text-orange-700">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold">{t("apartment_search_city")}</span>
            </div>
            <p className="text-lg font-extrabold text-gray-900 mt-1">{selectedCityLabel}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-gray-600">
              <BedDouble className="w-4 h-4" />
              <span className="text-xs font-bold">{t("apartment_bedrooms")}</span>
            </div>
            <p className="text-lg font-extrabold text-gray-900 mt-1">
              {t("apartment_bedroom_count", { count: discovery.bedrooms })}
            </p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function ApartmentPreferenceCard({ apartment, index, selectedPreference, onPreference, priceFormatter }) {
  const { t, i18n } = useTranslation();
  const city = displayCity(apartment.city, i18n.language);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
    >
      <img src={apartment.image} alt="" className="w-full h-40 object-cover" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <h3 className="font-extrabold text-gray-900 leading-6">
              {t("apartment_card_title", { bedrooms: apartment.bedrooms, city })}
            </h3>
            <p className="text-xs font-bold text-gray-500 mt-1">{displayAddress(apartment, i18n.language)}</p>
          </div>
          <div className="text-left flex-shrink-0">
            <p className="text-lg font-extrabold text-[--theme-orange]">{priceFormatter.format(apartment.price || 0)}</p>
            <p className="text-[11px] font-bold text-gray-400">{t("apartment_price_month")}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-6">
          {t("apartment_card_description", { bedrooms: apartment.bedrooms })}
        </p>
        {apartment.listing_url && (
          <a
            href={apartment.listing_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("apartment_listing_details")}
          </a>
        )}
        <div className="grid grid-cols-3 gap-2">
          {APARTMENT_PREFERENCES.map((preference) => {
            const active = selectedPreference === preference;
            return (
              <button
                key={preference}
                onClick={() => onPreference(apartment.id, preference)}
                className={`min-h-11 rounded-xl text-xs font-extrabold border transition-all active:scale-95 ${
                  active
                    ? preference === "no_way"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-[--theme-orange] text-white border-[--theme-orange]"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {t(`apartment_preference_${preference}`)}
              </button>
            );
          })}
        </div>
      </div>
    </motion.article>
  );
}

function ViewingView({
  discovery,
  priceFormatter,
  dateFormatter,
  visitTime,
  visitTimeInputRef,
  setVisitTime,
  rejectionReason,
  setRejectionReason,
  onSchedule,
  onReject,
  onChoose,
  isSaving,
}) {
  const { t, i18n } = useTranslation();
  const apartment = discovery.current_apartment || discovery.winning_apartment;
  const score = discovery.eligible_apartments?.find((item) => item.apartment_id === apartment?.id);
  const scheduledDate = discovery.visit_time ? new Date(discovery.visit_time) : null;

  if (!apartment) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-green-500 text-white flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1 text-right">
            <h3 className="text-xl font-extrabold text-gray-900">{t("apartment_viewing_title")}</h3>
            <p className="text-sm text-gray-600 mt-1">{t("apartment_viewing_body")}</p>
          </div>
        </div>
        {score && (
          <p className="text-xs font-bold text-green-700 mt-3">
            {t("apartment_happiness_score", { points: score.points, amazingVotes: score.amazing_votes })}
          </p>
        )}
      </div>

      <ApartmentSummaryCard apartment={apartment} priceFormatter={priceFormatter} language={i18n.language} />

      <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-800">
          <CalendarDays className="w-5 h-5 text-[--theme-orange]" />
          <h3 className="font-extrabold">{t("apartment_schedule_visit")}</h3>
        </div>
        {scheduledDate ? (
          <p className="rounded-xl bg-white border border-gray-100 px-3 py-3 text-sm font-bold text-gray-700">
            {t("apartment_visit_scheduled_for", { time: dateFormatter.format(scheduledDate) })}
          </p>
        ) : (
          <>
            <input
              ref={visitTimeInputRef}
              type="datetime-local"
              value={visitTime}
              onChange={(event) => setVisitTime(event.target.value)}
              onInput={(event) => setVisitTime(event.currentTarget.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <button
              onClick={onSchedule}
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl gradient-orange text-white font-extrabold shadow-md active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("apartment_schedule_cta")}
            </button>
          </>
        )}
      </div>

      <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
        <button
          onClick={onChoose}
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-extrabold shadow-md active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4" />
          {t("apartment_choose_cta")}
        </button>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            {REJECTION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {t(`apartment_rejection_reason_${reason}`)}
              </option>
            ))}
          </select>
          <button
            onClick={onReject}
            disabled={isSaving}
            className="px-4 rounded-xl bg-gray-900 text-white font-extrabold active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <ThumbsDown className="w-4 h-4" />
            {t("apartment_reject_cta")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FoundView({ apartment, priceFormatter }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-green-50 border border-green-100 p-5 text-right">
        <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center mb-3">
          <Check className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-extrabold text-gray-900">{t("apartment_found_complete_title")}</h3>
        <p className="text-sm text-gray-600 leading-6 mt-2">{t("apartment_found_complete_body")}</p>
      </div>
      {apartment && <ApartmentSummaryCard apartment={apartment} priceFormatter={priceFormatter} language={i18n.language} />}
    </div>
  );
}

function ApartmentSummaryCard({ apartment, priceFormatter, language }) {
  const { t } = useTranslation();
  const city = displayCity(apartment.city, language);

  return (
    <article className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <img src={apartment.image} alt="" className="w-full h-44 object-cover" />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <h3 className="font-extrabold text-gray-900">{t("apartment_card_title", { bedrooms: apartment.bedrooms, city })}</h3>
            <p className="text-xs font-bold text-gray-500 mt-1">{displayAddress(apartment, language)}</p>
          </div>
          <p className="text-lg font-extrabold text-[--theme-orange]">{priceFormatter.format(apartment.price || 0)}</p>
        </div>
        <p className="text-sm text-gray-500 leading-6">{t("apartment_card_description", { bedrooms: apartment.bedrooms })}</p>
      </div>
    </article>
  );
}

function NoEligibleState({ onChangePreferences, onFindMore, isSaving }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-red-50 border border-red-100 p-4 space-y-4 text-right">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-red-500 text-white flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-gray-900">{t("apartment_no_eligible_title")}</h3>
          <p className="text-sm text-gray-600 leading-6 mt-1">{t("apartment_no_eligible_body")}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onChangePreferences}
          disabled={isSaving}
          className="py-3 rounded-xl bg-white border border-red-100 text-gray-900 font-extrabold active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {t("apartment_change_preferences")}
        </button>
        <button
          onClick={onFindMore}
          disabled={isSaving}
          className="py-3 rounded-xl bg-gray-900 text-white font-extrabold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {t("apartment_find_three_more")}
        </button>
      </div>
    </div>
  );
}

function EmptyOptionsState({ title, body, icon }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-right">
      <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-6 mt-2">{body}</p>
    </div>
  );
}

function NeedsCityState({ discovery }) {
  const { t } = useTranslation();
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-[--theme-orange]" />
        </div>
        <div className="flex-1 text-right">
          <h2 className="text-xl font-extrabold text-gray-900">{t("apartment_no_common_city_title")}</h2>
          <p className="text-sm text-gray-500 mt-1 leading-6">{t("apartment_no_common_city_body")}</p>
        </div>
      </div>
      {discovery.suggested_cities?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500">{t("apartment_most_shared_cities")}</p>
          <div className="flex flex-wrap gap-2">
            {discovery.suggested_cities.map((city) => (
              <span key={city.city} className="px-3 py-2 rounded-full bg-orange-50 text-orange-700 text-sm font-bold">
                {t("apartment_shared_city_count", { city: city.city, count: city.count })}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

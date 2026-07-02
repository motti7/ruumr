import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { enUS, he } from "date-fns/locale";
import {
  AlertCircle,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  RotateCcw,
  ThumbsDown,
  Trophy,
  XCircle,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { isRtlLanguage } from "@/lib/languageDirection";
import { DEMO_STAGES, setDemoStage } from "@/lib/demoStage";
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
  estimatedRentPerRoommate,
  preferencesAreComplete,
} from "@/lib/apartmentPreferences";
import {
  clearApartmentPreferenceDraft,
  preferencesForApartmentRanking,
  updateApartmentPreferenceDraft,
} from "@/lib/apartmentPreferenceDraft";
import { useToast } from "@/components/ui/use-toast";
import ApartmentIntroModal from "@/components/team/ApartmentIntroModal";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const CONFETTI_STORAGE_KEY = "ruumr_team_apartment_transition_confetti_seen";
const LIFECYCLE_STORAGE_KEY = "ruumr_apartment_lifecycle";
const INTRO_SEEN_SESSION_KEY = "ruumr_apartment_intro_seen";
const INTRO_REQUEST_SESSION_KEY = "ruumr_apartment_intro_requested";
const REJECTION_REASONS = [
  "not_available",
  "too_small",
  "too_far",
  "too_expensive",
  "bad_condition",
  "other",
];
const VISIT_TIME_OPTIONS = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

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

// Pick the localized variant of an apartment field (e.g. `${base}_en` / `${base}_he`),
// falling back to the other language so cards never render blank.
function localizedField(apartment, base, language) {
  const he = apartment?.[`${base}_he`];
  const en = apartment?.[`${base}_en`];
  return (language === "he" ? he || en : en || he) || "";
}

function padTimePart(value) {
  return String(value).padStart(2, "0");
}

function dateToInputDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padTimePart(date.getMonth() + 1)}-${padTimePart(date.getDate())}`;
}

function parseLocalDateTime(value) {
  if (!value) return { date: null, time: "" };
  const [datePart, timePart = ""] = String(value).split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return { date: null, time: timePart.slice(0, 5) };
  return {
    date: new Date(year, month - 1, day),
    time: timePart.slice(0, 5),
  };
}

function combineVisitDateTime(date, time) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !time) return "";
  return `${dateToInputDate(date)}T${time}`;
}

function googleCalendarDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function googleCalendarUrl({ title, details, location, startDate, durationMinutes = 45 }) {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) return "";
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "",
    dates: `${googleCalendarDate(startDate)}/${googleCalendarDate(endDate)}`,
    details: details || "",
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

function shouldDismissIntroInitially() {
  try {
    if (sessionStorage.getItem(INTRO_REQUEST_SESSION_KEY)) return false;
    return sessionStorage.getItem(INTRO_SEEN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export default function ApartmentDiscoveryPanel({ userId, isEstablished }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [discovery, setDiscovery] = useState(null);
  const [status, setStatus] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [visitTime, setVisitTime] = useState("");
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [rejectionNote, setRejectionNote] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(shouldDismissIntroInitially);
  const dismissIntro = () => {
    try {
      sessionStorage.setItem(INTRO_SEEN_SESSION_KEY, "1");
      sessionStorage.removeItem(INTRO_REQUEST_SESSION_KEY);
    } catch { /* ignore */ }
    setIntroDismissed(true);
  };
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
        setPreferences(preferencesForApartmentRanking(nextDiscovery, userId));
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

  useEffect(() => {
    try {
      if (sessionStorage.getItem(INTRO_REQUEST_SESSION_KEY)) {
        setIntroDismissed(false);
      }
    } catch {
      // If storage is unavailable, fall back to the initial in-memory state.
    }
  }, []);

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
    setPreferences((current) => {
      const next = { ...current, [apartmentId]: preference };
      updateApartmentPreferenceDraft(discovery, apartmentId, preference);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || !discovery?.id) {
      toast({ title: t("apartment_preference_incomplete") });
      return;
    }
    setIsSaving(true);
    try {
      const result = await submitApartmentPreferences({ discoveryId: discovery.id, preferences });
      clearApartmentPreferenceDraft(discovery);
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
      clearApartmentPreferenceDraft(discovery);
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
      clearApartmentPreferenceDraft(discovery);
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

  const handleRejectCurrentApartment = async ({ reason = rejectionReason, note = rejectionNote } = {}) => {
    if (!discovery?.id) return;
    setIsSaving(true);
    try {
      const result = await rejectCurrentApartment({ discoveryId: discovery.id, reason, note });
      saveDiscoveryResult(result);
      setRejectDialogOpen(false);
      setRejectionReason(REJECTION_REASONS[0]);
      setRejectionNote("");
      toast({ title: t("apartment_rejected_saved") });
    } catch (error) {
      console.error(error);
      toast({ title: t("apartment_reject_error") });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChooseCurrentApartment = async () => {
    if (!discovery?.id || !discovery.visit_time) return;
    setIsSaving(true);
    try {
      const result = await chooseCurrentApartment({ discoveryId: discovery.id });
      saveDiscoveryResult(result);
      setDemoStage(DEMO_STAGES.APARTMENT_SERVICES);
      toast({ title: t("apartment_chosen_toast") });
      navigate(createPageUrl("ApartmentServices"));
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
          rejectionNote={rejectionNote}
          setRejectionNote={setRejectionNote}
          rejectDialogOpen={rejectDialogOpen}
          setRejectDialogOpen={setRejectDialogOpen}
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
    <>
      <ApartmentShell discovery={discovery} selectedCityLabel={selectedCityLabel}>
      <p className="text-sm font-bold text-gray-700">{t("apartment_rate_prompt")}</p>

      <div className="space-y-3">
        {apartments.map((apartment, index) => (
          <ApartmentPreferenceCard
            key={apartment.id}
            apartment={apartment}
            index={index}
            selectedPreference={preferences[apartment.id]}
            onPreference={handlePreference}
            onDetail={() => navigate(`${createPageUrl("ApartmentDetail")}?apartmentId=${encodeURIComponent(apartment.id)}`)}
            onChat={() => navigate(`${createPageUrl("ApartmentChat")}?apartmentId=${encodeURIComponent(apartment.id)}`)}
            priceFormatter={priceFormatter}
            memberCount={memberCount}
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
      {!introDismissed && <ApartmentIntroModal onClose={dismissIntro} />}
    </>
  );
}

function ApartmentShell({ discovery, selectedCityLabel, children }) {
  const { t, i18n } = useTranslation();
  const textAlignClass = isRtlLanguage(i18n) ? "text-right" : "text-left";

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="gradient-orange p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Home className="w-7 h-7" />
          </div>
          <div className={`flex-1 ${textAlignClass}`}>
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

function ApartmentPreferenceCard({ apartment, index, selectedPreference, onPreference, onDetail, onChat, priceFormatter, memberCount }) {
  const { t, i18n } = useTranslation();
  const city = displayCity(apartment.city, i18n.language);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";
  const priceAlignClass = isRtl ? "text-left" : "text-right";
  const neighborhood = localizedField(apartment, "neighborhood", i18n.language) || city;
  const description =
    localizedField(apartment, "description", i18n.language)
    || t("apartment_card_description", { bedrooms: apartment.bedrooms });
  const commute = localizedField(apartment, "commute_note", i18n.language);
  const rentPerRoommate = estimatedRentPerRoommate(apartment, memberCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
    >
      <button type="button" onClick={onDetail} className="block w-full" aria-label={t("apartment_listing_details")}>
        <img src={apartment.image} alt="" className="w-full h-40 object-cover" />
      </button>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className={textAlignClass}>
            <h3 className="font-extrabold text-gray-900 leading-6">{neighborhood}</h3>
            <p className="text-xs font-bold text-gray-500 mt-1">{displayAddress(apartment, i18n.language)}</p>
          </div>
          <div className={`${priceAlignClass} flex-shrink-0`}>
            <p className="text-lg font-extrabold text-[--theme-orange]">{priceFormatter.format(apartment.price || 0)}</p>
            <p className="text-[11px] font-bold text-gray-400">{t("apartment_price_month")}</p>
            {rentPerRoommate && (
              <p className="mt-1 rounded-full bg-orange-50 px-2 py-1 text-[11px] font-extrabold text-orange-700">
                {t("apartment_price_per_roommate", { price: priceFormatter.format(rentPerRoommate) })}
              </p>
            )}
          </div>
        </div>
        <p className={`text-sm text-gray-500 leading-6 ${textAlignClass}`}>{description}</p>
        {commute && (
          <div className={`flex items-center gap-1.5 text-xs font-bold text-orange-700 ${textAlignClass}`}>
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{commute}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDetail}
            className="min-h-10 rounded-xl bg-orange-50 text-orange-700 text-xs font-extrabold flex items-center justify-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("apartment_listing_details")}
          </button>
          <button
            type="button"
            onClick={onChat}
            className="min-h-10 rounded-xl bg-gray-50 text-gray-700 text-xs font-extrabold flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {t("apartment_chat_cta")}
          </button>
        </div>
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

const VisitDateTimePicker = React.forwardRef(function VisitDateTimePicker(
  { value, onChange, language },
  ref
) {
  const { t } = useTranslation();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { date: selectedDate, time: selectedTime } = parseLocalDateTime(value);
  const isHebrew = String(language || "").toLowerCase().startsWith("he");
  const today = useMemo(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  }, []);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(isHebrew ? "he-IL" : "en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [isHebrew]
  );

  const setDate = (date) => {
    if (!date) return;
    onChange(combineVisitDateTime(date, selectedTime || "18:00"));
    setCalendarOpen(false);
  };

  const setTime = (time) => {
    onChange(combineVisitDateTime(selectedDate || today, time));
  };

  return (
    <div className="space-y-3">
      <input ref={ref} type="hidden" value={value || ""} readOnly />
      <button
        type="button"
        onClick={() => setCalendarOpen((open) => !open)}
        className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-left shadow-sm transition active:scale-[0.99]"
        aria-expanded={calendarOpen}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[--theme-orange] shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className={`flex-1 ${isHebrew ? "text-right" : "text-left"}`}>
            <p className="text-[11px] font-extrabold uppercase text-orange-600">
              {t("apartment_visit_date_label")}
            </p>
            <p className="text-base font-extrabold text-gray-900">
              {selectedDate ? dateFormatter.format(selectedDate) : t("apartment_visit_choose_date")}
            </p>
          </div>
          <ChevronDown className={`h-5 w-5 text-orange-500 transition-transform ${calendarOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {calendarOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-2 shadow-lg"
        >
          <DateCalendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={setDate}
            disabled={{ before: today }}
            locale={isHebrew ? he : enUS}
            showOutsideDays={false}
            className="mx-auto"
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex justify-center pt-2 pb-1 relative items-center",
              caption_label: "text-sm font-extrabold text-gray-900",
              nav_button: "h-9 w-9 rounded-full border border-orange-100 bg-orange-50 p-0 text-orange-600 opacity-100 hover:bg-orange-100",
              table: "w-full border-collapse",
              head_row: "grid grid-cols-7",
              head_cell: "text-gray-400 rounded-md text-center text-[11px] font-extrabold",
              row: "grid grid-cols-7 mt-1",
              cell: "relative p-0 text-center",
              day: "h-10 w-10 rounded-full p-0 text-sm font-extrabold text-gray-700 hover:bg-orange-50",
              day_selected: "bg-[--theme-orange] text-white hover:bg-[--theme-orange] focus:bg-[--theme-orange]",
              day_today: "bg-orange-50 text-[--theme-orange]",
              day_disabled: "text-gray-300 opacity-50",
              day_hidden: "invisible",
            }}
          />
        </motion.div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
        <div className={`mb-2 flex items-center gap-2 text-xs font-extrabold text-gray-500 ${isHebrew ? "justify-end" : ""}`}>
          <Clock className="h-4 w-4 text-[--theme-orange]" />
          <span>{t("apartment_visit_time_label")}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {VISIT_TIME_OPTIONS.map((time) => {
            const active = selectedTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => setTime(time)}
                className={`min-h-11 rounded-xl text-sm font-extrabold transition active:scale-95 ${
                  active
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-100"
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

function ViewingView({
  discovery,
  priceFormatter,
  dateFormatter,
  visitTime,
  visitTimeInputRef,
  setVisitTime,
  rejectionReason,
  setRejectionReason,
  rejectionNote,
  setRejectionNote,
  rejectDialogOpen,
  setRejectDialogOpen,
  onSchedule,
  onReject,
  onChoose,
  isSaving,
}) {
  const { t, i18n } = useTranslation();
  const apartment = discovery.current_apartment || discovery.winning_apartment;
  const score = discovery.eligible_apartments?.find((item) => item.apartment_id === apartment?.id);
  const scheduledDate = discovery.visit_time ? new Date(discovery.visit_time) : null;
  const textAlignClass = isRtlLanguage(i18n) ? "text-right" : "text-left";
  const apartmentAddress = displayAddress(apartment, i18n.language);
  const calendarUrl = scheduledDate
    ? googleCalendarUrl({
      title: t("apartment_calendar_title", { address: apartmentAddress }),
      details: t("apartment_calendar_details"),
      location: apartmentAddress,
      startDate: scheduledDate,
    })
    : "";

  if (!apartment) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-green-500 text-white flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div className={`flex-1 ${textAlignClass}`}>
            <h3 className="text-xl font-extrabold text-gray-900">{t("apartment_viewing_title")}</h3>
            <p className="text-sm text-gray-600 mt-1">{t("apartment_viewing_body")}</p>
          </div>
        </div>
        {score && (
          <p className={`text-xs font-bold text-green-700 mt-3 ${textAlignClass}`}>
            {t("apartment_happiness_score", { points: score.points, amazingVotes: score.amazing_votes })}
          </p>
        )}
      </div>

      <ApartmentSummaryCard apartment={apartment} priceFormatter={priceFormatter} language={i18n.language} />

      <div className="rounded-3xl bg-white border border-orange-100 p-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 text-gray-900">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[--theme-orange] flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className={textAlignClass}>
            <h3 className="font-extrabold text-lg">{t("apartment_schedule_visit")}</h3>
            {!scheduledDate && (
              <p className="text-xs font-bold text-gray-500 mt-0.5">{t("apartment_visit_picker_hint")}</p>
            )}
          </div>
        </div>
        {scheduledDate ? (
          <div className="space-y-3">
            <div className={`rounded-2xl bg-green-50 border border-green-100 px-4 py-3 ${textAlignClass}`}>
              <p className="text-xs font-extrabold text-green-600">{t("apartment_visit_confirmed_label")}</p>
              <p className="mt-1 text-sm font-extrabold text-green-800">
                {t("apartment_visit_scheduled_for", { time: dateFormatter.format(scheduledDate) })}
              </p>
            </div>
            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 py-3 text-sm font-extrabold text-[--theme-orange] active:scale-[0.98] transition-transform"
              >
                <CalendarDays className="h-4 w-4" />
                {t("apartment_add_to_google_calendar")}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ) : (
          <>
            <VisitDateTimePicker
              ref={visitTimeInputRef}
              value={visitTime}
              onChange={setVisitTime}
              language={i18n.language}
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

      <div className={`rounded-3xl bg-white border border-gray-100 p-4 space-y-4 shadow-sm ${textAlignClass}`}>
        <div>
          <p className="text-sm font-extrabold text-gray-900">{t("apartment_visit_decision_title")}</p>
          <p className="mt-1 text-xs font-bold text-gray-500">{t("apartment_visit_decision_body")}</p>
        </div>
        <button
          onClick={onChoose}
          disabled={isSaving || !scheduledDate}
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-extrabold shadow-md active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4" />
          {t("apartment_choose_cta")}
        </button>
        <button
          type="button"
          onClick={() => setRejectDialogOpen(true)}
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-gray-900 text-white font-extrabold shadow-md active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <ThumbsDown className="w-4 h-4" />
          {t("apartment_reject_cta")}
        </button>
      </div>

      <ApartmentRejectionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        rejectionNote={rejectionNote}
        setRejectionNote={setRejectionNote}
        onReject={onReject}
        isSaving={isSaving}
      />
    </div>
  );
}

function ApartmentRejectionDialog({
  open,
  onOpenChange,
  rejectionReason,
  setRejectionReason,
  rejectionNote,
  setRejectionNote,
  onReject,
  isSaving,
}) {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl border-0 p-5">
        <DialogHeader className={textAlignClass}>
          <DialogTitle className="text-xl font-extrabold text-gray-900">
            {t("apartment_rejection_dialog_title")}
          </DialogTitle>
          <DialogDescription className="text-sm font-bold leading-6 text-gray-500">
            {t("apartment_rejection_dialog_body")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className={`text-xs font-extrabold text-gray-500 ${textAlignClass}`}>
              {t("apartment_rejection_reason_label")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {REJECTION_REASONS.map((reason) => {
                const active = rejectionReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className={`min-h-11 rounded-xl border px-3 text-xs font-extrabold transition active:scale-95 ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-100 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {t(`apartment_rejection_reason_${reason}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className={`block space-y-2 ${textAlignClass}`}>
            <span className="text-xs font-extrabold text-gray-500">
              {t("apartment_rejection_note_label")}
            </span>
            <Textarea
              value={rejectionNote}
              onChange={(event) => setRejectionNote(event.target.value)}
              placeholder={t("apartment_rejection_note_placeholder")}
              dir={i18n.dir()}
              className={`min-h-24 resize-none rounded-2xl border-gray-100 bg-gray-50 text-sm font-bold ${textAlignClass}`}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="min-h-12 rounded-2xl border border-gray-100 bg-white text-sm font-extrabold text-gray-700 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => onReject({ reason: rejectionReason, note: rejectionNote })}
              disabled={isSaving}
              className="min-h-12 rounded-2xl bg-gray-900 text-sm font-extrabold text-white active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <ThumbsDown className="w-4 h-4" />
              {t("apartment_reject_cta")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FoundView({ apartment, priceFormatter }) {
  const { t, i18n } = useTranslation();
  const textAlignClass = isRtlLanguage(i18n) ? "text-right" : "text-left";

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl bg-green-50 border border-green-100 p-5 ${textAlignClass}`}>
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
  const isRtl = String(language).toLowerCase().split("-")[0] === "he";
  const textAlignClass = isRtl ? "text-right" : "text-left";
  const priceAlignClass = isRtl ? "text-left" : "text-right";
  const neighborhood = localizedField(apartment, "neighborhood", language) || city;
  const description =
    localizedField(apartment, "description", language)
    || t("apartment_card_description", { bedrooms: apartment.bedrooms });
  const commute = localizedField(apartment, "commute_note", language);

  return (
    <article className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <img src={apartment.image} alt="" className="w-full h-44 object-cover" />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className={textAlignClass}>
            <h3 className="font-extrabold text-gray-900">{neighborhood}</h3>
            <p className="text-xs font-bold text-gray-500 mt-1">{displayAddress(apartment, language)}</p>
          </div>
          <p className={`text-lg font-extrabold text-[--theme-orange] ${priceAlignClass}`}>{priceFormatter.format(apartment.price || 0)}</p>
        </div>
        <p className={`text-sm text-gray-500 leading-6 ${textAlignClass}`}>{description}</p>
        {commute && (
          <div className={`flex items-center gap-1.5 text-xs font-bold text-orange-700 ${textAlignClass}`}>
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{commute}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function NoEligibleState({ onChangePreferences, onFindMore, isSaving }) {
  const { t, i18n } = useTranslation();
  const textAlignClass = isRtlLanguage(i18n) ? "text-right" : "text-left";

  return (
    <div className={`rounded-2xl bg-red-50 border border-red-100 p-4 space-y-4 ${textAlignClass}`}>
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
  const { i18n } = useTranslation();
  const textAlignClass = isRtlLanguage(i18n) ? "text-right" : "text-left";

  return (
    <div className={`rounded-2xl bg-gray-50 border border-gray-100 p-5 ${textAlignClass}`}>
      <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-6 mt-2">{body}</p>
    </div>
  );
}

function NeedsCityState({ discovery }) {
  const { t, i18n } = useTranslation();
  const textAlignClass = isRtlLanguage(i18n) ? "text-right" : "text-left";

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-[--theme-orange]" />
        </div>
        <div className={`flex-1 ${textAlignClass}`}>
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

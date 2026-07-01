import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  Loader2,
  ReceiptText,
  Send,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { ensureTeamApartmentDiscovery } from "@/api/teamApartmentDiscovery";
import { buildDemoServices, findDemoServiceProvider } from "@/lib/demoServices";
import { getLanguageDirection, isRtlLanguage } from "@/lib/languageDirection";
import { useToast } from "@/components/ui/use-toast";

const SERVICE_STATE_KEY = "ruumr_demo_stage3_services";

function apartmentFromDiscovery(discovery) {
  return discovery?.selected_apartment
    || discovery?.current_apartment
    || discovery?.winning_apartment
    || discovery?.suggested_apartments?.[0]
    || null;
}

function loadServiceState(apartmentId) {
  try {
    const raw = window.localStorage?.getItem(`${SERVICE_STATE_KEY}:${apartmentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveServiceState(apartmentId, state) {
  try {
    window.localStorage?.setItem(`${SERVICE_STATE_KEY}:${apartmentId}`, JSON.stringify(state));
  } catch {
    // Demo state is best-effort only.
  }
}

function providerText(provider, language, key) {
  const suffix = language === "he" ? "He" : "En";
  return provider?.[`${key}${suffix}`] || "";
}

function logoPresentation(provider) {
  if (provider.id.startsWith("room-kit")) {
    return {
      heroTileClass: "bg-[#0058a3]",
      tileClass: "bg-[#0058a3]",
      heroImageClass: "w-[78%] max-h-[72%]",
      imageClass: "w-[92%] max-h-[76%]",
    };
  }
  if (provider.id.startsWith("fresh-start")) {
    return {
      heroTileClass: "bg-[#123c69]",
      tileClass: "bg-[#123c69]",
      heroImageClass: "w-full h-full",
      imageClass: "w-full h-full",
    };
  }
  if (provider.id.startsWith("move-squad")) {
    return {
      heroTileClass: "bg-gray-900",
      tileClass: "bg-gray-900",
      heroImageClass: "w-full h-full",
      imageClass: "w-full h-full",
    };
  }
  if (provider.id.startsWith("home-essentials")) {
    return {
      heroTileClass: "bg-gray-50",
      tileClass: "bg-gray-50",
      heroImageClass: "w-[62%] max-h-[58%]",
      imageClass: "w-[76%] max-h-[68%]",
    };
  }
  if (provider.id.startsWith("market-basket")) {
    return {
      heroTileClass: "bg-gray-50",
      tileClass: "bg-gray-50",
      heroImageClass: "w-[58%] max-h-[58%]",
      imageClass: "w-[72%] max-h-[72%]",
    };
  }
  return {
    heroTileClass: "bg-gray-900",
    tileClass: "bg-gray-50",
    heroImageClass: "w-[64%] max-h-[62%]",
    imageClass: "w-[80%] max-h-[74%]",
  };
}

function ProviderHeroLogo({ provider }) {
  const presentation = logoPresentation(provider);
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${presentation.heroTileClass}`}>
      <img src={provider.image} alt="" className={`${presentation.heroImageClass} object-contain opacity-90 block`} />
    </div>
  );
}

function ProviderSmallLogo({ provider }) {
  const presentation = logoPresentation(provider);
  return (
    <span className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${presentation.tileClass}`}>
      <img src={provider.image} alt="" className={`${presentation.imageClass} object-contain block`} />
    </span>
  );
}

function useCopy(language) {
  return language === "he"
    ? {
        loading: "טוענים שירות...",
        back: "חזרה לשירותים",
        notFound: "לא מצאנו את השירות הזה.",
        trusted: "ספק מומלץ לדמו",
        rating: "דירוג",
        timing: "זמינות",
        packageTitle: "מה כלול",
        teamFit: "מתאים לצוות",
        teamFitBody: "אפשר לאסוף הסכמה מהשותפים, להזמין לצוות ולפצל את העלות אחר כך.",
        individualFit: "מתאים אישית",
        individualFitBody: "כל שותף יכול להזמין לעצמו בלי להשפיע על שאר הבית.",
        hybridFit: "אישי או צוותי",
        hybridFitBody: "אפשר להזמין לבד, לפתוח הצבעה או לפצל עלות משותפת.",
        vote: "אני בעד",
        bookTeam: "להזמין לצוות",
        bookMe: "להזמין לעצמי",
        split: "להוסיף לפיצול",
        requested: "הבקשה נשלחה",
        voted: "סומן כהעדפה",
        splitAdded: "נוסף לקופה המשותפת",
        included1: "זמינות מותאמת למיקום הדירה",
        included2: "אפשרות לתיאום עם כל השותפים",
        included3: "מעקב סטטוס בדמו",
        demoNote: "בדמו הזה הפעולה נשמרת מקומית בלבד.",
      }
    : {
        loading: "Loading service...",
        back: "Back to services",
        notFound: "We couldn't find this service.",
        trusted: "Recommended demo partner",
        rating: "Rating",
        timing: "Availability",
        packageTitle: "What's included",
        teamFit: "Built for the team",
        teamFitBody: "Collect roommate agreement, book for the household, and split the cost later.",
        individualFit: "Built for you",
        individualFitBody: "Each roommate can order privately without changing the household plan.",
        hybridFit: "Solo or team",
        hybridFitBody: "Book it yourself, start a team vote, or split the shared cost.",
        vote: "I'm in",
        bookTeam: "Book for team",
        bookMe: "Book for me",
        split: "Add split",
        requested: "Request sent",
        voted: "Marked as preferred",
        splitAdded: "Added to household wallet",
        included1: "Availability matched to the apartment location",
        included2: "Coordination option for all roommates",
        included3: "Demo status tracking",
        demoNote: "For this demo, actions are stored locally only.",
      };
}

export default function ServiceProviderDetail() {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const language = i18n.language === "he" ? "he" : "en";
  const direction = getLanguageDirection(i18n);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";
  const copy = useCopy(language);
  const providerId = searchParams.get("providerId") || "";
  const [state, setState] = useState({ loading: true, discovery: null, serviceState: {} });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await ensureTeamApartmentDiscovery();
        if (cancelled) return;
        const discovery = result.discovery || null;
        const apartment = apartmentFromDiscovery(discovery);
        setState({
          loading: false,
          discovery,
          serviceState: apartment?.id ? loadServiceState(apartment.id) : {},
        });
      } catch (error) {
        console.error("[ruumr] service detail load failed", error);
        if (!cancelled) setState({ loading: false, discovery: null, serviceState: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apartment = apartmentFromDiscovery(state.discovery);
  const provider = findDemoServiceProvider(apartment || {}, providerId);
  const demo = useMemo(() => buildDemoServices(apartment || {}), [apartment]);

  const updateDemoState = (updater) => {
    if (!apartment?.id) return;
    setState((current) => {
      const nextServiceState = typeof updater === "function" ? updater(current.serviceState || {}) : updater;
      saveServiceState(apartment.id, nextServiceState);
      return { ...current, serviceState: nextServiceState };
    });
  };

  const markProvider = (mode) => {
    if (!provider) return;
    updateDemoState((current) => ({
      ...current,
      providers: {
        ...(current.providers || {}),
        [provider.id]: mode,
      },
    }));
    toast({ title: mode === "vote" ? copy.voted : copy.requested });
  };

  const addSplit = () => {
    if (!provider) return;
    updateDemoState((current) => ({
      ...current,
      expenses: {
        ...(current.expenses || {}),
        [`${provider.id}-custom`]: "ready",
      },
      providers: {
        ...(current.providers || {}),
        [provider.id]: current.providers?.[provider.id] || "split",
      },
    }));
    toast({ title: copy.splitAdded });
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={direction}>
        <div className="flex items-center gap-3 text-gray-500 font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-[--theme-orange]" />
          {copy.loading}
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center" dir={direction}>
        <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${textAlignClass}`}>
          <p className="font-extrabold text-gray-900">{copy.notFound}</p>
          <button
            type="button"
            onClick={() => navigate(createPageUrl("ApartmentServices"))}
            className="mt-4 w-full rounded-xl gradient-orange text-white py-3 font-extrabold"
          >
            {copy.back}
          </button>
        </div>
      </div>
    );
  }

  const fitTitle = provider.type === "team" ? copy.teamFit : provider.type === "individual" ? copy.individualFit : copy.hybridFit;
  const fitBody = provider.type === "team" ? copy.teamFitBody : provider.type === "individual" ? copy.individualFitBody : copy.hybridFitBody;
  const status = state.serviceState.providers?.[provider.id] || "";

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-28" dir={direction}>
      <header className="relative h-[330px] overflow-hidden bg-gray-950 text-white">
        <ProviderHeroLogo provider={provider} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-gray-950/35 to-gray-950" />
        <div className={`relative h-full flex flex-col justify-between p-4 ${textAlignClass}`}>
          <button
            type="button"
            onClick={() => navigate(createPageUrl("ApartmentServices"))}
            className="w-11 h-11 rounded-full bg-white/12 backdrop-blur flex items-center justify-center"
            aria-label={copy.back}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/15 px-3 py-1.5 text-xs font-extrabold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-200" />
              {copy.trusted}
            </div>
            <h1 className="text-3xl font-black leading-tight">{providerText(provider, language, "name")}</h1>
            <p className="text-sm text-white/75 leading-6 mt-2">{providerText(provider, language, "tagline")}</p>
          </div>
        </div>
      </header>

      <main className="px-4 -mt-5 relative z-10 space-y-4">
        <section className="grid grid-cols-2 gap-2">
          <div className={`rounded-2xl bg-white border border-gray-100 p-4 shadow-sm ${textAlignClass}`}>
            <Star className="w-5 h-5 text-[--theme-orange] mb-2" />
            <p className="text-xs font-bold text-gray-400">{copy.rating}</p>
            <p className="text-xl font-black text-gray-900">{provider.rating}</p>
          </div>
          <div className={`rounded-2xl bg-white border border-gray-100 p-4 shadow-sm ${textAlignClass}`}>
            <Clock3 className="w-5 h-5 text-[--theme-orange] mb-2" />
            <p className="text-xs font-bold text-gray-400">{copy.timing}</p>
            <p className="text-sm font-black text-gray-900">{providerText(provider, language, "eta")}</p>
          </div>
        </section>

        <section className={`rounded-2xl bg-white border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
          <p className="text-xs font-black text-orange-700 bg-orange-50 inline-flex rounded-full px-3 py-1 mb-3">
            {providerText(provider, language, "deal")}
          </p>
          <h2 className="text-xl font-black text-gray-900">{providerText(provider, language, "price")}</h2>
          <p className="text-sm text-gray-500 leading-6 mt-2">{fitBody}</p>
        </section>

        <section className={`rounded-2xl bg-white border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
          <h2 className="font-black text-gray-900 mb-3">{copy.packageTitle}</h2>
          <div className="space-y-2">
            {[copy.included1, copy.included2, copy.included3].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <span className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-2xl bg-gray-950 text-white p-5 shadow-sm ${textAlignClass}`}>
          <h2 className="text-xl font-black">{fitTitle}</h2>
          <p className="text-sm text-white/60 leading-6 mt-2">{copy.demoNote}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => markProvider("vote")}
              className="min-h-12 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-black flex items-center justify-center gap-2"
            >
              <ReceiptText className="w-4 h-4" />
              {status === "vote" ? copy.voted : copy.vote}
            </button>
            <button
              type="button"
              onClick={() => markProvider(provider.type === "individual" ? "individual" : "team")}
              className="min-h-12 rounded-xl gradient-orange text-white text-sm font-black flex items-center justify-center gap-2"
            >
              {provider.type === "individual" ? <Send className="w-4 h-4" /> : <UsersRound className="w-4 h-4" />}
              {status === "team" || status === "individual" ? copy.requested : provider.type === "individual" ? copy.bookMe : copy.bookTeam}
            </button>
          </div>
          <button
            type="button"
            onClick={addSplit}
            className="mt-2 w-full min-h-12 rounded-xl bg-white text-gray-950 text-sm font-black flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {copy.split}
          </button>
        </section>

        {demo.dailyDeals.length > 0 && (
          <section className={`rounded-2xl bg-white border border-gray-100 p-5 shadow-sm ${textAlignClass}`}>
            <h2 className="font-black text-gray-900 mb-3">{language === "he" ? "עוד דילים יומיומיים" : "More daily deals"}</h2>
            <div className="space-y-2">
              {demo.dailyDeals.filter((deal) => deal.id !== provider.id).slice(0, 2).map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => navigate(`${createPageUrl("ServiceProviderDetail")}?providerId=${encodeURIComponent(deal.id)}`)}
                  className="w-full flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-start"
                >
                  <ProviderSmallLogo provider={deal} />
                  <span className="flex-1">
                    <span className="block font-black text-sm text-gray-900">{providerText(deal, language, "name")}</span>
                    <span className="block text-xs font-bold text-gray-400">{providerText(deal, language, "deal")}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

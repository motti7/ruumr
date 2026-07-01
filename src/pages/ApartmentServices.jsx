import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Droplets,
  HandCoins,
  Home,
  Loader2,
  MapPin,
  PackageCheck,
  Plug,
  Plus,
  ReceiptText,
  Send,
  ShoppingBasket,
  Sparkles,
  SprayCan,
  Truck,
  Utensils,
  UsersRound,
  Wifi,
  WalletCards,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { ensureTeamApartmentDiscovery } from "@/api/teamApartmentDiscovery";
import { User } from "@/entities/User";
import { buildDemoServices } from "@/lib/demoServices";
import { getLanguageDirection, isRtlLanguage } from "@/lib/languageDirection";
import { useToast } from "@/components/ui/use-toast";

const SERVICE_STATE_KEY = "ruumr_demo_stage3_services";

const CATEGORY_ICONS = {
  setup: Plug,
  moving: Truck,
  furniture: PackageCheck,
  cleaning: SprayCan,
  food: Utensils,
};

const EXPENSE_CATEGORIES = [
  { id: "rent", icon: Home, color: "bg-orange-50 text-orange-700" },
  { id: "electricity", icon: Zap, color: "bg-yellow-50 text-yellow-700" },
  { id: "water", icon: Droplets, color: "bg-sky-50 text-sky-700" },
  { id: "internet", icon: Wifi, color: "bg-indigo-50 text-indigo-700" },
  { id: "food", icon: ShoppingBasket, color: "bg-green-50 text-green-700" },
  { id: "other", icon: Banknote, color: "bg-gray-100 text-gray-700" },
];

function text(value, language, fallback = "") {
  return language === "he" ? value?.he || value?.heText || fallback : value?.en || value?.enText || fallback;
}

function providerName(provider, language) {
  return language === "he" ? provider.nameHe : provider.nameEn;
}

function providerTagline(provider, language) {
  return language === "he" ? provider.taglineHe : provider.taglineEn;
}

function providerPrice(provider, language) {
  return language === "he" ? provider.priceHe : provider.priceEn;
}

function providerDeal(provider, language) {
  return language === "he" ? provider.dealHe : provider.dealEn;
}

function providerEta(provider, language) {
  return language === "he" ? provider.etaHe : provider.etaEn;
}

function apartmentFromDiscovery(discovery) {
  return discovery?.selected_apartment
    || discovery?.current_apartment
    || discovery?.winning_apartment
    || discovery?.suggested_apartments?.[0]
    || null;
}

function displayAddress(apartment, language) {
  if (!apartment) return "";
  return language === "he"
    ? apartment.address_he || apartment.address || apartment.neighborhood_he || apartment.neighborhood
    : apartment.address_en || apartment.address || apartment.neighborhood_en || apartment.neighborhood;
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

function useStage3Copy(language) {
  return language === "he"
    ? {
        loading: "מכינים את שירותי הדירה...",
        title: "הדירה נבחרה. עכשיו בואו נעבור בצורה חכמה יותר.",
        subtitle: "סגרו אינטרנט, הובלה, ניקיון, ריהוט והוצאות משותפות בלי לפתוח עוד עשרה צ'אטים.",
        setupScore: "מוכנות לכניסה",
        teamService: "צוותי",
        individualService: "אישי",
        hybridService: "אישי או צוותי",
        recommended: "מומלץ עכשיו",
        dailyDeals: "דילים יומיומיים",
        dailyDealsBody: "אוכל, סופר ודברים קטנים שמחזירים אתכם לאפליקציה גם אחרי המעבר.",
        planTab: "תוכנית",
        servicesTab: "שירותים",
        walletTab: "קופה",
        dealsTab: "דילים",
        snapshot: "תמונת מצב",
        openItems: "פתוחים",
        servicesBooked: "שירותים",
        settleUps: "איזונים",
        allServices: "כל השירותים",
        noServices: "אין שירותים בקטגוריה הזאת.",
        moveInPlan: "תוכנית כניסה",
        householdSplit: "קופה וחלוקת הוצאות",
        splitBody: "הוצאות משותפות מחולקות אוטומטית. כל אחד יכול לסמן ששילם.",
        expenseTracker: "מעקב הוצאות",
        expenseTrackerBody: "שכירות, חשמל, מים, אינטרנט, אוכל וכל הוצאה משותפת במקום אחד.",
        yourBalance: "המאזן שלך",
        youOwe: "את/ה חייב/ת",
        youAreOwed: "חייבים לך",
        allSettled: "הכל מסודר",
        addExpense: "הוספת הוצאה",
        addExpenseInvalid: "צריך שם וסכום תקין.",
        expenseAdded: "ההוצאה נוספה",
        close: "סגירה",
        expenseName: "שם ההוצאה",
        amount: "סכום",
        paidByLabel: "שולם על ידי",
        categoryLabel: "קטגוריה",
        saveExpense: "שמירה",
        markPaid: "סימנתי ששילמתי",
        shareUpdated: "המאזן עודכן",
        paid: "שולם",
        splitWith: "פיצול בין {{count}} שותפים",
        owesTo: "{{from}} חייב/ת ל{{to}}",
        paidByName: "שולם על ידי {{name}}",
        monthlyEssentials: "הוצאות הבית",
        rent: "שכירות",
        electricity: "חשמל",
        water: "מים",
        internet: "אינטרנט",
        food: "אוכל",
        other: "אחר",
        providers: "שירותים מומלצים",
        viewDetails: "פרטים",
        vote: "אני בעד",
        bookTeam: "להזמין לצוות",
        bookMe: "להזמין לעצמי",
        split: "לפצל עלות",
        requested: "נשלח",
        voted: "סומן",
        perPerson: "לשותף",
        paidBy: "שולם/ישולם על ידי {{name}}",
        planned: "מתוכנן",
        ready: "מוכן לפיצול",
        voteState: "מחכה להסכמה",
        openApartment: "פרטי הדירה",
        openStage2: "חזרה לחיפוש הדירה",
        servicesLocked: "Stage 3 זמין בדמו אחרי בחירת דירה.",
        options: "אפשרויות",
      }
    : {
        loading: "Preparing apartment services...",
        title: "Apartment chosen. Now move in smarter.",
        subtitle: "Set up internet, moving, cleaning, furniture, and shared expenses without opening ten more chats.",
        setupScore: "Move-in readiness",
        teamService: "Team",
        individualService: "Individual",
        hybridService: "Solo or team",
        recommended: "Recommended now",
        dailyDeals: "Daily Deals",
        dailyDealsBody: "Food, groceries, and small household wins that keep the app useful after move-in.",
        planTab: "Plan",
        servicesTab: "Services",
        walletTab: "Wallet",
        dealsTab: "Deals",
        snapshot: "Snapshot",
        openItems: "Open",
        servicesBooked: "Services",
        settleUps: "Settle-ups",
        allServices: "All services",
        noServices: "No services in this category.",
        moveInPlan: "Move-in plan",
        householdSplit: "Household wallet",
        splitBody: "Shared expenses are split automatically. Everyone can mark their part as paid.",
        expenseTracker: "Expense tracker",
        expenseTrackerBody: "Rent, electricity, water, internet, food, and every shared household cost in one place.",
        yourBalance: "Your balance",
        youOwe: "You owe",
        youAreOwed: "You are owed",
        allSettled: "All settled",
        addExpense: "Add expense",
        addExpenseInvalid: "Add a name and valid amount.",
        expenseAdded: "Expense added",
        close: "Close",
        expenseName: "Expense name",
        amount: "Amount",
        paidByLabel: "Paid by",
        categoryLabel: "Category",
        saveExpense: "Save expense",
        markPaid: "Mark my share paid",
        shareUpdated: "Balance updated",
        paid: "Paid",
        splitWith: "Split with {{count}} roommates",
        owesTo: "{{from}} owes {{to}}",
        paidByName: "Paid by {{name}}",
        monthlyEssentials: "Household expenses",
        rent: "Rent",
        electricity: "Electricity",
        water: "Water",
        internet: "Internet",
        food: "Food",
        other: "Other",
        providers: "Recommended services",
        viewDetails: "Details",
        vote: "I'm in",
        bookTeam: "Book for team",
        bookMe: "Book for me",
        split: "Split cost",
        requested: "Requested",
        voted: "Marked",
        perPerson: "per roommate",
        paidBy: "Paid/planned by {{name}}",
        planned: "Planned",
        ready: "Ready to split",
        voteState: "Needs agreement",
        openApartment: "Apartment details",
        openStage2: "Back to apartment search",
        servicesLocked: "Stage 3 is available in demo after choosing an apartment.",
        options: "options",
      };
}

function interpolate(template, values) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) => values?.[key] ?? "");
}

function serviceTypeLabel(provider, copy) {
  if (provider.type === "team") return copy.teamService;
  if (provider.type === "individual") return copy.individualService;
  return copy.hybridService;
}

function firstName(name, fallback) {
  return String(name || fallback || "").trim().split(/\s+/)[0] || fallback || "";
}

function localizedMemberName(name, language) {
  const raw = String(name || "").trim();
  const first = firstName(raw, raw);
  const englishNames = {
    "נועם": "Noam",
    "מאיה": "Maya",
    "אורי": "Ori",
    "תמר": "Tamar",
    "ליהי": "Lihi",
    "יובל": "Yuval",
    "איתן": "Eitan",
  };
  const hebrewNames = {
    Eitan: "איתן",
    Noam: "נועם",
    Maya: "מאיה",
    Ori: "אורי",
    Tamar: "תמר",
    Lihi: "ליהי",
    Yuval: "יובל",
  };
  return language === "he" ? hebrewNames[first] || first : englishNames[first] || first;
}

function expenseMembers(discovery, language) {
  const members = (discovery?.team_locations || [])
    .filter((member) => member.user_id)
    .map((member, index) => ({
      id: String(member.user_id),
      name: localizedMemberName(member.name, language) || `${language === "he" ? "שותף" : "Roommate"} ${index + 1}`,
      photo: member.photo || null,
    }));

  if (members.length) return members;

  return language === "he"
    ? [
        { id: "demo-user-noam", name: "נועם" },
        { id: "demo-user-maya", name: "מאיה" },
        { id: "demo-user-ori", name: "אורי" },
      ]
    : [
        { id: "demo-user-noam", name: "Noam" },
        { id: "demo-user-maya", name: "Maya" },
        { id: "demo-user-ori", name: "Ori" },
      ];
}

function buildHouseholdExpenses(apartment, demo, discovery, members, savedExpenses = []) {
  const memberIds = members.map((member) => member.id);
  const payer = (index) => members[index % Math.max(1, members.length)]?.id || "demo-user-noam";
  const rentAmount = Number(apartment?.price || 0) || (demo.cityKey === "beer_sheva" ? 5400 : demo.cityKey === "jerusalem" ? 8600 : 11200);
  const baseExpenses = [
    {
      id: "monthly-rent",
      category: "rent",
      titleEn: "Monthly rent",
      titleHe: "שכר דירה חודשי",
      amount: rentAmount,
      payerId: payer(0),
      dueLabelEn: "Due monthly",
      dueLabelHe: "חודשי",
      recurring: true,
      splitUserIds: memberIds,
    },
    {
      id: "electricity-bill",
      category: "electricity",
      titleEn: "Electricity",
      titleHe: "חשמל",
      amount: demo.cityKey === "beer_sheva" ? 310 : 430,
      payerId: payer(1),
      dueLabelEn: "Next bill",
      dueLabelHe: "החשבון הבא",
      recurring: true,
      splitUserIds: memberIds,
    },
    {
      id: "water-bill",
      category: "water",
      titleEn: "Water",
      titleHe: "מים",
      amount: demo.cityKey === "beer_sheva" ? 145 : 190,
      payerId: payer(2),
      dueLabelEn: "Every 2 months",
      dueLabelHe: "כל חודשיים",
      recurring: true,
      splitUserIds: memberIds,
    },
    {
      id: "internet-monthly",
      category: "internet",
      titleEn: "Internet",
      titleHe: "אינטרנט",
      amount: 149,
      payerId: payer(0),
      dueLabelEn: "Monthly",
      dueLabelHe: "חודשי",
      recurring: true,
      splitUserIds: memberIds,
    },
    {
      id: "shared-groceries",
      category: "food",
      titleEn: "Shared groceries",
      titleHe: "קניות משותפות",
      amount: demo.cityKey === "beer_sheva" ? 260 : 360,
      payerId: payer(1),
      dueLabelEn: "This week",
      dueLabelHe: "השבוע",
      recurring: false,
      splitUserIds: memberIds,
    },
  ];

  return [...baseExpenses, ...(Array.isArray(savedExpenses) ? savedExpenses : [])].map((expense) => ({
    ...expense,
    splitUserIds: expense.splitUserIds?.length ? expense.splitUserIds : memberIds,
  }));
}

function expenseTitle(expense, language) {
  return language === "he" ? expense.titleHe || expense.title || expense.titleEn : expense.titleEn || expense.title || expense.titleHe;
}

function expenseDueLabel(expense, language) {
  return language === "he" ? expense.dueLabelHe || expense.dueLabelEn : expense.dueLabelEn || expense.dueLabelHe;
}

function memberName(members, memberId, fallback = "") {
  return members.find((member) => String(member.id) === String(memberId))?.name || fallback || memberId;
}

function categoryMeta(categoryId) {
  return EXPENSE_CATEGORIES.find((category) => category.id === categoryId) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

function categoryLabel(categoryId, copy) {
  return copy[categoryId] || categoryId;
}

function calculateBalances(expenses, paidShares = {}, members = []) {
  const balances = Object.fromEntries(members.map((member) => [member.id, 0]));
  expenses.forEach((expense) => {
    const amount = Number(expense.amount || 0);
    const splitUserIds = (expense.splitUserIds || members.map((member) => member.id)).filter((id) => balances[id] !== undefined);
    if (!amount || !splitUserIds.length || balances[expense.payerId] === undefined) return;

    const share = amount / splitUserIds.length;
    balances[expense.payerId] += amount;
    splitUserIds.forEach((memberId) => {
      balances[memberId] -= share;
      if (memberId !== expense.payerId && paidShares?.[expense.id]?.[memberId]) {
        balances[memberId] += share;
        balances[expense.payerId] -= share;
      }
    });
  });

  return balances;
}

function calculateSettlements(balances, members) {
  const debtors = Object.entries(balances)
    .filter(([, value]) => value < -0.5)
    .map(([id, value]) => ({ id, amount: Math.abs(value) }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, value]) => value > 0.5)
    .map(([id, value]) => ({ id, amount: value }))
    .sort((a, b) => b.amount - a.amount);
  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);
    settlements.push({
      fromId: debtor.id,
      toId: creditor.id,
      amount,
      fromName: memberName(members, debtor.id),
      toName: memberName(members, creditor.id),
    });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.5) debtorIndex += 1;
    if (creditor.amount < 0.5) creditorIndex += 1;
  }

  return settlements;
}

export default function ApartmentServices() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const language = i18n.language === "he" ? "he" : "en";
  const direction = getLanguageDirection(i18n);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";
  const copy = useStage3Copy(language);
  const [state, setState] = useState({ loading: true, discovery: null, user: null });
  const [serviceState, setServiceState] = useState({});
  const [activeTab, setActiveTab] = useState("plan");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "other",
    payerId: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [user, result] = await Promise.all([
          User.me().catch(() => null),
          ensureTeamApartmentDiscovery(),
        ]);
        if (cancelled) return;
        const discovery = result.discovery || null;
        const apartment = apartmentFromDiscovery(discovery);
        setState({ loading: false, discovery, user });
        setServiceState(apartment?.id ? loadServiceState(apartment.id) : {});
      } catch (error) {
        console.error("[ruumr] apartment services load failed", error);
        if (!cancelled) setState({ loading: false, discovery: null, user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apartment = apartmentFromDiscovery(state.discovery);
  const demo = useMemo(() => buildDemoServices(apartment || {}), [apartment]);
  const members = useMemo(() => expenseMembers(state.discovery, language), [state.discovery, language]);
  const currentMemberId = members.find((member) => String(member.id) === String(state.user?.id))?.id || members[0]?.id || "demo-user-noam";
  const householdExpenses = useMemo(
    () => buildHouseholdExpenses(apartment, demo, state.discovery, members, serviceState.walletExpenses),
    [apartment, demo, members, serviceState.walletExpenses, state.discovery]
  );
  const balances = useMemo(
    () => calculateBalances(householdExpenses, serviceState.paidShares || {}, members),
    [householdExpenses, members, serviceState.paidShares]
  );
  const settlements = useMemo(() => calculateSettlements(balances, members), [balances, members]);
  const currentBalance = balances[currentMemberId] || 0;
  const currentOwes = settlements
    .filter((settlement) => settlement.fromId === currentMemberId)
    .reduce((sum, settlement) => sum + settlement.amount, 0);
  const currentOwed = settlements
    .filter((settlement) => settlement.toId === currentMemberId)
    .reduce((sum, settlement) => sum + settlement.amount, 0);
  const readyCount = demo.moveInTasks.filter((task) => task.done || serviceState.tasks?.[task.id]).length;
  const readiness = Math.round((readyCount / demo.moveInTasks.length) * 100);
  const pendingTaskCount = Math.max(0, demo.moveInTasks.length - readyCount);
  const serviceCategories = demo.categories.filter((category) => category.id !== "food");
  const serviceProviders = demo.providers.filter((provider) => provider.category !== "food");
  const filteredServiceProviders = categoryFilter === "all"
    ? serviceProviders
    : serviceProviders.filter((provider) => provider.category === categoryFilter);
  const bookedServicesCount = Object.values(serviceState.providers || {})
    .filter((mode) => ["team", "individual", "split"].includes(mode))
    .length;
  const expenseFormatter = useMemo(
    () => new Intl.NumberFormat(language === "he" ? "he-IL" : "en-US", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }),
    [language]
  );

  const updateDemoState = (updater) => {
    if (!apartment?.id) return;
    setServiceState((current) => {
      const next = typeof updater === "function" ? updater(current || {}) : updater;
      saveServiceState(apartment.id, next);
      return next;
    });
  };

  const markProvider = (provider, mode) => {
    updateDemoState((current) => ({
      ...current,
      providers: {
        ...(current.providers || {}),
        [provider.id]: mode,
      },
    }));
    toast({ title: mode === "vote" ? copy.voted : copy.requested });
  };

  const markTask = (taskId) => {
    updateDemoState((current) => ({
      ...current,
      tasks: {
        ...(current.tasks || {}),
        [taskId]: !current.tasks?.[taskId],
      },
    }));
  };

  const toggleMySharePaid = (expense) => {
    updateDemoState((current) => ({
      ...current,
      paidShares: {
        ...(current.paidShares || {}),
        [expense.id]: {
          ...(current.paidShares?.[expense.id] || {}),
          [currentMemberId]: !current.paidShares?.[expense.id]?.[currentMemberId],
        },
      },
    }));
    toast({ title: copy.shareUpdated });
  };

  const addHouseholdExpense = () => {
    const amount = Number(expenseForm.amount);
    const title = expenseForm.title.trim();
    if (!title || !Number.isFinite(amount) || amount <= 0) {
      toast({ title: copy.addExpenseInvalid });
      return;
    }
    const payerId = expenseForm.payerId || currentMemberId;
    const expense = {
      id: `custom-${Date.now()}`,
      category: expenseForm.category || "other",
      title,
      titleEn: title,
      titleHe: title,
      amount,
      payerId,
      dueLabelEn: "Added now",
      dueLabelHe: "נוסף עכשיו",
      recurring: false,
      splitUserIds: members.map((member) => member.id),
    };
    updateDemoState((current) => ({
      ...current,
      walletExpenses: [...(current.walletExpenses || []), expense],
    }));
    setExpenseForm({ title: "", amount: "", category: "other", payerId });
    setShowExpenseForm(false);
    toast({ title: copy.expenseAdded });
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

  if (!apartment) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center" dir={direction}>
        <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${textAlignClass}`}>
          <p className="font-extrabold text-gray-900">{copy.servicesLocked}</p>
          <button
            type="button"
            onClick={() => navigate(createPageUrl("Home"))}
            className="mt-4 w-full rounded-xl gradient-orange text-white py-3 font-extrabold"
          >
            {copy.openStage2}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-28" dir={direction}>
      <header className="relative overflow-hidden bg-gray-950 text-white">
        <img src={apartment.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-gray-950/70 to-gray-950" />
        <div className={`relative px-4 pt-5 pb-7 space-y-5 ${textAlignClass}`}>
          <button
            type="button"
            onClick={() => navigate(`${createPageUrl("ApartmentDetail")}?apartmentId=${encodeURIComponent(apartment.id)}`)}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
            aria-label={copy.openApartment}
          >
            <ArrowRight className={`w-5 h-5 ${isRtl ? "" : "rotate-180"}`} />
          </button>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/15 px-3 py-1.5 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5 text-orange-200" />
              {copy.recommended}
            </div>
            <h1 className="text-3xl font-black leading-tight">{copy.title}</h1>
            <p className="text-sm text-white/75 leading-6">{copy.subtitle}</p>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white/60 truncate">{displayAddress(apartment, language)}</p>
                <p className="text-lg font-black truncate">{demo.city[language]}</p>
              </div>
              <div className="w-[112px] min-h-[86px] rounded-3xl bg-white text-gray-950 flex flex-col items-center justify-center px-3 py-3 flex-shrink-0">
                <span className="text-3xl leading-none font-black">{readiness}%</span>
                <span className="mt-1 text-[12px] leading-tight font-extrabold text-gray-500 text-center max-w-[88px]">
                  {copy.setupScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 -mt-3 relative z-10 space-y-4">
        <StageTabs activeTab={activeTab} setActiveTab={setActiveTab} copy={copy} />

        {activeTab === "plan" && (
          <div className="space-y-4">
            <section className={`rounded-2xl bg-white border border-gray-100 p-4 shadow-sm ${textAlignClass}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-black text-gray-900">{copy.snapshot}</h2>
                <Sparkles className="w-5 h-5 text-[--theme-orange]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatusTile label={copy.setupScore} value={`${readiness}%`} tone="dark" />
                <StatusTile label={copy.openItems} value={pendingTaskCount} tone="orange" />
                <StatusTile label={copy.servicesBooked} value={bookedServicesCount} tone="green" />
                <StatusTile label={copy.settleUps} value={settlements.length} tone="blue" />
              </div>
            </section>

            <section className={`rounded-2xl bg-white border border-gray-100 p-4 shadow-sm ${textAlignClass}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-black text-gray-900">{copy.moveInPlan}</h2>
                <Clock3 className="w-5 h-5 text-[--theme-orange]" />
              </div>
              <div className="space-y-2">
                {demo.moveInTasks.map((task) => {
                  const done = task.done || Boolean(serviceState.tasks?.[task.id]);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => markTask(task.id)}
                      className="w-full min-h-12 flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-start active:bg-gray-100"
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-300"}`}>
                        <Check className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-sm text-gray-800">{language === "he" ? task.he : task.en}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              {serviceCategories.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] || Wrench;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveTab("services");
                      setCategoryFilter(category.id);
                    }}
                    className={`rounded-2xl bg-white border border-gray-100 p-3 shadow-sm ${textAlignClass} active:bg-gray-50`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[--theme-orange] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-black text-gray-900 text-sm">{text(category, language)}</p>
                    <p className="text-[11px] font-bold text-gray-400 mt-0.5">{category.count} {copy.options}</p>
                  </button>
                );
              })}
            </section>
          </div>
        )}

        {activeTab === "services" && (
          <section className="space-y-3">
            <div className={`flex items-center justify-between ${textAlignClass}`}>
              <h2 className="text-lg font-black text-gray-900">{copy.providers}</h2>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`snap-start min-h-11 rounded-full px-4 text-xs font-black whitespace-nowrap ${categoryFilter === "all" ? "bg-gray-950 text-white" : "bg-white border border-gray-100 text-gray-700"}`}
              >
                {copy.allServices}
              </button>
              {serviceCategories.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] || Wrench;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryFilter(category.id)}
                    className={`snap-start min-h-11 rounded-full px-4 text-xs font-black whitespace-nowrap inline-flex items-center gap-1 ${categoryFilter === category.id ? "bg-gray-950 text-white" : "bg-white border border-gray-100 text-gray-700"}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {text(category, language)}
                  </button>
                );
              })}
            </div>
            {filteredServiceProviders.length === 0 ? (
              <div className={`rounded-2xl bg-white border border-gray-100 p-5 text-sm font-bold text-gray-500 ${textAlignClass}`}>
                {copy.noServices}
              </div>
            ) : (
              filteredServiceProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  copy={copy}
                  language={language}
                  status={serviceState.providers?.[provider.id]}
                  onDetails={() => navigate(`${createPageUrl("ServiceProviderDetail")}?providerId=${encodeURIComponent(provider.id)}`)}
                  onPrimary={() => markProvider(provider, provider.type === "individual" ? "individual" : "team")}
                  onVote={() => markProvider(provider, "vote")}
                  textAlignClass={textAlignClass}
                />
              ))
            )}
          </section>
        )}

        {activeTab === "wallet" && (
          <section className={`rounded-2xl bg-white border border-gray-100 p-4 shadow-sm ${textAlignClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-gray-900">{copy.expenseTracker}</h2>
                <p className="text-sm text-gray-500 leading-6 mt-1">{copy.expenseTrackerBody}</p>
              </div>
              <WalletCards className="w-6 h-6 text-[--theme-orange] flex-shrink-0" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-gray-950 text-white p-3">
                <p className="text-[11px] font-extrabold text-white/55">{copy.yourBalance}</p>
                <p className="text-lg font-black mt-1">{expenseFormatter.format(Math.abs(Math.round(currentBalance)))}</p>
                <p className="text-[11px] font-bold text-white/55 mt-0.5">
                  {Math.abs(currentBalance) < 1 ? copy.allSettled : currentBalance < 0 ? copy.youOwe : copy.youAreOwed}
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3">
                <p className="text-[11px] font-extrabold text-red-700">{copy.youOwe}</p>
                <p className="text-lg font-black text-red-900 mt-1">{expenseFormatter.format(Math.round(currentOwes))}</p>
              </div>
              <div className="rounded-2xl bg-green-50 p-3">
                <p className="text-[11px] font-extrabold text-green-700">{copy.youAreOwed}</p>
                <p className="text-lg font-black text-green-900 mt-1">{expenseFormatter.format(Math.round(currentOwed))}</p>
              </div>
            </div>

            {settlements.length > 0 && (
              <div className="mt-3 rounded-2xl bg-orange-50 p-3 space-y-2">
                {settlements.slice(0, 3).map((settlement) => (
                  <div key={`${settlement.fromId}-${settlement.toId}`} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <HandCoins className="w-4 h-4 text-orange-700 flex-shrink-0" />
                      <p className="text-xs font-extrabold text-orange-900 truncate">
                        {interpolate(copy.owesTo, { from: settlement.fromName, to: settlement.toName })}
                      </p>
                    </div>
                    <p className="text-sm font-black text-orange-900 flex-shrink-0">{expenseFormatter.format(Math.round(settlement.amount))}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <h3 className="font-black text-gray-900">{copy.monthlyEssentials}</h3>
              <button
                type="button"
                onClick={() => {
                  setExpenseForm((current) => ({ ...current, payerId: current.payerId || currentMemberId }));
                  setShowExpenseForm((visible) => !visible);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white px-3 py-2 min-h-11 text-xs font-extrabold"
              >
                {showExpenseForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showExpenseForm ? copy.close : copy.addExpense}
              </button>
            </div>

            {showExpenseForm && (
              <div className="mt-3 rounded-2xl bg-gray-50 p-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-extrabold text-gray-400">{copy.expenseName}</span>
                  <input
                    value={expenseForm.title}
                    onChange={(event) => setExpenseForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder={copy.expenseName}
                    className={`w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-[--theme-orange] ${textAlignClass}`}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-extrabold text-gray-400">{copy.amount}</span>
                    <input
                      value={expenseForm.amount}
                      onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                      inputMode="decimal"
                      placeholder={copy.amount}
                      className={`h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-[--theme-orange] ${textAlignClass}`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-extrabold text-gray-400">{copy.paidByLabel}</span>
                    <select
                      value={expenseForm.payerId || currentMemberId}
                      onChange={(event) => setExpenseForm((current) => ({ ...current, payerId: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-[--theme-orange]"
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-extrabold text-gray-400">{copy.categoryLabel}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const active = expenseForm.category === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setExpenseForm((current) => ({ ...current, category: category.id }))}
                          className={`min-h-11 rounded-xl text-xs font-black flex items-center justify-center gap-1 ${active ? "bg-orange-600 text-white" : "bg-white text-gray-700 border border-gray-200"}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {categoryLabel(category.id, copy)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addHouseholdExpense}
                  className="w-full min-h-11 rounded-xl gradient-orange text-white text-sm font-black disabled:opacity-50"
                  disabled={!expenseForm.title.trim() || !Number.isFinite(Number(expenseForm.amount)) || Number(expenseForm.amount) <= 0}
                >
                  {copy.saveExpense}
                </button>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {householdExpenses.map((expense) => {
                const meta = categoryMeta(expense.category);
                const Icon = meta.icon;
                const paid = Boolean(serviceState.paidShares?.[expense.id]?.[currentMemberId]);
                const splitCount = Math.max(1, expense.splitUserIds?.length || members.length);
                const share = Number(expense.amount || 0) / splitCount;
                const payer = memberName(members, expense.payerId, copy.paid);
                return (
                  <div key={expense.id} className="rounded-2xl bg-gray-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black text-sm text-gray-900 truncate">{expenseTitle(expense, language)}</p>
                            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                              {interpolate(copy.paidByName, { name: payer })} · {expenseDueLabel(expense, language)}
                            </p>
                          </div>
                          <div className={isRtl ? "text-left" : "text-right"}>
                            <p className="font-black text-gray-900">{expenseFormatter.format(Number(expense.amount || 0))}</p>
                            <p className="text-[11px] font-bold text-gray-400">{expenseFormatter.format(Math.round(share))} {copy.perPerson}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-gray-500">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {interpolate(copy.splitWith, { count: splitCount })}
                          </span>
                          {expense.payerId !== currentMemberId && (
                            <button
                              type="button"
                              onClick={() => toggleMySharePaid(expense)}
                              className={`min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold ${paid ? "bg-green-600 text-white" : "bg-gray-900 text-white"}`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {paid ? copy.paid : copy.markPaid}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "deals" && (
          <section className={`rounded-2xl bg-gray-950 text-white p-4 shadow-sm ${textAlignClass}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-black">{copy.dailyDeals}</h2>
                <p className="text-sm text-white/60 leading-6 mt-1">{copy.dailyDealsBody}</p>
              </div>
              <Utensils className="w-6 h-6 text-orange-200 flex-shrink-0" />
            </div>
            <div className="space-y-3">
              {demo.dailyDeals.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => navigate(`${createPageUrl("ServiceProviderDetail")}?providerId=${encodeURIComponent(provider.id)}`)}
                  className={`w-full rounded-2xl bg-white/10 border border-white/10 p-3 ${textAlignClass} active:bg-white/15`}
                >
                  <div className="grid grid-cols-[92px_1fr] gap-3">
                    <ProviderLogo provider={provider} variant="deal" />
                    <div className="min-w-0">
                      <p className="font-black">{providerName(provider, language)}</p>
                      <p className="text-xs font-bold text-orange-100 mt-1">{providerDeal(provider, language)}</p>
                      <p className="text-xs text-white/55 leading-5 mt-2">{providerTagline(provider, language)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StageTabs({ activeTab, setActiveTab, copy }) {
  const tabs = [
    { id: "plan", label: copy.planTab, icon: Check },
    { id: "services", label: copy.servicesTab, icon: PackageCheck },
    { id: "wallet", label: copy.walletTab, icon: WalletCards },
    { id: "deals", label: copy.dealsTab, icon: Utensils },
  ];

  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-[#f7f7f5]/95 backdrop-blur border-b border-gray-100">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white border border-gray-100 p-1 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 rounded-xl text-[11px] font-black flex flex-col items-center justify-center gap-0.5 ${
                active ? "bg-gray-950 text-white" : "text-gray-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-full px-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusTile({ label, value, tone }) {
  const toneClass =
    tone === "dark"
      ? "bg-gray-950 text-white"
      : tone === "green"
        ? "bg-green-50 text-green-900"
        : tone === "blue"
          ? "bg-sky-50 text-sky-900"
          : "bg-orange-50 text-orange-900";

  return (
    <div className={`rounded-2xl p-3 min-h-[82px] ${toneClass}`}>
      <p className="text-[11px] font-extrabold opacity-65">{label}</p>
      <p className="text-2xl leading-none font-black mt-2">{value}</p>
    </div>
  );
}

function logoPresentation(provider) {
  if (provider.id.startsWith("room-kit")) {
    return {
      tileClass: "bg-[#0058a3]",
      imageClass: "w-[94%] max-h-[78%]",
    };
  }
  if (provider.id.startsWith("fresh-start")) {
    return {
      tileClass: "bg-[#123c69]",
      imageClass: "w-full h-full",
    };
  }
  if (provider.id.startsWith("move-squad")) {
    return {
      tileClass: "bg-gray-900",
      imageClass: "w-full h-full",
    };
  }
  if (provider.id.startsWith("home-essentials")) {
    return {
      tileClass: "bg-gray-50",
      imageClass: "w-[78%] max-h-[70%]",
    };
  }
  if (provider.id.startsWith("market-basket")) {
    return {
      tileClass: "bg-gray-50",
      imageClass: "w-[72%] max-h-[72%]",
    };
  }
  return {
    tileClass: "bg-gray-50",
    imageClass: "w-[82%] max-h-[76%]",
  };
}

function ProviderLogo({ provider, variant = "card" }) {
  const presentation = logoPresentation(provider);
  const sizeClass = variant === "deal" ? "w-full h-24" : "w-full h-full min-h-[126px]";
  const tileTone = variant === "deal" && !provider.id.startsWith("room-kit") ? "bg-white/10" : presentation.tileClass;

  return (
    <div className={`${sizeClass} rounded-xl ${tileTone} overflow-hidden flex items-center justify-center`}>
      <img
        src={provider.image}
        alt=""
        className={`${presentation.imageClass} object-contain block`}
      />
    </div>
  );
}

function ProviderCard({ provider, copy, language, status, onDetails, onPrimary, onVote, textAlignClass }) {
  const primaryLabel =
    status === "team" || status === "individual"
      ? copy.requested
      : provider.type === "individual"
        ? copy.bookMe
        : provider.type === "team"
          ? copy.bookTeam
          : copy.bookTeam;

  return (
    <article className={`rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden ${textAlignClass}`}>
      <div className="grid grid-cols-[104px_1fr] gap-3 p-3">
        <ProviderLogo provider={provider} />
        <div className="min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-gray-900 leading-5">{providerName(provider, language)}</p>
              <p className="text-xs font-bold text-gray-400 mt-1">{serviceTypeLabel(provider, copy)} · {provider.rating}</p>
            </div>
            <span className="rounded-full bg-orange-50 text-orange-700 px-2.5 py-1 text-[10px] font-black whitespace-nowrap">
              {providerDeal(provider, language)}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-5 mt-2">{providerTagline(provider, language)}</p>
          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-black text-gray-900">{providerPrice(provider, language)}</p>
              <p className="text-[11px] font-bold text-gray-400">{providerEta(provider, language)}</p>
            </div>
            <button
              type="button"
              onClick={onDetails}
              className="w-11 h-11 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-700"
              aria-label={copy.viewDetails}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={onVote}
          className="min-h-11 rounded-xl bg-orange-50 text-orange-700 text-xs font-black flex items-center justify-center gap-1"
        >
          <ReceiptText className="w-4 h-4" />
          {status === "vote" ? copy.voted : copy.vote}
        </button>
        <button
          type="button"
          onClick={onPrimary}
          className="min-h-11 rounded-xl bg-gray-900 text-white text-xs font-black flex items-center justify-center gap-1"
        >
          {provider.type === "individual" ? <Send className="w-4 h-4" /> : <UsersRound className="w-4 h-4" />}
          {primaryLabel}
        </button>
      </div>
    </article>
  );
}

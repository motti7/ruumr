import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Building2, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { ensureTeamApartmentDiscovery } from "@/api/teamApartmentDiscovery";
import { getLanguageDirection, isRtlLanguage } from "@/lib/languageDirection";

function apartmentFromDiscovery(discovery, apartmentId) {
  const all = [
    ...(discovery?.suggested_apartments || []),
    discovery?.current_apartment,
    discovery?.selected_apartment,
    discovery?.winning_apartment,
  ].filter(Boolean);
  return all.find((apartment) => String(apartment.id) === String(apartmentId)) || all[0] || null;
}

function apartmentChatGroupId(teamKey, apartmentId) {
  return `${teamKey}_apt_${apartmentId}`;
}

function displayAddress(apartment, language) {
  return language === "he"
    ? apartment?.address_he || apartment?.address
    : apartment?.address_en || apartment?.address;
}

function messageContent(message, language) {
  return language === "he" ? message.content : message.content_en || message.content;
}

export default function ApartmentChat() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apartmentId = searchParams.get("apartmentId") || "";
  const [state, setState] = useState({
    loading: true,
    user: null,
    discovery: null,
    apartment: null,
    messages: [],
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const direction = getLanguageDirection(i18n);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";

  const groupId = useMemo(
    () => state.discovery?.team_key && state.apartment?.id
      ? apartmentChatGroupId(state.discovery.team_key, state.apartment.id)
      : "",
    [state.apartment?.id, state.discovery?.team_key]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [user, result] = await Promise.all([
          User.me(),
          ensureTeamApartmentDiscovery(),
        ]);
        const discovery = result.discovery || null;
        const apartment = apartmentFromDiscovery(discovery, apartmentId);
        const gid = discovery?.team_key && apartment?.id ? apartmentChatGroupId(discovery.team_key, apartment.id) : "";
        const messages = gid ? await base44.entities.GroupMessage.filter({ group_id: gid }) : [];
        messages.sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
        if (!cancelled) {
          setState({ loading: false, user, discovery, apartment, messages });
        }
      } catch (error) {
        console.error("[ruumr] apartment chat load failed", error);
        if (!cancelled) setState((current) => ({ ...current, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = base44.entities.GroupMessage.subscribe((event) => {
      if (event.data?.group_id !== groupId) return;
      if (event.type === "create") {
        setState((current) => {
          if (current.messages.find((message) => message.id === event.id)) return current;
          return {
            ...current,
            messages: [...current.messages, event.data].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()),
          };
        });
      }
    });
    return unsubscribe;
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending || !groupId || !state.user || !state.apartment) return;
    setInput("");
    setSending(true);
    try {
      const profile = state.discovery?.team_locations?.find((item) => String(item.user_id) === String(state.user.id));
      const sent = await base44.entities.GroupMessage.create({
        group_id: groupId,
        sender_id: state.user.id,
        sender_name: state.user.full_name || state.user.name || t("me"),
        sender_photo: profile?.photo || null,
        content,
        content_en: i18n.language === "en" ? content : "",
        apartment_id: state.apartment.id,
      });
      setState((current) => ({
        ...current,
        messages: current.messages.find((message) => message.id === sent.id)
          ? current.messages
          : [...current.messages, sent].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime()),
      }));
    } catch (error) {
      console.error("[ruumr] apartment chat send failed", error);
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!state.apartment) {
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

  return (
    <div className="flex flex-col h-screen bg-gray-50" dir={direction}>
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(`${createPageUrl("ApartmentDetail")}?apartmentId=${encodeURIComponent(state.apartment.id)}`)}
          className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[--theme-orange] flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <div className={`${textAlignClass} min-w-0 flex-1`}>
          <p className="font-black text-gray-900 text-sm truncate">{t("apartment_chat_title")}</p>
          <p className="text-[11px] text-gray-400 truncate">{displayAddress(state.apartment, i18n.language)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {state.messages.map((message) => {
          const isMe = message.sender_id === state.user?.id;
          const rowSideClass = isMe
            ? isRtl ? "justify-end" : "justify-start"
            : isRtl ? "justify-start" : "justify-end";
          const stackSideClass = isMe
            ? isRtl ? "items-end" : "items-start"
            : isRtl ? "items-start" : "items-end";
          const bubbleTextClass = isRtl ? "text-right" : "text-left";
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${rowSideClass}`}
            >
              <div className={`max-w-[78%] ${stackSideClass} flex flex-col gap-1`}>
                {!isMe && <span className="text-[10px] text-gray-400 font-bold px-1">{message.sender_name}</span>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${bubbleTextClass} ${
                  isMe ? "gradient-orange text-white" : "bg-white border border-gray-100 text-gray-800 shadow-sm"
                }`}>
                  {messageContent(message, i18n.language)}
                </div>
              </div>
            </motion.div>
          );
        })}
        {state.messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-bold text-gray-400">{t("apartment_chat_empty")}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("apartment_chat_placeholder")}
          dir={direction}
          className={`flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400 ${textAlignClass}`}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="min-w-[44px] min-h-[44px] gradient-orange rounded-full flex items-center justify-center shadow-md disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
          aria-label={t("send_message")}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

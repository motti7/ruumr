import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Send, UsersRound } from "lucide-react";
import SmartImage from "@/components/shared/SmartImage";
import VirtualizedMessageList from "@/components/shared/VirtualizedMessageList";
import { useMutationWithOptimistic } from "@/hooks/useMutationWithOptimistic";
import { Button } from "@/components/ui/button";
import {
  PremiumCard,
  PremiumPill,
} from "@/components/shared/PremiumPageFrame";

export default function GroupChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [groupId, setGroupId] = useState(null);
  const bottomRef = useRef(null);

  // group_id = the lowest user_id among all team member IDs + my ID (stable identifier)
  const buildGroupId = (myId, memberIds) => {
    const all = [myId, ...memberIds].sort();
    return all.join("_");
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const profiles = await base44.entities.Profile.filter({ user_id: userData.id });
        if (profiles.length === 0) { navigate(createPageUrl('GroupTracker')); return; }
        const prof = profiles[0];
        setMyProfile(prof);

        const members = prof.team_members || [];
        setTeamMembers(members);

        const gid = buildGroupId(userData.id, members.map(m => m.match_id));
        setGroupId(gid);

        const msgs = await base44.entities.GroupMessage.filter({ group_id: gid });
        msgs.sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
        setMessages(msgs);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  // Real-time subscription
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = base44.entities.GroupMessage.subscribe((event) => {
      if (event.data?.group_id !== groupId) return;
      if (event.type === "create") {
        setMessages(prev => {
          if (prev.find(m => m.id === event.id)) return prev;
          return [...prev, event.data].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
        });
      }
    });
    return unsubscribe;
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Optimistic mutation for group messages
  const messageMutation = /** @type {any} */ (useMutationWithOptimistic(
    (messageData) => base44.entities.GroupMessage.create(messageData),
    {
      queryKey: ['groupchat', groupId],
      updateFn: (oldMessages = [], newMessage) => [...oldMessages, newMessage],
    }
  ));

  const sendMessage = async () => {
    if (!input.trim() || isSending || !groupId || !user) return;
    setIsSending(true);
    const text = input.trim();
    setInput("");
    try {
      await messageMutation.mutateAsync({
        group_id: groupId,
        sender_id: user.id,
        sender_name: user.full_name || "אני",
        sender_photo: myProfile?.photos?.[0] || null,
        content: text,
      });
    } catch (error) {
      console.error("Error sending group message:", error);
      setInput(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const allParticipants = [
    { id: user?.id, name: "אני", photo: myProfile?.photos?.[0] },
    ...teamMembers.map(m => ({ id: m.match_id, name: m.name?.split(' ')[0], photo: m.photo }))
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
            <UsersRound className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-slate-500">טוען צ'אט קבוצתי...</p>
        </div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)] p-8 text-center" dir="rtl">
        <PremiumCard className="max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <UsersRound className="h-8 w-8" />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950">אין עדיין צוות</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">הוסף/י שותפים לצוות כדי להתחיל צ'אט קבוצתי.</p>
          <Button
            onClick={() => navigate(createPageUrl("GroupTracker"))}
            className="mt-5 rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
          >
            לבניית הצוות
          </Button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)]" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.88),_transparent_24%)]" />

      <div className="relative px-4 pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
        <PremiumCard className="p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(createPageUrl("GroupTracker"))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-transform hover:scale-[1.02]"
              aria-label="חזור"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="flex -space-x-2 space-x-reverse">
              {allParticipants.slice(0, 4).map((p, i) => (
                <div key={i} className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm flex-shrink-0">
                  {p.photo ? (
                    <SmartImage src={p.photo} alt={p.name} className="h-full w-full" priority={false} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-xs font-black text-white">
                      {p.name?.[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1 text-right">
              <div className="flex items-center justify-end gap-2">
                <p className="text-lg font-black text-slate-950">צ'אט הצוות</p>
                <PremiumPill tone="emerald">פעיל עכשיו</PremiumPill>
              </div>
              <p className="text-[10px] text-slate-400">{allParticipants.length} משתתפים</p>
            </div>
          </div>
        </PremiumCard>
      </div>

      <div className="relative flex-1 px-3 pb-2 pt-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <PremiumCard className="max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-slate-100 text-slate-400">
                <UsersRound className="h-7 w-7" />
              </div>
              <p className="mt-4 text-xl font-black text-slate-950">שלחו הודעה ראשונה לצוות</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">כאן תתחיל השיחה שתהפוך את התיאום להרבה יותר פשוט.</p>
            </PremiumCard>
          </div>
        ) : (
          <VirtualizedMessageList
            messages={messages}
            containerHeight="flex-1"
            renderMessage={(msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isMe && (
                    <div className="mb-1 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
                      {msg.sender_photo ? (
                        <SmartImage src={msg.sender_photo} alt={msg.sender_name} className="h-full w-full" priority={false} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-black text-slate-500">
                          {msg.sender_name?.[0]}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex max-w-[78%] flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="px-1 text-[10px] font-medium text-slate-400">{msg.sender_name}</span>
                    )}
                    <div
                      className={`rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? "rounded-tr-sm bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white"
                          : "rounded-tl-sm border border-slate-100 bg-white text-slate-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="px-1 text-[9px] text-slate-300">
                      {new Date(msg.created_date).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              );
            }}
          />
        )}
      </div>

      <div
        className="relative px-4 pb-3 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <PremiumCard className="flex items-center gap-3 p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="כתוב/כתבי הודעה לצוות..."
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[--theme-orange] focus:ring-2 focus:ring-orange-100"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="h-12 w-12 rounded-full bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] p-0 text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)] disabled:opacity-40"
            aria-label="שלח הודעה"
          >
            <Send className="h-4 w-4" />
          </Button>
        </PremiumCard>
      </div>
    </div>
  );
}

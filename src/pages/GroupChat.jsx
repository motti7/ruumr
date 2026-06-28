import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Send, UsersRound } from "lucide-react";
import SmartImage from "@/components/shared/SmartImage";
import VirtualizedMessageList from "@/components/shared/VirtualizedMessageList";
import { useMutationWithOptimistic } from "@/hooks/useMutationWithOptimistic";

export default function GroupChatPage() {
  const { t, i18n } = useTranslation();
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

  // group_id = sorted set of all member user_ids (+ mine). Keyed on user_id (not match_id)
  // so every member of the shared team computes the exact same id and sees one chat.
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

        const members = (prof.team_members || []).filter(m => !m.pending);
        setTeamMembers(members);

        const memberUserIds = members.map(m => m.user_id).filter(Boolean);
        const gid = buildGroupId(userData.id, memberUserIds);
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
        sender_name: user.full_name || t("me"),
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
    { id: user?.id, name: t("me"), photo: myProfile?.photos?.[0] },
    ...teamMembers.map(m => ({ id: m.match_id, name: m.name?.split(' ')[0], photo: m.photo }))
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[--theme-orange] flex items-center justify-center animate-pulse">
            <UsersRound className="w-7 h-7 text-white" />
          </div>
          <p className="text-gray-500 font-medium text-sm">{t("loading_group_chat")}</p>
        </div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8 text-center" dir={i18n.dir()}>
        <UsersRound className="w-16 h-16 text-gray-300 mb-4" />
        <p className="font-black text-xl text-gray-700 mb-2">{t("no_team_yet")}</p>
        <p className="text-gray-400 text-sm mb-6">{t("add_team_for_chat")}</p>
        <button
          onClick={() => navigate(createPageUrl('GroupTracker'))}
          className="gradient-orange text-white font-bold px-6 py-3 rounded-full"
        >
          {t("build_your_team")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50" dir={i18n.dir()}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <button 
          onClick={() => navigate(createPageUrl('GroupTracker'))} 
          className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
          aria-label={t("back")}
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          {/* Avatar stack */}
          <div className="flex -space-x-2 space-x-reverse">
            {allParticipants.slice(0, 4).map((p, i) => (
              <div key={i} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                {p.photo ? (
                  <SmartImage src={p.photo} alt={p.name} className="w-full h-full" priority={false} />
                ) : (
                  <div className="w-full h-full gradient-orange flex items-center justify-center text-white text-xs font-black">
                    {p.name?.[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">{t("team_chat")}</p>
            <p className="text-[10px] text-gray-400">{t("participants_count", { count: allParticipants.length })}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
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
             className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
           >
             {/* Avatar */}
             {!isMe && (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 mb-1">
                  {msg.sender_photo ? (
                    <SmartImage src={msg.sender_photo} alt={msg.sender_name} className="w-full h-full" priority={false} />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-black">
                      {msg.sender_name?.[0]}
                    </div>
                  )}
                </div>
              )}
             <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
               {!isMe && (
                 <span className="text-[10px] text-gray-400 font-medium px-1">{msg.sender_name}</span>
               )}
               <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                 isMe
                   ? 'gradient-orange text-white rounded-tr-sm'
                   : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
               }`}>
                 {msg.content}
               </div>
               <span className="text-[9px] text-gray-300 px-1">
                 {new Date(msg.created_date).toLocaleTimeString(i18n.language === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
               </span>
             </div>
           </motion.div>
         );
       }}
      />

      {messages.length === 0 && (
       <div className="flex items-center justify-center flex-1">
         <div className="text-center text-gray-400 text-sm">
           <p className="text-3xl mb-2">👋</p>
           <p>{t("send_first_team_message")}</p>
         </div>
       </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("write_team_message")}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder-gray-400"
        />
        <button
           onClick={sendMessage}
           disabled={!input.trim() || isSending}
           className="min-w-[44px] min-h-[44px] gradient-orange rounded-full flex items-center justify-center shadow-md disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
           aria-label={t("send_message")}
         >
           <Send className="w-4 h-4 text-white" />
         </button>
      </div>
    </div>
  );
}

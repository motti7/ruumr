import React, { useState, useEffect, useRef } from "react";
import { Match, Profile, Message } from "@/entities/all";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Send, Loader2, CheckCheck } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VirtualizedMessageList from "@/components/shared/VirtualizedMessageList";
import { useMutationWithOptimistic } from "@/hooks/useMutationWithOptimistic";
import { base44 } from "@/api/base44Client";
import { buildMessagePayload } from "@/lib/messagePayload";

export default function ChatPage() {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditingQuestionnaire, setIsEditingQuestionnaire] = useState(false);
  const [questionnaireRefreshKey, setQuestionnaireRefreshKey] = useState(0);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingStatusIdRef = useRef(null);
  const matchIdRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const cleanupRef = { current: null };
    loadData().then(cleanup => {
      cleanupRef.current = cleanup;
    });
    return () => {
      if (typeof cleanupRef.current === 'function') cleanupRef.current();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherIsTyping]);

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (typingStatusIdRef.current) {
        base44.entities.TypingStatus.delete(typingStatusIdRef.current).catch(() => {});
      }
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const matchId = urlParams.get("matchId");

      if (!matchId) { navigate(createPageUrl("Matches")); return; }

      matchIdRef.current = matchId;

      const userData = await User.me();
      setUser(userData);
      userRef.current = userData;

      // Find the match by fetching matches for the current user
      const [matchesAs1, matchesAs2] = await Promise.all([
        Match.filter({ user1_id: userData.id }),
        Match.filter({ user2_id: userData.id }),
      ]);
      const allMatches = [...matchesAs1, ...matchesAs2];
      const matchData = allMatches.find(m => m.id === matchId);
      if (!matchData) { setIsLoading(false); navigate(createPageUrl("Matches")); return; }
      setMatch(matchData);

      const otherUserId = matchData.user1_id === userData.id ? matchData.user2_id : matchData.user1_id;

      const [profiles, matchMessages] = await Promise.all([
        Profile.filter({ user_id: otherUserId }),
        Message.filter({ match_id: matchId }, "created_date"),
      ]);

      if (profiles.length > 0) setOtherProfile(profiles[0]);
      setMessages(matchMessages);

      // Mark unread messages as read
      matchMessages.forEach(msg => {
        if (msg.sender_id !== userData.id && !msg.is_read) {
          Message.update(msg.id, { is_read: true }).catch(() => {});
        }
      });

      // Subscribe to messages in real-time
      const unsubMsg = base44.entities.Message.subscribe((event) => {
        if (event.data?.match_id === matchId) {
          if (event.type === 'create') {
            const newMsg = event.data;
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              if (newMsg.sender_id !== userRef.current?.id && !newMsg.is_read) {
                Message.update(newMsg.id, { is_read: true }).catch(() => {});
                newMsg.is_read = true;
              }
              return [...prev, newMsg];
            });
          } else if (event.type === 'update') {
            setMessages(prev => prev.map(m => m.id === event.id ? { ...m, ...event.data } : m));
          }
        }
      });

      // Polling fallback — in case subscription misses messages due to RLS
      const pollInterval = setInterval(async () => {
        try {
          const latest = await Message.filter({ match_id: matchId }, "created_date");
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newOnes = latest.filter(m => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            newOnes.forEach(m => {
              if (m.sender_id !== userRef.current?.id && !m.is_read) {
                Message.update(m.id, { is_read: true }).catch(() => {});
              }
            });
            return [...prev, ...newOnes];
          });
        } catch {}
      }, 5000);

      // Subscribe to typing status
      const unsubTyping = base44.entities.TypingStatus.subscribe((event) => {
        if (event.data?.match_id === matchId && event.data?.user_id !== userRef.current?.id) {
          if (event.type === 'create' || event.type === 'update') {
            setOtherIsTyping(true);
          } else if (event.type === 'delete') {
            setOtherIsTyping(false);
          }
        }
      });

      setIsLoading(false);
      return () => { unsubMsg(); unsubTyping(); clearInterval(pollInterval); };
    } catch (error) {
      console.error("Error loading chat:", error);
      setIsLoading(false);
      navigate(createPageUrl("Matches"));
    }
  };

  const handleTyping = async (value) => {
    setNewMessage(value);
    const matchId = matchIdRef.current;
    const userData = userRef.current;
    if (!matchId || !userData) return;

    // Send typing indicator
    if (!typingStatusIdRef.current) {
      try {
        const created = await base44.entities.TypingStatus.create({ match_id: matchId, user_id: userData.id });
        typingStatusIdRef.current = created.id;
      } catch {}
    }

    // Clear after 3s of no typing
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      if (typingStatusIdRef.current) {
        try {
          await base44.entities.TypingStatus.delete(typingStatusIdRef.current);
        } catch {}
        typingStatusIdRef.current = null;
      }
    }, 3000);
  };

  // Optimistic mutation for sending messages
  const messageMutation = /** @type {any} */ (useMutationWithOptimistic(
    (messageData) => Message.create(messageData),
    {
      queryKey: ['chat', matchIdRef.current],
      updateFn: (oldMessages = [], newMessage) => [...oldMessages, newMessage],
    }
  ));

  const handleSendMessage = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent || !match || !user) return;

    // Clear typing status
    clearTimeout(typingTimeoutRef.current);
    if (typingStatusIdRef.current) {
      base44.entities.TypingStatus.delete(typingStatusIdRef.current).catch(() => {});
      typingStatusIdRef.current = null;
    }

    setNewMessage("");

    try {
      const sentMsg = await messageMutation.mutateAsync(
        buildMessagePayload(match, user, messageContent)
      );
      // Add to local state immediately in case subscription is delayed
      if (sentMsg) {
        setMessages(prev => {
          if (prev.find(m => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (!otherProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p>לא נמצא פרופיל</p>
      </div>
    );
  }

  // Find last message sent by me to show read receipt
  const lastMyMsgIndex = messages.map((m, i) => ({ m, i })).filter(({ m }) => m.sender_id === user?.id).slice(-1)[0]?.i;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
        <button
          onClick={() => navigate(createPageUrl("Matches"), { replace: true })}
          className="text-gray-600 p-2 -mr-1"
          aria-label="חזור"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <img
            src={otherProfile.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"}
            alt={otherProfile.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h2 className="font-bold text-gray-900">{otherProfile.name}</h2>
            <AnimatePresence mode="wait">
              {otherIsTyping ? (
                <motion.p
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-[--theme-orange] font-medium"
                >
                  מקליד/ה...
                </motion.p>
              ) : (
                <motion.p key="location" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-gray-500">
                  {otherProfile.location}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages + Charter Results */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <VirtualizedMessageList
         messages={messages}
         containerHeight="100%"
         otherIsTyping={otherIsTyping}
         renderMessage={(msg, idx) => {
           const isMyMessage = msg.sender_id === user.id;
           const isLastMyMsg = idx === lastMyMsgIndex;
           return (
             <div key={msg.id || idx} className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}>
               <div
                 className={`max-w-[75%] px-4 py-2 rounded-2xl transition-opacity ${
                   isMyMessage ? "gradient-orange text-white" : "bg-white text-gray-900 border border-gray-200"
                 }`}
               >
                 <p className="text-sm leading-relaxed">{msg.content}</p>
               </div>
               {isMyMessage && isLastMyMsg && (
                 <div className="flex items-center gap-1 mt-0.5 px-1">
                   <CheckCheck className={`w-3.5 h-3.5 ${msg.is_read ? 'text-[--theme-orange]' : 'text-gray-400'}`} />
                   <span className={`text-[10px] ${msg.is_read ? 'text-[--theme-orange]' : 'text-gray-400'}`}>
                     {msg.is_read ? 'נקרא' : 'נשלח'}
                   </span>
                 </div>
               )}
             </div>
           );
         }}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
        <div className="flex items-center gap-3">
          <Input
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="הקלד/י הודעה..."
            className="flex-1 bg-gray-100 border-0"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="gradient-orange text-white rounded-full w-12 h-12 p-0 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

    </div>
  );
}
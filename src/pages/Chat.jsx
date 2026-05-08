import React, { useEffect, useMemo, useRef, useState } from "react";
import { Match, Profile, Message } from "@/entities/all";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Send, Loader2, Clock, CheckCheck, MapPin, AlertCircle, ArrowRight } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CharterResults from "../components/charter/CharterResults";
import VirtualizedMessageList from "@/components/shared/VirtualizedMessageList";
import { useMutationWithOptimistic } from "@/hooks/useMutationWithOptimistic";
import { base44 } from "@/api/base44Client";
import SmartImage from "@/components/shared/SmartImage";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

const sortByCreatedDateDesc = (records = []) => {
  return [...records].sort((left, right) => {
    const leftTime = Date.parse(left?.created_date);
    const rightTime = Date.parse(right?.created_date);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return rightTime - leftTime;
    }

    const leftValue = String(left?.created_date ?? "").trim();
    const rightValue = String(right?.created_date ?? "").trim();
    return rightValue.localeCompare(leftValue);
  });
};

const getCollection = (state, name) => {
  if (!state?.collections?.[name]) return [];
  return Array.isArray(state.collections[name]) ? state.collections[name] : [];
};

const formatTimeLabel = (value) => {
  if (!value) return "New";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const buildChatFromSimulatorState = (state, matchId, currentUser) => {
  const matches = [
    ...getCollection(state, "Match").filter(
      (match) => String(match.user1_id) === String(currentUser.id) && String(match.status || "active") === "active"
    ),
    ...getCollection(state, "Match").filter(
      (match) => String(match.user2_id) === String(currentUser.id) && String(match.status || "active") === "active"
    ),
  ];

  const matchData = matches.find((match) => String(match.id) === String(matchId)) || null;
  if (!matchData) {
    return null;
  }

  const otherUserId = String(matchData.user1_id) === String(currentUser.id) ? matchData.user2_id : matchData.user1_id;
  const otherProfile = getCollection(state, "Profile").find((profile) => String(profile.user_id) === String(otherUserId)) || null;
  if (!otherProfile) {
    return null;
  }

  const messages = sortByCreatedDateDesc(
    getCollection(state, "Message").filter((message) => String(message.match_id) === String(matchId))
  );
  const theirAnswers = getCollection(state, "CharterAnswer").filter(
    (answer) => String(answer.match_id) === String(matchId) && String(answer.user_id) === String(otherUserId)
  );

  return {
    match: matchData,
    otherProfile,
    messages,
    showWaitingBanner: theirAnswers.length < 8,
  };
};

function LoadingState() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />
      <div className="relative w-full max-w-sm rounded-[2rem] border border-white/70 bg-white/78 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange] shadow-inner">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-950">Loading conversation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Bringing the thread, charter context, and read state into view.</p>
      </div>
    </div>
  );
}

function ErrorState({ onBack }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />
      <div className="relative w-full max-w-sm rounded-[2rem] border border-rose-200 bg-rose-50/90 p-6 text-right shadow-[0_24px_80px_rgba(244,63,94,0.08)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-rose-950">Couldn’t load chat</h2>
            <p className="mt-2 text-sm leading-6 text-rose-800/90">
              The conversation is unavailable right now. You can jump back to matches and re-open it from there.
            </p>
            <button
              onClick={onBack}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-200/60"
            >
              <ArrowRight className="h-4 w-4" />
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitingBanner({ name }) {
  return (
    <div className="rounded-[24px] border border-orange-100 bg-orange-50/80 p-4 text-right shadow-[0_12px_30px_rgba(255,122,69,0.10)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[--theme-orange] shadow-sm">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-950">Waiting on {name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            They still need to finish the shared charter. We’ll keep the conversation warm and ready.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showWaitingBanner, setShowWaitingBanner] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingStatusIdRef = useRef(null);
  const matchIdRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    let cleanup = null;
    loadData().then((nextCleanup) => {
      cleanup = nextCleanup;
    });

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherIsTyping]);

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
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const requestedMatchId = urlParams.get("matchId");
      if (!requestedMatchId) {
        navigate(createPageUrl("Matches"));
        return () => {};
      }

      matchIdRef.current = requestedMatchId;

      const simulatorState = getSimulatorBackendState();
      if (simulatorState?.currentUser) {
        const currentUser = simulatorState.currentUser;
        const snapshot = buildChatFromSimulatorState(simulatorState, requestedMatchId, currentUser);
        if (!snapshot) {
          navigate(createPageUrl("Matches"));
          return () => {};
        }

        setUser(currentUser);
        userRef.current = currentUser;
        setMatch(snapshot.match);
        setOtherProfile(snapshot.otherProfile);
        setMessages(snapshot.messages);
        setShowWaitingBanner(snapshot.showWaitingBanner);
        setOtherIsTyping(false);
        setIsLoading(false);
        return () => {};
      }

      const userData = await User.me();
      setUser(userData);
      userRef.current = userData;

      const [matchesAs1, matchesAs2] = await Promise.all([
        Match.filter({ user1_id: userData.id }),
        Match.filter({ user2_id: userData.id }),
      ]);

      const allMatches = [...matchesAs1, ...matchesAs2];
      const matchData = allMatches.find((item) => item.id === requestedMatchId);
      if (!matchData) {
        setIsLoading(false);
        navigate(createPageUrl("Matches"));
        return () => {};
      }
      setMatch(matchData);

      const otherUserId = String(matchData.user1_id) === String(userData.id) ? matchData.user2_id : matchData.user1_id;
      const [profiles, theirAnswers, matchMessages] = await Promise.all([
        Profile.filter({ user_id: otherUserId }),
        base44.entities.CharterAnswer.filter({ match_id: requestedMatchId, user_id: otherUserId }),
        Message.filter({ match_id: requestedMatchId }, "created_date"),
      ]);

      if (profiles.length > 0) {
        setOtherProfile(profiles[0]);
      }
      setShowWaitingBanner(theirAnswers.length < 8);
      setMessages(sortByCreatedDateDesc(matchMessages));

      matchMessages.forEach((msg) => {
        if (msg.sender_id !== userData.id && !msg.is_read) {
          Message.update(msg.id, { is_read: true }).catch(() => {});
        }
      });

      const unsubMsg = base44.entities.Message.subscribe((event) => {
        if (event.data?.match_id === requestedMatchId) {
          if (event.type === "create") {
            const newMsg = event.data;
            setMessages((prev) => {
              if (prev.find((item) => item.id === newMsg.id)) return prev;
              if (newMsg.sender_id !== userRef.current?.id && !newMsg.is_read) {
                Message.update(newMsg.id, { is_read: true }).catch(() => {});
                newMsg.is_read = true;
              }
              return [...prev, newMsg];
            });
          } else if (event.type === "update") {
            setMessages((prev) => prev.map((item) => (item.id === event.id ? { ...item, ...event.data } : item)));
          }
        }
      });

      const unsubCharter = base44.entities.CharterAnswer.subscribe((event) => {
        if (event.data?.match_id === requestedMatchId && event.data?.user_id === otherUserId) {
          base44.entities.CharterAnswer.filter({ match_id: requestedMatchId, user_id: otherUserId })
            .then((answers) => setShowWaitingBanner(answers.length < 8))
            .catch(() => {});
        }
      });

      const unsubTyping = base44.entities.TypingStatus.subscribe((event) => {
        if (event.data?.match_id === requestedMatchId && event.data?.user_id !== userRef.current?.id) {
          if (event.type === "create" || event.type === "update") {
            setOtherIsTyping(true);
          } else if (event.type === "delete") {
            setOtherIsTyping(false);
          }
        }
      });

      setIsLoading(false);
      return () => {
        unsubMsg();
        unsubCharter();
        unsubTyping();
      };
    } catch (error) {
      const simulatorState = getSimulatorBackendState();
      if (simulatorState?.currentUser && matchIdRef.current) {
        const snapshot = buildChatFromSimulatorState(simulatorState, matchIdRef.current, simulatorState.currentUser);
        if (snapshot) {
          setUser(simulatorState.currentUser);
          userRef.current = simulatorState.currentUser;
          setMatch(snapshot.match);
          setOtherProfile(snapshot.otherProfile);
          setMessages(snapshot.messages);
          setShowWaitingBanner(snapshot.showWaitingBanner);
          setOtherIsTyping(false);
          setIsLoading(false);
          return () => {};
        }
      }

      console.error("Error loading chat:", error);
      setIsLoading(false);
      navigate(createPageUrl("Matches"));
      return () => {};
    }
  };

  const handleTyping = async (value) => {
    setNewMessage(value);
    const matchId = matchIdRef.current;
    const userData = userRef.current;
    if (!matchId || !userData) return;

    if (!typingStatusIdRef.current) {
      try {
        const created = await base44.entities.TypingStatus.create({ match_id: matchId, user_id: userData.id });
        typingStatusIdRef.current = created.id;
      } catch {}
    }

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

  const messageMutation = /** @type {any} */ (useMutationWithOptimistic(
    (messageData) => Message.create(messageData),
    {
      queryKey: ["chat", matchIdRef.current],
      updateFn: (oldMessages = [], newMessageValue) => [...oldMessages, newMessageValue],
    }
  ));

  const handleSendMessage = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent || !match || !user) return;

    clearTimeout(typingTimeoutRef.current);
    if (typingStatusIdRef.current) {
      base44.entities.TypingStatus.delete(typingStatusIdRef.current).catch(() => {});
      typingStatusIdRef.current = null;
    }

    setNewMessage("");

    try {
      await messageMutation.mutateAsync({
        match_id: match.id,
        sender_id: user.id,
        content: messageContent,
        is_read: false,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const unreadCount = useMemo(
    () => messages.filter((message) => message.sender_id !== user?.id && !message.is_read).length,
    [messages, user?.id]
  );

  const lastMyMsgIndex = messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => message.sender_id === user?.id)
    .slice(-1)[0]?.index;

  const matchScore = Number(otherProfile?.ruumrPlus?.score ?? otherProfile?.ruumr_plus?.score);
  const matchScoreLabel = Number.isFinite(matchScore) && matchScore > 0 ? `${Math.round(matchScore * 100)}% fit` : null;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!otherProfile || !match) {
    return <ErrorState onBack={() => navigate(createPageUrl("Matches"))} />;
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-4" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.62)_0%,_rgba(255,255,255,0.04)_100%)]" />

      <div className="mx-auto flex h-[calc(100dvh-1rem)] w-full max-w-md flex-col gap-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-3" dir="ltr">
            <BackButton className="bg-white/85 text-slate-600 shadow-sm ring-1 ring-slate-200" />

            <div className="flex min-w-0 flex-1 items-center gap-3" dir="rtl">
              <div className="relative shrink-0">
                <div className="h-14 w-14 overflow-hidden rounded-[22px] ring-2 ring-white shadow-[0_14px_32px_rgba(15,23,42,0.14)]">
                  <SmartImage
                    src={otherProfile.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
                    alt={otherProfile.name}
                    className="h-full w-full"
                    priority={true}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
              </div>

              <div className="min-w-0 flex-1 text-right">
                <h1 className="truncate text-2xl font-black tracking-tight text-slate-950">{otherProfile.name}</h1>
                <p className="mt-1 flex items-center justify-end gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{otherProfile.location || "Location not set"}</span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {matchScoreLabel ? (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-[--theme-orange] ring-1 ring-orange-100">
                  {matchScoreLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                {unreadCount} unread
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {matchScoreLabel && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {matchScoreLabel}
              </span>
            )}
            {showWaitingBanner ? (
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
                Waiting
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                Charter ready
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
              {messages.length} messages
            </span>
          </div>

          {showWaitingBanner && (
            <div className="mt-4">
              <WaitingBanner name={otherProfile.name} />
            </div>
          )}
        </motion.section>

        <div className="flex-1 min-h-0 overflow-hidden rounded-[32px] border border-white/70 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
          <VirtualizedMessageList
            messages={messages}
            containerHeight="100%"
            otherIsTyping={otherIsTyping}
            renderMessage={(msg, idx) => {
              const isMyMessage = msg.sender_id === user?.id;
              const isLastMyMsg = idx === lastMyMsgIndex;
              return (
                <div key={msg.id || idx} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-[24px] px-4 py-3 shadow-sm ${
                      isMyMessage
                        ? "bg-gradient-to-br from-[--theme-orange] to-orange-500 text-white"
                        : "border border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <p className="text-sm leading-6">{msg.content}</p>
                    <div
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        isMyMessage ? "text-white/72" : "text-slate-400"
                      }`}
                    >
                      <span>{formatTimeLabel(msg.created_date)}</span>
                      {isMyMessage && isLastMyMsg && (
                        <>
                          <CheckCheck className={`h-3.5 w-3.5 ${msg.is_read ? "text-white" : "text-white/70"}`} />
                          <span>{msg.is_read ? "Read" : "Sent"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {!showWaitingBanner && (
          <div className="rounded-[28px] border border-white/70 bg-white/82 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
            <CharterResults matchId={match.id} />
          </div>
        )}

        <div className="rounded-[28px] border border-white/70 bg-white/84 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <div className="flex items-end gap-3" dir="ltr">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="הקלד/י הודעה..."
              className="h-12 flex-1 rounded-full border border-slate-200 bg-white/90 px-4 text-right text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:ring-[--theme-orange]"
              dir="rtl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[--theme-orange] p-0 text-white shadow-[0_14px_30px_rgba(255,122,69,0.28)] disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Press Enter to send. The chat stays synced with the shared charter.</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Match, Profile, Message, Swipe } from "@/entities/all";
import { User } from "@/entities/User";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MatchCard from "../components/matches/MatchCard";
import PullToRefresh from "@/components/shared/PullToRefresh";
import SmartImage from "@/components/shared/SmartImage";
import { base44 } from "@/api/base44Client";
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

const uniqueById = (records = []) => {
  const map = new Map();
  records.forEach((record) => {
    if (!record) return;
    map.set(String(record.id), record);
  });
  return [...map.values()];
};

const getCollection = (state, name) => {
  if (!state?.collections?.[name]) return [];
  return Array.isArray(state.collections[name]) ? state.collections[name] : [];
};

const buildMatchesFromSimulatorState = (state, currentUser) => {
  const profiles = sortByCreatedDateDesc([...getCollection(state, 'Profile')]);
  const activeMatches = uniqueById([
    ...getCollection(state, 'Match').filter((match) => String(match.user1_id) === String(currentUser.id) && String(match.status || 'active') === 'active'),
    ...getCollection(state, 'Match').filter((match) => String(match.user2_id) === String(currentUser.id) && String(match.status || 'active') === 'active'),
  ]);

  const conversationList = activeMatches
    .map((match) => {
      const otherUserId = String(match.user1_id) === String(currentUser.id) ? match.user2_id : match.user1_id;
      const profile = getCollection(state, 'Profile').find((entry) => String(entry.user_id) === String(otherUserId)) || null;
      if (!profile) return null;

      const orderedMessages = sortByCreatedDateDesc(
        getCollection(state, 'Message').filter((message) => String(message.match_id) === String(match.id))
      );

      return {
        matchId: match.id,
        match,
        profile,
        latestMessage: orderedMessages[0] || null,
        unreadCount: orderedMessages.filter((message) => String(message.sender_id) !== String(currentUser.id) && !message.is_read).length,
        isOnline: false,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftValue = Date.parse(left.latestMessage?.created_date || left.match?.created_date || 0);
      const rightValue = Date.parse(right.latestMessage?.created_date || right.match?.created_date || 0);
      return rightValue - leftValue;
    });

  const matchedUserIds = new Set(conversationList.map((conversation) => String(conversation.profile?.user_id)));

  const pendingLikeProfiles = profiles
    .filter((profile) => {
      const profileId = String(profile.user_id);
      return (
        profile.is_visible !== false &&
        profileId !== String(currentUser.id) &&
        getCollection(state, 'Swipe').some((like) => String(like.swiper_id) === profileId && String(like.swiped_id) === String(currentUser.id) && String(like.action) === 'like') &&
        !matchedUserIds.has(profileId)
      );
    })
    .map((profile) => ({
      id: profile.id || profile.user_id,
      profile,
      kind: 'like',
      onClick: () => {
        // Navigation is wired by the caller.
      },
    }));

  return {
    conversationList,
    connectionRail: [...conversationList.map((conversation) => ({
      id: conversation.matchId,
      profile: conversation.profile,
      kind: 'match',
      onClick: () => {},
    })), ...pendingLikeProfiles].slice(0, 6),
  };
};

const fetchWithFallback = async (queryFn, fallbackFn) => {
  try {
    return await queryFn();
  } catch (error) {
    const simulatorState = getSimulatorBackendState();
    if (simulatorState) {
      return fallbackFn(simulatorState);
    }
    throw error;
  }
};

const ConversationBubble = ({ item, onClick }) => {
  const badgeLabel = item.kind === "match" ? "MATCH" : "LIKE";
  const helperLabel = item.kind === "match" ? "Open chat" : "Liked you";

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex w-20 shrink-0 flex-col items-center gap-2 text-left"
    >
      <div className="relative">
        <div
          className={`h-20 w-20 overflow-hidden rounded-[28px] border shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
            item.kind === "match"
              ? "border-[rgba(255,122,69,0.22)] ring-4 ring-orange-50"
              : "border-white/80 ring-4 ring-slate-100"
          }`}
        >
          <SmartImage
            src={item.profile?.photos?.[0]}
            alt={item.profile?.name || "Profile"}
            className="h-full w-full"
            priority={false}
          />
        </div>
        <span
          className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-[0.18em] ${
            item.kind === "match"
              ? "bg-[--theme-orange] text-white shadow-[0_8px_20px_rgba(255,122,69,0.28)]"
              : "bg-white text-[--theme-orange] shadow-[0_8px_20px_rgba(15,23,42,0.12)] ring-1 ring-orange-100"
          }`}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="text-center">
        <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">
          {item.profile?.name}
        </span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
          {helperLabel}
        </span>
      </div>
    </motion.button>
  );
};

function LoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_24%)]" />
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-3 h-10 w-56 rounded-2xl" />
          <Skeleton className="mt-3 h-4 w-[88%] rounded-full" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <div className="flex gap-4 overflow-hidden pb-1">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex w-20 shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-20 w-20 rounded-[28px]" />
              <Skeleton className="h-3 w-14 rounded-full" />
              <Skeleton className="h-2.5 w-12 rounded-full" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="rounded-[30px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <div className="flex gap-4" dir="rtl">
                <Skeleton className="h-20 w-20 rounded-[24px]" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 rounded-full" />
                      <Skeleton className="h-3.5 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-[82%] rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="rounded-[2rem] border border-rose-200 bg-rose-50/90 p-5 text-right shadow-[0_24px_80px_rgba(244,63,94,0.08)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-rose-950">Couldn’t load matches</h2>
            <p className="mt-2 text-sm leading-6 text-rose-800/90">{message}</p>
            <button
              onClick={onRetry}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-200/60"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [freshConnections, setFreshConnections] = useState([]);
  const [, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [seenMatchIds, setSeenMatchIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
    } catch {
      return [];
    }
  });

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      const simulatorState = getSimulatorBackendState();
      if (simulatorState?.currentUser) {
        const { conversationList, connectionRail } = buildMatchesFromSimulatorState(simulatorState, simulatorState.currentUser);

        setUser(simulatorState.currentUser);
        setMatches(conversationList);
        setFreshConnections(
          connectionRail.map((item) => {
            if (item.kind === 'like') {
              return {
                ...item,
                onClick: () => {
                  navigate(createPageUrl('ProfileView') + `?userId=${item.profile.user_id}&fromLikes=true`);
                },
              };
            }

            return {
              ...item,
              onClick: () => {
                navigate(createPageUrl('Chat') + `?matchId=${item.id}`);
              },
            };
          })
        );
        setIsLoading(false);
        return;
      }

      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (authError) {
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          currentUser = simulatorState.currentUser;
        } else {
          throw authError;
        }
      }

      setUser(currentUser);

      const [matchesAs1, matchesAs2, likesToMe, profiles] = await Promise.all([
        fetchWithFallback(
          () => Match.filter({ user1_id: currentUser.id, status: 'active' }),
          (state) => getCollection(state, 'Match').filter((match) => String(match.user1_id) === String(currentUser.id) && String(match.status || 'active') === 'active')
        ),
        fetchWithFallback(
          () => Match.filter({ user2_id: currentUser.id, status: 'active' }),
          (state) => getCollection(state, 'Match').filter((match) => String(match.user2_id) === String(currentUser.id) && String(match.status || 'active') === 'active')
        ),
        fetchWithFallback(
          () => Swipe.filter({ swiped_id: currentUser.id, action: "like" }),
          (state) => getCollection(state, 'Swipe').filter((swipe) => String(swipe.swiped_id) === String(currentUser.id) && String(swipe.action) === 'like')
        ),
        fetchWithFallback(
          () => Profile.list("-created_date", 500),
          (state) => [...getCollection(state, 'Profile')]
        ),
      ]);

      const activeMatches = uniqueById([...matchesAs1, ...matchesAs2]);

      const conversations = await Promise.all(
        activeMatches.map(async (match) => {
          const otherUserId = String(match.user1_id) === String(currentUser.id) ? match.user2_id : match.user1_id;

          const [profileRecords, messageRecords] = await Promise.all([
            fetchWithFallback(
              () => Profile.filter({ user_id: otherUserId }),
              (state) => getCollection(state, 'Profile').filter((profile) => String(profile.user_id) === String(otherUserId))
            ),
            fetchWithFallback(
              () => Message.filter({ match_id: match.id }, "created_date"),
              (state) => sortByCreatedDateDesc(getCollection(state, 'Message').filter((message) => String(message.match_id) === String(match.id)))
            ),
          ]);

          const profile = profileRecords[0] || null;
          if (!profile) return null;

          const orderedMessages = sortByCreatedDateDesc(messageRecords);
          const unreadCount = orderedMessages.filter((message) => String(message.sender_id) !== String(currentUser.id) && !message.is_read).length;

          return {
            matchId: match.id,
            match,
            profile,
            latestMessage: orderedMessages[0] || null,
            unreadCount,
            isOnline: false,
          };
        })
      );

      const conversationList = conversations
        .filter(Boolean)
        .sort((left, right) => {
          const leftValue = Date.parse(left.latestMessage?.created_date || left.match?.created_date || 0);
          const rightValue = Date.parse(right.latestMessage?.created_date || right.match?.created_date || 0);
          return rightValue - leftValue;
        });

      const matchedUserIds = new Set(conversationList.map((conversation) => String(conversation.profile?.user_id)));

      const pendingLikeProfiles = profiles
        .filter((profile) => {
          const profileId = String(profile.user_id);
          return (
            profile.is_visible !== false &&
            profileId !== String(currentUser.id) &&
            likesToMe.some((like) => String(like.swiper_id) === profileId) &&
            !matchedUserIds.has(profileId)
          );
        })
        .map((profile) => ({
          id: profile.id || profile.user_id,
          profile,
          kind: "like",
          onClick: () => {
            navigate(createPageUrl('ProfileView') + `?userId=${profile.user_id}&fromLikes=true`);
          },
        }));

      const matchConnections = conversationList.map((conversation) => ({
        id: conversation.matchId,
        profile: conversation.profile,
        kind: "match",
        onClick: () => {
          navigate(createPageUrl('Chat') + `?matchId=${conversation.matchId}`);
        },
      }));

      const connectionRail = [...matchConnections, ...pendingLikeProfiles].slice(0, 6);

      setMatches(conversationList);
      setFreshConnections(connectionRail);
      setIsLoading(false);
    } catch (loadError) {
      console.error("Error loading matches:", loadError);
      setError("We couldn't load your conversations right now. Please try again in a moment.");
      setMatches([]);
      setFreshConnections([]);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    const handler = () => {
      try {
        setSeenMatchIds(JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]'));
      } catch {}
    };
    window.addEventListener('roomi_seen_updated', handler);
    return () => window.removeEventListener('roomi_seen_updated', handler);
  }, []);

  const handleDeleteMatch = useCallback(async (matchId) => {
    try {
      await Match.delete(matchId);
      setMatches((prev) => prev.filter((match) => match.matchId !== matchId));
      setFreshConnections((prev) => prev.filter((item) => item.id !== matchId));

      const seenIds = JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
      localStorage.setItem('roomi_seen_match_ids', JSON.stringify(seenIds.filter((id) => id !== matchId)));
      window.dispatchEvent(new Event('roomi_seen_updated'));
    } catch (e) {
      console.error("Error deleting match:", e);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMatches();
    setIsRefreshing(false);
  }, [loadMatches]);

  const unreadCount = useMemo(() => matches.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0), [matches]);
  const activeCount = matches.length;
  const freshCount = freshConnections.length;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.92),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.55)_0%,_rgba(255,255,255,0.02)_100%)]" />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-white/70 bg-white/75 p-5 text-left shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-4" dir="ltr">
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Inbox</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">New Matches</h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  One polished place for new connections, quick replies, and the people you actually want to keep.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-500 shadow-sm transition-colors hover:text-[--theme-orange] disabled:opacity-70"
                aria-label="Refresh matches"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-[--theme-orange]' : ''}`} />
              </motion.button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {activeCount} active
              </span>
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
                {unreadCount} unread
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                {freshCount} fresh
              </span>
            </div>
          </motion.section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3" dir="ltr">
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">New Matches</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Fresh connections</h2>
              </div>
              <Link
                to={createPageUrl('LikesYou')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:text-[--theme-orange]"
              >
                <Sparkles className="h-4 w-4" />
                View likes
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-1 pr-1" dir="ltr">
              {freshConnections.length > 0 ? (
                freshConnections.map((item) => (
                  <ConversationBubble key={item.id} item={item} onClick={item.onClick} />
                ))
              ) : (
                <div className="rounded-[28px] border border-white/70 bg-white/70 px-4 py-5 text-sm text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
                  No new connections yet.
                </div>
              )}
            </div>
          </section>

          <section className="pb-2">
            <div className="mb-3 flex items-end justify-between gap-3" dir="ltr">
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">Messages</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Recent conversations</h2>
              </div>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[--theme-orange] ring-1 ring-orange-100">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {matches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-white/70 bg-white/75 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">No conversations yet</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  Start swiping in Discover, or check who already likes you. Conversations will appear here once they start.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link
                    to={createPageUrl("Discover")}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[--theme-orange] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200/60"
                  >
                    Go to Discover
                  </Link>
                  <Link
                    to={createPageUrl("LikesYou")}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-600 shadow-sm"
                  >
                    View likes
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {matches.map((conversation, index) => (
                  <motion.div
                    key={conversation.matchId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MatchCard
                      match={conversation.profile}
                      isOnline={conversation.isOnline}
                      matchId={conversation.matchId}
                      onClickProfile={() => {
                        navigate(createPageUrl('ProfileView') + `?userId=${conversation.profile.user_id}`);
                      }}
                      onClickChat={() => {
                        navigate(createPageUrl('Chat') + `?matchId=${conversation.matchId}`);
                      }}
                      onClickCharter={() => {
                        const seenIds = JSON.parse(localStorage.getItem('roomi_seen_match_ids') || '[]');
                        if (!seenIds.includes(conversation.matchId)) {
                          localStorage.setItem('roomi_seen_match_ids', JSON.stringify([...seenIds, conversation.matchId]));
                          window.dispatchEvent(new Event('roomi_seen_updated'));
                        }
                        navigate(createPageUrl('Charter') + `?matchId=${conversation.matchId}`);
                      }}
                      onDelete={handleDeleteMatch}
                      isOpened={seenMatchIds.includes(conversation.matchId)}
                      latestMessage={conversation.latestMessage}
                      unreadCount={conversation.unreadCount}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, MessageCircle, UsersRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import SmartImage from "@/components/shared/SmartImage";
import { getLanguageDirection, isRtlLanguage } from "@/lib/languageDirection";

function teammateUserIds(profile) {
  return (profile?.team_members || [])
    .filter((member) => !member.pending && member.user_id)
    .map((member) => String(member.user_id));
}

function matchForTeammate(matches, currentUserId, teammateId) {
  return matches.find((match) => {
    const ids = [String(match.user1_id), String(match.user2_id)];
    return ids.includes(String(currentUserId)) && ids.includes(String(teammateId));
  });
}

export default function TeamChatsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const direction = getLanguageDirection(i18n);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";
  const [state, setState] = useState({
    loading: true,
    user: null,
    profile: null,
    teammates: [],
    unreadByMatchId: {},
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await User.me();
        const [profiles, matchesAs1, matchesAs2] = await Promise.all([
          base44.entities.Profile.filter({ user_id: user.id }),
          base44.entities.Match.filter({ user1_id: user.id, status: "active" }),
          base44.entities.Match.filter({ user2_id: user.id, status: "active" }),
        ]);
        const profile = profiles[0] || null;
        if (!profile) {
          navigate(createPageUrl("GroupTracker"), { replace: true });
          return;
        }

        const matches = [...matchesAs1, ...matchesAs2];
        const memberIds = teammateUserIds(profile);
        const memberProfiles = memberIds.length
          ? await base44.entities.Profile.list("-created_date", 500)
          : [];
        const profileByUserId = new Map(memberProfiles.map((item) => [String(item.user_id), item]));
        const teammates = (profile.team_members || [])
          .filter((member) => !member.pending && member.user_id)
          .map((member) => {
            const teammateId = String(member.user_id);
            const match = member.match_id
              ? matches.find((item) => String(item.id) === String(member.match_id))
              : matchForTeammate(matches, user.id, teammateId);
            const teammateProfile = profileByUserId.get(teammateId);
            return {
              id: teammateId,
              name: teammateProfile?.name || member.name || t("the_roommate"),
              photo: teammateProfile?.photos?.[0] || member.photo || null,
              matchId: match?.id || member.match_id || "",
            };
          });

        const unreadPairs = await Promise.all(
          teammates
            .filter((teammate) => teammate.matchId)
            .map(async (teammate) => {
              try {
                const messages = await base44.entities.Message.filter({ match_id: teammate.matchId });
                const unread = messages.filter((message) => message.sender_id !== user.id && !message.is_read).length;
                return [teammate.matchId, unread];
              } catch {
                return [teammate.matchId, 0];
              }
            })
        );

        if (!cancelled) {
          setState({
            loading: false,
            user,
            profile,
            teammates,
            unreadByMatchId: Object.fromEntries(unreadPairs),
          });
        }
      } catch (error) {
        console.error("[ruumr] team chats load failed", error);
        if (!cancelled) setState((current) => ({ ...current, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  const participants = useMemo(
    () => 1 + state.teammates.length,
    [state.teammates.length]
  );

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4" dir={direction}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
          aria-label={t("back")}
        >
          <ArrowRight className={`w-5 h-5 text-gray-600 ${isRtl ? "" : "rotate-180"}`} />
        </button>
        <div className={textAlignClass}>
          <h1 className="text-3xl font-extrabold text-gray-900">{t("team_chats_title")}</h1>
          <p className="text-sm font-bold text-gray-500">{t("team_chats_subtitle")}</p>
        </div>
      </div>

      <button
        onClick={() => navigate(createPageUrl("GroupChat"))}
        className={`w-full rounded-2xl gradient-orange p-4 text-white flex items-center gap-3 ${textAlignClass} shadow-sm active:scale-[0.99] transition-transform`}
      >
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <UsersRound className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-extrabold">{t("team_chat")}</p>
          <p className="text-sm text-white/85">{t("participants_count", { count: participants })}</p>
        </div>
      </button>

      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className={`px-4 py-3 border-b border-gray-100 ${textAlignClass}`}>
          <h2 className="font-extrabold text-gray-900">{t("individual_team_chats")}</h2>
        </div>

        {state.teammates.length === 0 ? (
          <div className="p-6 text-center text-gray-500 font-bold">
            {t("add_team_for_chat")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {state.teammates.map((teammate) => {
              const unread = state.unreadByMatchId[teammate.matchId] || 0;
              return (
                <button
                  key={teammate.id}
                  onClick={() => {
                    if (teammate.matchId) {
                      navigate(`${createPageUrl("Chat")}?matchId=${teammate.matchId}`);
                    }
                  }}
                  disabled={!teammate.matchId}
                  className={`w-full px-4 py-3 flex items-center gap-3 ${textAlignClass} active:bg-gray-50 disabled:opacity-50`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-50 flex-shrink-0">
                    {teammate.photo ? (
                      <SmartImage src={teammate.photo} alt={teammate.name} className="w-full h-full" priority={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[--theme-orange] font-extrabold">
                        {teammate.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-gray-900 truncate">{teammate.name}</p>
                    <p className="text-xs font-bold text-gray-500">
                      {teammate.matchId ? t("continue_to_chat") : t("chat_unavailable")}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="min-w-6 h-6 px-2 rounded-full bg-[--theme-orange] text-white text-xs font-extrabold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                  <MessageCircle className="w-5 h-5 text-gray-300" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

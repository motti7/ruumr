import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { ProfileSignalAnswer } from "@/entities/ProfileSignalAnswer";
import {
  PROFILE_SIGNAL_MODEL_VERSION,
  PROFILE_SIGNAL_PROMPT_INTERVAL_DAYS,
} from "@/lib/profileSignals/config";
import {
  getProfileSignalAnswer,
  selectRandomUnansweredProfileSignalQuestion,
} from "@/lib/profileSignals/questions";

function daysBetween(leftDate, rightDate) {
  const leftTime = Date.parse(String(leftDate || ""));
  const rightTime = Date.parse(String(rightDate || ""));
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return Infinity;
  return Math.floor((rightTime - leftTime) / (24 * 60 * 60 * 1000));
}

export function shouldPromptForProfileSignal(profile, {
  now = new Date(),
  intervalDays = PROFILE_SIGNAL_PROMPT_INTERVAL_DAYS,
} = {}) {
  if (!profile?.id) return false;
  const lastAnsweredAt = profile.profile_signal_last_answered_at;
  if (!lastAnsweredAt) return true;
  return daysBetween(lastAnsweredAt, now.toISOString()) >= intervalDays;
}

export async function loadCurrentProfileSignalState({ random = Math.random } = {}) {
  const user = await User.me();
  const profiles = await Profile.filter({ user_id: user.id });
  const profile = profiles[0] || null;
  if (!profile) {
    return { user, profile: null, answers: [], nextQuestion: null };
  }

  const answers = await ProfileSignalAnswer.filter({ user_id: user.id }, "-answered_at");
  const nextQuestion = selectRandomUnansweredProfileSignalQuestion(answers, random);
  return { user, profile, answers, nextQuestion };
}

export async function pickCurrentProfileSignalQuestion(options = {}) {
  const state = await loadCurrentProfileSignalState(options);
  return state.nextQuestion;
}

export async function saveProfileSignalAnswer({
  question,
  answerId,
  source = "profile_prompt",
}) {
  const answer = getProfileSignalAnswer(question, answerId);
  if (!question?.id || !answer) {
    throw new Error("profile_signal_answer_invalid");
  }

  const user = await User.me();
  const profiles = await Profile.filter({ user_id: user.id });
  const profile = profiles[0];
  if (!profile?.id) {
    throw new Error("profile_signal_profile_missing");
  }

  const answeredAt = new Date().toISOString();
  const data = {
    user_id: user.id,
    profile_id: profile.id,
    question_id: question.id,
    question_version: question.version || 1,
    answer_id: answer.id,
    source,
    media_type: question.media?.type || "image",
    markers: answer.markers || {},
    answered_at: answeredAt,
  };

  const existing = await ProfileSignalAnswer.filter({
    user_id: user.id,
    question_id: question.id,
  });

  const saved = existing[0]
    ? await ProfileSignalAnswer.update(existing[0].id, data)
    : await ProfileSignalAnswer.create(data);

  const allAnswers = await ProfileSignalAnswer.filter({ user_id: user.id });
  const answeredCount = new Set(
    allAnswers
      .concat(saved ? [saved] : [])
      .map((item) => item?.question_id)
      .filter(Boolean)
  ).size;

  await Profile.update(profile.id, {
    profile_signal_answered_count: answeredCount,
    profile_signal_last_answered_at: answeredAt,
    profile_signal_version: PROFILE_SIGNAL_MODEL_VERSION,
  });

  try {
    base44.analytics.track({
      eventName: "profile_signal_answered",
      properties: {
        question_id: question.id,
        answer_id: answer.id,
        source,
      },
    });
  } catch (_) {
    // Analytics should never block profile completion.
  }

  return saved;
}

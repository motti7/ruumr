import { base44 } from "@/api/base44Client";
import { TeamInvite } from "@/entities/all";

// Unwrap either a parsed JSON body or an axios-style envelope ({ data, status }).
function unwrap(raw) {
  const body =
    raw && typeof raw === "object" && raw.data && !("success" in raw) && !("error" in raw)
      ? raw.data
      : raw;
  if (body && typeof body === "object" && body.error) {
    throw new Error(body.error);
  }
  return body;
}

/**
 * Invite a friend to the current user's team by email.
 * Returns a uniform result regardless of whether the friend is already on Ruumr.
 * @param {{ email: string, name?: string }} params
 */
export async function createTeamInvite({ email, name }) {
  const raw = await base44.functions.invoke("createTeamInvite", { email, name });
  return unwrap(raw);
}

/**
 * Respond to a team invite.
 * @param {string} inviteId
 * @param {"accept" | "decline" | "cancel"} action
 */
export async function respondToTeamInvite(inviteId, action) {
  const raw = await base44.functions.invoke("respondToTeamInvite", {
    invite_id: inviteId,
    action,
  });
  return unwrap(raw);
}

/** Link any pending_signup invites addressed to the current user's email. */
export async function claimTeamInvites() {
  const raw = await base44.functions.invoke("claimTeamInvites", {});
  return unwrap(raw);
}

/** Incoming requests the current user must approve/decline. */
export async function listIncomingTeamInvites(userId) {
  if (!userId) return [];
  return TeamInvite.filter({ invitee_user_id: userId, status: "pending_approval" });
}

/** Pending outgoing invites the current user sent (existing-user requests still waiting). */
export async function listOutgoingTeamInvites(userId) {
  if (!userId) return [];
  const invites = await TeamInvite.filter({ inviter_user_id: userId });
  return invites.filter(
    (i) => i.status === "pending_approval" || i.status === "pending_signup"
  );
}

/**
 * Build the payload for a 1:1 chat Message create.
 *
 * The match participants (user1_id / user2_id) are denormalized onto every
 * message so the Message read/update RLS can authorize the counterparty with a
 * direct field equality check instead of a templated Match subquery. The
 * subquery form is unreliable (result limits / array expansion), which caused
 * users with many matches to be unable to read the other person's messages.
 *
 * @param {{ id: string, user1_id?: string, user2_id?: string }} match
 * @param {{ id: string }} user
 * @param {string} content
 * @returns {{ match_id: string, sender_id: string, content: string, is_read: boolean, user1_id?: string, user2_id?: string }}
 */
export function buildMessagePayload(match, user, content) {
  if (!match || !user) {
    throw new Error('buildMessagePayload requires both match and user');
  }

  const payload = {
    match_id: match.id,
    sender_id: user.id,
    content,
    is_read: false,
  };

  // Only denormalize when the match actually carries the participants, so we
  // never write empty strings that would shadow the legacy subquery fallback.
  if (match.user1_id) payload.user1_id = match.user1_id;
  if (match.user2_id) payload.user2_id = match.user2_id;

  return payload;
}

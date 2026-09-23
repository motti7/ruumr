import { base44 } from "@/api/base44Client";

// Validates an uploaded photo via the AI moderator backend function.
// photo_type: "person" (profile photos) or "apartment" (apartment photos).
// Returns { approved, reason, validation_error? }.
export const validatePhoto = (data = {}) =>
  base44.functions.invoke("validatePhoto", data);
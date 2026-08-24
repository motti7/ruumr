import { base44 } from "@/api/base44Client";

export const claimPublicProfileInvite = (data = {}) => base44.functions.invoke("claimPublicProfileInvite", data);
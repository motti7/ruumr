import { base44 } from "@/api/base44Client";

export const getPublicProfile = (data = {}) => base44.functions.invoke("getPublicProfile", data);
import { base44 } from "@/api/base44Client";

export const getSubscriptionStatus = (data = {}) => base44.functions.invoke("getSubscriptionStatus", data);

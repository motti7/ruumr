import { base44 } from "@/api/base44Client";

export const cancelSubscription = (data = {}) => base44.functions.invoke("cancelSubscription", data);

import { base44 } from "@/api/base44Client";

export const activateRevenueCatPlus = (data = {}) => (
  base44.functions.invoke("activateRevenueCatPlus", data)
);
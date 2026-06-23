import { base44 } from "@/api/base44Client";

export const ensureBguPlusEntitlement = (data = {}) => (
  base44.functions.invoke("ensureBguPlusEntitlement", data)
);

import { base44 } from "@/api/base44Client";

export const createCheckout = (data = {}) => base44.functions.invoke("createCheckout", data);

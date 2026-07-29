import { base44 } from "@/api/base44Client";

export const submitExternalReview = (data = {}) => base44.functions.invoke("submitExternalReview", data);
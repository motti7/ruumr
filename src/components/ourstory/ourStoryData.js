// Static content for the "Our Story" page.
// Replace placeholders with real materials from the builder (photos, press links, awards, YouTube).

export const SUCCESS_STORIES = [
  { id: "1", nameKey: "our_story_success_1_name", quoteKey: "our_story_success_1_quote", cityKey: "our_story_success_1_city" },
  { id: "2", nameKey: "our_story_success_2_name", quoteKey: "our_story_success_2_quote", cityKey: "our_story_success_2_city" },
  { id: "3", nameKey: "our_story_success_3_name", quoteKey: "our_story_success_3_quote", cityKey: "our_story_success_3_city" },
];

// type drives the icon. tv renders a "watch on TV" CTA linking to url.
export const TRUST_ITEMS = [
  { id: "press", type: "press", labelKey: "our_story_trust_1_label", sourceKey: "our_story_trust_1_source", url: "https://www.geektime.co.il" },
  { id: "award", type: "award", labelKey: "our_story_trust_2_label", sourceKey: "our_story_trust_2_source", url: "#" },
  { id: "accelerator", type: "accelerator", labelKey: "our_story_trust_3_label", sourceKey: "our_story_trust_3_source", url: "#" },
  { id: "tv", type: "tv", labelKey: "our_story_trust_4_label", sourceKey: "our_story_trust_4_source", url: "https://www.youtube.com/" },
];

export const CHECKLIST_POINTS = ["1", "2", "3", "4", "5"];

// Partners on the journey — accelerator & TV logos. Replace placeholder names/logoUrl with real logos.
export const PARTNERS = [
  { id: "p1", type: "accelerator", nameKey: "our_story_partner_1_name", logoUrl: null },
  { id: "p2", type: "accelerator", nameKey: "our_story_partner_2_name", logoUrl: null },
  { id: "p3", type: "tv", nameKey: "our_story_partner_3_name", logoUrl: null },
  { id: "p4", type: "tv", nameKey: "our_story_partner_4_name", logoUrl: null },
];
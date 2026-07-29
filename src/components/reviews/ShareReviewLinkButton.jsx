import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShareReviewLinkButton({ userId }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/WriteExternalReview?userId=${userId}`;
    const shareData = {
      title: "רומר - כתיבת ביקורת",
      text: "היי! אשמח שתכתוב/י עליי ביקורת קצרה ברומר 🙂",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // User cancelled the native share sheet - nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "הקישור הועתק!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast({ title: "שגיאה בהעתקת הקישור", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[--theme-orange] text-[--theme-orange] font-bold text-sm"
    >
      {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
      שתפו קישור לקבלת ביקורת
    </button>
  );
}
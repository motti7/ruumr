import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTeamInvite } from "@/api/teamInvites";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reusable "invite a friend to your team by email" form.
 * One friend at a time, with an "add another" affordance after each invite.
 *
 * If `onCollect` is provided, the invite is handed back to the parent instead of being
 * sent over the network immediately (used during onboarding, before the profile exists).
 *
 * @param {{ onInvited?: () => void, onCollect?: (invite: { name: string, email: string }) => void, compact?: boolean }} props
 */
export default function InviteByEmail({ onInvited, onCollect, compact = false }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentName, setSentName] = useState(null);
  const [error, setError] = useState("");

  const canSend = name.trim().length > 0 && EMAIL_RE.test(email.trim());

  const handleSend = async () => {
    if (!canSend || isSending) return;
    setIsSending(true);
    setError("");
    try {
      const trimmed = { name: name.trim(), email: email.trim() };
      if (onCollect) {
        onCollect(trimmed);
      } else {
        await createTeamInvite(trimmed);
        onInvited?.();
      }
      setSentName(trimmed.name);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err?.message || "משהו השתבש, נסה/י שוב");
    }
    setIsSending(false);
  };

  if (sentName) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center"
        dir="rtl"
      >
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-bold text-gray-800">ההזמנה נשלחה ל{sentName} 🎉</p>
        <p className="text-sm text-gray-500 mt-1">
          אם {sentName} כבר ב-Ruumr נבקש אישור, ואם לא — נשלח הזמנה להצטרף.
        </p>
        <button
          onClick={() => setSentName(null)}
          className="mt-3 inline-flex items-center gap-1.5 text-[--theme-orange] font-bold text-sm"
        >
          <UserPlus className="w-4 h-4" />
          הוסף/י עוד חבר/ה
        </button>
      </motion.div>
    );
  }

  return (
    <div className={compact ? "" : "bg-white rounded-2xl p-4 shadow-sm border border-gray-100"} dir="rtl">
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-[--theme-orange]" />
          <p className="font-bold text-gray-700">הזמנת חבר/ה במייל</p>
        </div>
      )}
      <div className="space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם החבר/ה"
          className="h-10 text-sm bg-white border-gray-200 w-full"
          dir="rtl"
        />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          placeholder="כתובת מייל"
          className="h-10 text-sm bg-white border-gray-200 w-full text-right"
          dir="rtl"
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-500 text-right"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <Button
          onClick={handleSend}
          disabled={!canSend || isSending}
          className="w-full h-10 rounded-full text-sm font-bold gradient-orange text-white hover:brightness-110 disabled:opacity-50"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלח/י הזמנה"}
        </Button>
      </div>
    </div>
  );
}

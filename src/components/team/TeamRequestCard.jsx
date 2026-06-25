import React, { useState } from "react";
import { motion } from "framer-motion";
import { UsersRound, Check, X, Loader2 } from "lucide-react";
import { respondToTeamInvite } from "@/api/teamInvites";

/**
 * Incoming team request the current user can approve or decline.
 *
 * @param {{ invite: any, onResolved?: (inviteId: string, action: string) => void }} props
 */
export default function TeamRequestCard({ invite, onResolved }) {
  const [busy, setBusy] = useState(null); // 'accept' | 'decline' | null

  const respond = async (action) => {
    if (busy) return;
    setBusy(action);
    try {
      await respondToTeamInvite(invite.id, action);
      onResolved?.(invite.id, action);
    } catch (err) {
      console.error("Failed to respond to team invite:", err);
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full gradient-orange flex items-center justify-center flex-shrink-0">
          <UsersRound className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 leading-tight">
            {invite.inviter_name || "מישהו"} רוצה אותך בצוות
          </p>
          <p className="text-xs text-gray-500 mt-0.5">אם תאשר/י, תתווספו אחד לצוות של השני/ה</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => respond("accept")}
          disabled={!!busy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[--theme-orange] text-white text-sm font-bold py-2 rounded-full disabled:opacity-60"
        >
          {busy === "accept" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          אישור
        </button>
        <button
          onClick={() => respond("decline")}
          disabled={!!busy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 text-sm font-bold py-2 rounded-full disabled:opacity-60"
        >
          {busy === "decline" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          דחייה
        </button>
      </div>
    </motion.div>
  );
}

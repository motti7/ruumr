import React, { useState } from "react";
import { Star, X, ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import WriteReviewModal from "./WriteReviewModal";
import { motion, AnimatePresence } from "framer-motion";

export default function WriteReviewButton() {
  const [showPicker, setShowPicker] = useState(false);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const m1 = await base44.entities.Match.filter({ user1_id: user.id });
      const m2 = await base44.entities.Match.filter({ user2_id: user.id });
      const allMatches = [...m1, ...m2].filter(m => m.status === 'active');

      // Get profile for each partner
      const results = await Promise.all(allMatches.map(async (match) => {
        const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const partnerName = match.user1_id === user.id ? match.user2_name : match.user1_name;
        const profiles = await base44.entities.Profile.filter({ user_id: partnerId });
        const photo = profiles[0]?.photos?.[0] || null;
        return { userId: partnerId, name: partnerName, photo };
      }));

      setMatches(results);
    } catch (error) {
      console.error("Failed to load review matches:", error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setShowPicker(true);
    loadMatches();
  };

  return (
    <>
      <button 
        onClick={handleOpen} 
        className="header-glow relative min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="כתוב חוות דעת"
      >
        <Star className="w-6 h-6 text-yellow-400" fill="none" />
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-end justify-center"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-yellow-50 rounded-t-3xl w-full max-w-md p-6 border-t-4 border-yellow-300"
              style={{ paddingBottom: 'calc(1.5rem + var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 80px)' }}
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" fill="#facc15" /> כתוב חוות דעת</h3>
                <button onClick={() => setShowPicker(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {isLoading ? (
                <p className="text-center text-gray-400 py-8">טוען...</p>
              ) : matches.length === 0 ? (
                <p className="text-center text-gray-400 py-8">אין לך התאמות עדיין לכתיבת חוות דעת</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {matches.map((m) => (
                    <button
                      key={m.userId}
                      onClick={() => { setSelectedUser(m); setShowPicker(false); }}
                      className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {m.photo ? (
                        <img src={m.photo} className="w-12 h-12 rounded-full object-cover" alt={m.name} />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg">
                          {m.name?.[0]}
                        </div>
                      )}
                      <span className="font-semibold text-gray-800 flex-1 text-right">{m.name}</span>
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedUser && (
        <WriteReviewModal
          reviewedUserId={selectedUser.userId}
          reviewedName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
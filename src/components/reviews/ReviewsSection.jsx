import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";

function StarDisplay({ rating, size = "sm" }) {
  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={sz}
          fill={rating >= s ? "#FF5722" : "none"}
          stroke={rating >= s ? "#FF5722" : "#d1d5db"}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection({ userId }) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Review.filter({ reviewed_id: userId });
      setReviews(data);
      setIsLoading(false);
    };
    load();
  }, [userId]);

  if (isLoading) return null;
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-lg">{t("reviews")}</h4>
        <div className="flex items-center gap-2">
          <StarDisplay rating={Math.round(avg)} size="sm" />
          <span className="text-sm font-bold text-gray-700">{avg.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({reviews.length})</span>
        </div>
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-800">{r.reviewer_name}</span>
              <StarDisplay rating={r.rating} size="sm" />
            </div>
            {r.text && <p className="text-gray-600 text-sm leading-relaxed">{r.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
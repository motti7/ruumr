import React, { useState, useEffect } from "react";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { submitExternalReview } from "@/functions/submitExternalReview";

export default function WriteExternalReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");

  const [targetName, setTargetName] = useState(null);
  const [targetPhoto, setTargetPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTarget = async () => {
      if (!userId) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      try {
        const res = await submitExternalReview({ action: "get_target", userId });
        if (res.data?.name) {
          setTargetName(res.data.name);
          setTargetPhoto(res.data.photo);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        setNotFound(true);
      }
      setIsLoading(false);
    };
    loadTarget();
  }, [userId]);

  const handleSubmit = async () => {
    if (rating === 0 || !reviewerName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await submitExternalReview({
        action: "submit",
        userId,
        rating,
        text: text.trim(),
        reviewerName: reviewerName.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      setError("שליחת הביקורת נכשלה, נסו שוב.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center" dir="rtl">
        <p className="text-gray-600 font-medium">הקישור אינו תקין או שהמשתמש לא נמצא.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center" dir="rtl">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">תודה!</h2>
        <p className="text-gray-600">הביקורת שלך נשלחה בהצלחה ותוצג בפרופיל של {targetName}.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md">
        <div className="text-center mb-6">
          {targetPhoto && (
            <img src={targetPhoto} alt={targetName} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
          )}
          <h1 className="text-xl font-bold text-gray-900">כתיבת ביקורת על {targetName}</h1>
          <p className="text-sm text-gray-500 mt-1">הביקורת תוצג בפרופיל שלו/ה באפליקציית רומר</p>
        </div>

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} כוכבים`}
            >
              <Star
                className="w-9 h-9 transition-colors"
                fill={(hoverRating || rating) >= star ? "#facc15" : "none"}
                stroke={(hoverRating || rating) >= star ? "#eab308" : "#d1d5db"}
              />
            </button>
          ))}
        </div>

        <input
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="השם שלך"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[--theme-orange]"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ספר/י על החוויה שלך לגור יחד..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[--theme-orange]"
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || !reviewerName.trim() || isSubmitting}
          className="w-full mt-4 gradient-orange text-white font-bold rounded-full h-12 disabled:opacity-50"
        >
          {isSubmitting ? "שולח..." : "שליחת ביקורת"}
        </button>
      </div>
    </div>
  );
}
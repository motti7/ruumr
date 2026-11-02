import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, SlidersHorizontal, UserRound, Wallet } from "lucide-react";
import { roomText as rt, roomDirection } from "@/lib/room-i18n";
import { createPageUrl } from "@/utils";

// One roommate ad. Structured like a listing (who, where, budget, what they
// want) so the desktop view reads as ads rather than as a swipe deck. On
// desktop a like is a single click on the card instead of a swipe gesture.
function PartnerAdCard({ profile, liked, onLike }) {
  const photo = (profile.photos || []).find(Boolean) || "";
  const city = (profile.search_cities || [])[0] || profile.location || "";
  const seeking = (profile.current_status || "seeking_apartment") === "seeking_apartment";
  const about = (profile.about_me || "").trim();

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-warm-line bg-white text-start shadow-[0_10px_30px_rgba(52,36,24,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(28,83,212,.12)]">
      {/* The card opens the full profile; the like button sits above this layer. */}
      <Link
        to={createPageUrl("ProfileView") + `?userId=${profile.user_id}`}
        className="absolute inset-0 z-[1]"
        aria-label={`${profile.name} — ${rt("partners.open")}`}
      />

      <div className="relative h-[210px] w-full overflow-hidden bg-warm-canvas">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-[--theme-blue]">
            <UserRound className="h-12 w-12" strokeWidth={1.5} />
          </div>
        )}
        <span className="absolute top-3 start-3 rounded-full bg-white/95 px-3 py-1 text-[12px] font-bold text-[--theme-blue] shadow-sm">
          {seeking ? rt("partners.seeking") : rt("partners.has_apartment")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-[19px] font-extrabold leading-tight text-[#1d2a24]">
            {profile.name}{profile.age ? `, ${profile.age}` : ""}
          </h3>
          {city && (
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-[--theme-blue]" />
              {city}
            </p>
          )}
        </div>

        {about && <p className="line-clamp-2 text-[13.5px] leading-relaxed text-gray-600">{about}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-warm-line pt-3">
          {profile.budget_max ? (
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700">
              <Wallet className="h-3.5 w-3.5 text-[--theme-blue]" />
              {rt("partners.budget")} ₪{profile.budget_max.toLocaleString()}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onLike?.(profile);
            }}
            disabled={liked}
            aria-pressed={liked}
            className={`relative z-[2] inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-extrabold transition ${
              liked
                ? 'cursor-default border border-[--theme-orange]/30 bg-orange-50 text-[--theme-orange]'
                : 'bg-[--theme-orange] text-white shadow-[0_6px_16px_rgba(241,90,50,.28)] hover:brightness-95'
            }`}
          >
            <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} strokeWidth={2.5} />
            {liked ? rt("partners.liked") : rt("partners.like")}
          </button>
        </div>
      </div>
    </article>
  );
}

// Desktop-only view of the roommates pool: a grid of ads instead of the deck.
const PAGE_SIZE = 24;

export default function PartnersGrid({ profiles = [], likedUserIds, onLike, onRefresh }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [profiles.length]);

  const shown = profiles.slice(0, visibleCount);
  const isLiked = (profile) => Boolean(likedUserIds && likedUserIds.has(String(profile.user_id)));

  return (
    <section className="mx-auto w-full max-w-[1280px] px-8 pb-16 pt-8" dir={roomDirection()}>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[62ch]">
          <p className="mb-3 inline-flex items-center rounded-full border border-[#d6dff6] bg-white px-3 py-1 text-[12.5px] font-extrabold tracking-wide text-[--theme-blue]">
            {rt("partners.eyebrow")}
          </p>
          <h1 className="text-[clamp(28px,2.6vw,38px)] font-extrabold leading-[1.1] tracking-[-.8px] text-[#1d2a24]">
            {rt("partners.title")}
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-gray-600">{rt("partners.sub")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("openDiscoverFilters"))}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d6dff6] bg-white px-4 text-[13.5px] font-bold text-[--theme-blue] transition hover:bg-[#f2f5fd]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {rt("hub.filters")}
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 items-center rounded-full border border-warm-line bg-white px-4 text-[13.5px] font-bold text-gray-600 transition hover:bg-warm-surface"
            >
              {rt("partners.refresh")}
            </button>
          )}
        </div>
      </header>

      {profiles.length > 0 ? (
        <>
          <p className="mb-4 text-[13px] font-bold text-gray-500">
            {rt("partners.count", { count: profiles.length })}
          </p>
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-3">
            {shown.map((profile, index) => (
              <PartnerAdCard
                key={profile.id || profile.user_id || index}
                profile={profile}
                liked={isLiked(profile)}
                onLike={onLike}
              />
            ))}
          </div>
          {profiles.length > shown.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex h-11 items-center rounded-full border border-[#d6dff6] bg-white px-6 text-[14px] font-bold text-[--theme-blue] transition hover:bg-[#f2f5fd]"
              >
                {rt("partners.show_more")}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-3xl border border-warm-line bg-white px-6 py-10 text-center text-[15px] font-semibold text-gray-500">
          {rt("partners.empty")}
        </p>
      )}
    </section>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Plus, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { roomText as rt, roomDirection } from "@/lib/room-i18n";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80";

const PILLS = [
  { key: "hero.pill_match", icon: Users },
  { key: "hero.pill_direct", icon: ShieldCheck },
  { key: "hero.pill_fast", icon: Zap },
];

// Desktop opening band for the rooms page: one short promise, three quick
// facts and one photo, so the section reads in a glance instead of a block of
// copy.
export default function RoomsDesktopHero({ isAuthenticated }) {
  return (
    <section className="rk-hero" dir={roomDirection()}>
      <div className="rk-hero-copy">
        <p className="rk-hero-eyebrow">
          <Sparkles className="h-3.5 w-3.5" />
          {rt("hero.eyebrow")}
        </p>
        <h1 className="rk-hero-title">{rt("hero.title")}</h1>
        <p className="rk-hero-sub">{rt("hero.sub")}</p>

        <ul className="rk-hero-pills">
          {PILLS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              {rt(key)}
            </li>
          ))}
        </ul>

        <div className="rk-hero-actions">
          <Link
            to={isAuthenticated ? "/AddRoom" : "/register?next=AddRoom"}
            className="rk-btn rk-btn-primary"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {rt("hero.cta_list")}
          </Link>
          <Link
            to={isAuthenticated ? "/Discover?view=people" : "/login?next=Partner"}
            className="rk-btn rk-btn-ghost"
          >
            <Users className="h-4 w-4" strokeWidth={2.5} />
            {rt("hero.cta_partners")}
          </Link>
        </div>
      </div>

      <figure className="rk-hero-media">
        <img src={HERO_IMAGE} alt={rt("hero.image_alt")} loading="lazy" />
      </figure>
    </section>
  );
}
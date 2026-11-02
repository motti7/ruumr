import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Users } from "lucide-react";
import { roomText as rt, roomDirection } from "@/lib/room-i18n";

// Desktop-only opening band for the rooms feed: headline, two clear actions and
// three honest value points.
export default function RoomsDesktopHero({ isAuthenticated }) {
  return (
    <section className="rk-hero" dir={roomDirection()}>
      <div className="rk-hero-copy">
        <p className="rk-hero-eyebrow">
          <MapPin className="h-3.5 w-3.5" />
          {rt("hero.eyebrow")}
        </p>
        <h1 className="rk-hero-title">{rt("hero.title")}</h1>
        <p className="rk-hero-sub">{rt("hero.sub")}</p>
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

      <div className="rk-hero-stats">
        <div className="rk-stat">
          <strong>{rt("hero.stat_fee_value")}</strong>
          <span>{rt("hero.stat_fee_label")}</span>
        </div>
        <span className="rk-stat-divider" aria-hidden="true" />
        <div className="rk-stat">
          <strong>{rt("hero.stat_time_value")}</strong>
          <span>{rt("hero.stat_time_label")}</span>
        </div>
        <span className="rk-stat-divider" aria-hidden="true" />
        <div className="rk-stat">
          <strong>{rt("hero.stat_direct_value")}</strong>
          <span>{rt("hero.stat_direct_label")}</span>
        </div>
      </div>
    </section>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Check, MapPin, Plus, Sparkles, Users } from "lucide-react";
import { roomText as rt, roomDirection } from "@/lib/room-i18n";

const FEATURES = [
  { title: "hero.feature1_title", text: "hero.feature1_text" },
  { title: "hero.feature2_title", text: "hero.feature2_text" },
  { title: "hero.feature3_title", text: "hero.feature3_text" },
];

// Desktop opening band: what Ruumr gives you on this page — quality roommate
// matching, real rooms in shared apartments, and every room detail laid out
// clearly — shown next to a preview of an organised room card.
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

        <ul className="rk-hero-features">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <span className="rk-feature-icon">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <div>
                <strong>{rt(feature.title)}</strong>
                <span>{rt(feature.text)}</span>
              </div>
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

      <aside className="rk-hero-preview">
        <p className="rk-preview-label">{rt("hero.preview_label")}</p>
        <div className="rk-preview-card">
          <div className="rk-preview-head">
            <div>
              <p className="rk-preview-city">
                <MapPin className="h-3.5 w-3.5" />
                {rt("hero.preview_city")}
              </p>
              <h3>{rt("hero.preview_title")}</h3>
            </div>
            <p className="rk-preview-price">
              <strong>₪2,800</strong>
              <span>{rt("hero.preview_per_month")}</span>
            </p>
          </div>

          <dl className="rk-preview-facts">
            {[
              ["hero.preview_fact_entry", "01/12"],
              ["hero.preview_fact_roommates", "3"],
              ["hero.preview_fact_furniture", rt("hero.preview_furniture_value")],
              ["hero.preview_fact_period", rt("hero.preview_period_value")],
            ].map(([labelKey, value]) => (
              <div key={labelKey}>
                <dt>{rt(labelKey)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="rk-preview-chips">
            <span>{rt("hero.preview_chip_shabbat")}</span>
            <span>{rt("hero.preview_chip_kosher")}</span>
            <span>{rt("hero.preview_chip_pets")}</span>
          </div>
          <p className="rk-preview-note">{rt("hero.preview_note")}</p>
        </div>
      </aside>
    </section>
  );
}
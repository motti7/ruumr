import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/shared/LanguageToggle";

const WHATSAPP_URL = "https://wa.me/972548523140";

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-gray-400">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14.5px] font-semibold text-gray-600 transition-colors hover:text-[--theme-orange]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.to}
                className="text-[14.5px] font-semibold text-gray-600 transition-colors hover:text-[--theme-orange]"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Site-wide desktop footer. Rendered by Layout only on desktop, so the mobile
// app keeps its bottom tab bar and full-height pages untouched.
export default function SiteFooter() {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer dir={i18n.dir()} className="hidden border-t border-gray-100 bg-white lg:block">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1.6fr_1fr_1fr_1fr] gap-12 px-8 py-14">
        <div>
          <img src="/ruumr-wordmark.svg" alt="Ruumr" className="h-7 w-auto dark:invert" />
          <p className="mt-5 max-w-[30ch] text-[15px] leading-relaxed text-gray-500">
            {t("site_footer_tagline")}
          </p>
          <div className="mt-6">
            <LanguageToggle />
          </div>
        </div>

        <FooterColumn
          title={t("site_footer_browse")}
          links={[
            { label: t("site_footer_rooms"), to: "/Rooms" },
            { label: t("site_footer_partners"), to: "/Discover?view=people" },
            { label: t("site_footer_add_room"), to: "/AddRoom" },
          ]}
        />

        <FooterColumn
          title={t("site_footer_app")}
          links={[
            { label: t("nav_our_story"), to: "/OurStory" },
            { label: "Ruumr Plus", to: "/RuumrPlus" },
            { label: t("site_footer_rooms"), to: "/SavedRooms" },
          ]}
        />

        <FooterColumn
          title={t("site_footer_support")}
          links={[
            { label: t("help_center"), to: "/HelpCenter" },
            { label: t("terms_of_use"), to: "/Terms" },
            { label: t("privacy_policy"), to: "/Privacy" },
            { label: t("contact_us"), href: WHATSAPP_URL },
          ]}
        />
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-5 text-xs font-semibold text-gray-400">
          <span>© {year} Ruumr · {t("site_footer_rights")}</span>
          <span dir="ltr">find your place, with the right people.</span>
        </div>
      </div>
    </footer>
  );
}
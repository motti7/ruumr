import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Home, Loader2, MapPin } from "lucide-react";
import { ensureTeamApartmentDiscovery } from "@/api/teamApartmentDiscovery";

function mapApartments(discovery) {
  const lifecycle = discovery?.lifecycle_state || "";
  if (lifecycle === "APARTMENT_VIEWING" || lifecycle === "APARTMENT_FOUND") {
    return [discovery.current_apartment || discovery.selected_apartment || discovery.winning_apartment].filter(Boolean);
  }
  return discovery?.suggested_apartments || [];
}

export default function ApartmentMap() {
  const { t, i18n } = useTranslation();
  const [discovery, setDiscovery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await ensureTeamApartmentDiscovery();
        if (!cancelled) setDiscovery(result.discovery || null);
      } catch (error) {
        console.error("[ruumr] apartment map load failed", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apartments = useMemo(() => mapApartments(discovery), [discovery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4" dir={i18n.dir()}>
      <section className="rounded-2xl gradient-orange text-white p-5 text-right">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
          <MapPin className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold">{t("apartment_map_title")}</h1>
        <p className="text-sm text-white/85 mt-1">{t("apartment_map_body")}</p>
      </section>

      <section className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="h-56 bg-orange-50 relative">
          <div className="absolute inset-0 opacity-60 bg-[linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:32px_32px]" />
          {apartments.map((apartment, index) => (
            <div
              key={apartment.id}
              className="absolute w-10 h-10 rounded-full bg-[--theme-orange] text-white shadow-lg flex items-center justify-center font-extrabold border-2 border-white"
              style={{
                insetInlineStart: `${18 + index * 25}%`,
                top: `${32 + (index % 2) * 28}%`,
              }}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <div className="p-4 space-y-3">
          {apartments.length === 0 ? (
            <p className="text-sm font-bold text-gray-500">{t("apartment_map_empty")}</p>
          ) : (
            apartments.map((apartment, index) => (
              <div key={apartment.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[--theme-orange] font-extrabold">
                  {index + 1}
                </div>
                <div className="flex-1 text-right">
                  <p className="font-extrabold text-gray-900">{apartment.address_he || apartment.address || apartment.neighborhood}</p>
                  <p className="text-xs font-bold text-gray-500">{apartment.city}</p>
                </div>
                <Home className="w-5 h-5 text-gray-300" />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

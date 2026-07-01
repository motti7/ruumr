import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { Building2, Loader2, MapPin, UsersRound } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ensureTeamApartmentDiscovery } from "@/api/teamApartmentDiscovery";
import { getLanguageDirection, isRtlLanguage } from "@/lib/languageDirection";
import { isDemoApartmentServicesStage } from "@/lib/demoStage";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

const CITY_CENTERS = {
  "תל אביב": [32.0809, 34.7806],
  "Tel Aviv": [32.0809, 34.7806],
  "רמת גן": [32.0684, 34.8248],
  "Ramat Gan": [32.0684, 34.8248],
  "גבעתיים": [32.0722, 34.8125],
  "Givatayim": [32.0722, 34.8125],
  "גבעת שמואל": [32.0785, 34.8491],
  "Givat Shmuel": [32.0785, 34.8491],
  "פתח תקווה": [32.0871, 34.8878],
  "Petah Tikva": [32.0871, 34.8878],
  "ירושלים": [31.7683, 35.2137],
  "Jerusalem": [31.7683, 35.2137],
  "חיפה": [32.794, 34.9896],
  "Haifa": [32.794, 34.9896],
  "באר שבע": [31.2529, 34.7915],
  "Be'er Sheva": [31.2529, 34.7915],
  "נתניה": [32.3215, 34.8532],
  "Netanya": [32.3215, 34.8532],
  "הרצליה": [32.1624, 34.8447],
  "Herzliya": [32.1624, 34.8447],
};

const CITY_LABELS = {
  "תל אביב": { en: "Tel Aviv", he: "תל אביב" },
  "רמת גן": { en: "Ramat Gan", he: "רמת גן" },
  "גבעתיים": { en: "Givatayim", he: "גבעתיים" },
  "גבעת שמואל": { en: "Givat Shmuel", he: "גבעת שמואל" },
  "פתח תקווה": { en: "Petah Tikva", he: "פתח תקווה" },
  "ירושלים": { en: "Jerusalem", he: "ירושלים" },
  "חיפה": { en: "Haifa", he: "חיפה" },
  "באר שבע": { en: "Be'er Sheva", he: "באר שבע" },
  "נתניה": { en: "Netanya", he: "נתניה" },
  "הרצליה": { en: "Herzliya", he: "הרצליה" },
};

function mapApartments(discovery) {
  const lifecycle = discovery?.lifecycle_state || "";
  if (lifecycle === "APARTMENT_VIEWING" || lifecycle === "APARTMENT_FOUND") {
    return [discovery.current_apartment || discovery.selected_apartment || discovery.winning_apartment].filter(Boolean);
  }
  return discovery?.suggested_apartments || [];
}

function displayCity(city, language) {
  const label = CITY_LABELS[String(city || "").trim()];
  return label?.[language === "he" ? "he" : "en"] || city;
}

function displayAddress(apartment, language) {
  if (language === "he") {
    return apartment.address_he || apartment.address || apartment.neighborhood_he || apartment.neighborhood;
  }
  if (apartment.address_en) {
    const rawCity = String(apartment.city || "");
    return apartment.address_en.replace(rawCity, displayCity(rawCity, language));
  }
  const neighborhood = apartment.neighborhood_en || apartment.neighborhood;
  return [neighborhood, displayCity(apartment.city, language)].filter(Boolean).join(", ");
}

function numericCoordinate(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function fallbackPosition(apartment, index) {
  const center = CITY_CENTERS[apartment.city] || CITY_CENTERS[displayCity(apartment.city, "en")] || CITY_CENTERS["תל אביב"];
  const angle = index * 2.2;
  const radius = 0.004 + index * 0.0015;
  return [
    center[0] + Math.sin(angle) * radius,
    center[1] + Math.cos(angle) * radius,
  ];
}

function apartmentPosition(apartment, index) {
  const lat = numericCoordinate(
    apartment.latitude,
    apartment.lat,
    apartment.location?.lat,
    apartment.coordinates?.lat,
    apartment.geo?.latitude
  );
  const lng = numericCoordinate(
    apartment.longitude,
    apartment.lng,
    apartment.location?.lng,
    apartment.coordinates?.lng,
    apartment.geo?.longitude
  );
  if (lat !== null && lng !== null) return [lat, lng];
  return fallbackPosition(apartment, index);
}

function createMarkerIcon(index, active) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${active ? 42 : 34}px;
        height:${active ? 42 : 34}px;
        border-radius:999px;
        background:${active ? "#FA3803" : "#111827"};
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:900;
        font-size:${active ? 16 : 13}px;
        border:3px solid white;
        box-shadow:0 12px 24px rgba(17,24,39,.28);
      ">${index + 1}</div>
    `,
    iconSize: [active ? 42 : 34, active ? 42 : 34],
    iconAnchor: [active ? 21 : 17, active ? 21 : 17],
    popupAnchor: [0, active ? -22 : -18],
  });
}

function createTeamMarkerIcon(index) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px;
        height:32px;
        border-radius:999px;
        background:#2563EB;
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:900;
        font-size:12px;
        border:3px solid white;
        box-shadow:0 10px 22px rgba(37,99,235,.28);
      ">${index + 1}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function teamLocationPosition(location) {
  const lat = numericCoordinate(location.latitude, location.lat, location.location?.lat);
  const lng = numericCoordinate(location.longitude, location.lng, location.location?.lng);
  return lat !== null && lng !== null ? [lat, lng] : null;
}

function teamLocationLabel(location, language) {
  return language === "he"
    ? location.label_he || location.label || location.name
    : location.label_en || location.label || location.name;
}

function FitMapToMarkers({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0].position, 15, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(points.map((point) => point.position));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15, animate: false });
  }, [map, points]);

  return null;
}

export default function ApartmentMap() {
  const { t, i18n } = useTranslation();
  const [discovery, setDiscovery] = useState(null);
  const [loading, setLoading] = useState(true);
  const direction = getLanguageDirection(i18n);
  const isRtl = isRtlLanguage(i18n);
  const textAlignClass = isRtl ? "text-right" : "text-left";

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
  const points = useMemo(
    () =>
      apartments.map((apartment, index) => ({
        apartment,
        index,
        position: apartmentPosition(apartment, index),
      })),
    [apartments]
  );
  const teamPoints = useMemo(
    () =>
      (discovery?.team_locations || [])
        .map((location, index) => ({
          location,
          index,
          position: teamLocationPosition(location),
        }))
        .filter((point) => point.position),
    [discovery?.team_locations]
  );
  const center = points[0]?.position || teamPoints[0]?.position || CITY_CENTERS[discovery?.selected_city] || CITY_CENTERS["תל אביב"];
  const currentApartmentId =
    discovery?.current_apartment?.id ||
    discovery?.selected_apartment?.id ||
    discovery?.winning_apartment?.id ||
    "";

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language === "he" ? "he-IL" : "en-US", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }),
    [i18n.language]
  );

  if (isRuumrSimulatorMode() && isDemoApartmentServicesStage()) {
    return <Navigate to="/ApartmentServices" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4" dir={direction}>
      <section className={`rounded-2xl gradient-orange text-white p-5 ${textAlignClass}`}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
          <MapPin className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold">{t("apartment_map_title")}</h1>
        <p className="text-sm text-white/85 mt-1">{t("apartment_map_body")}</p>
      </section>

      <section className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        <div className="h-[360px] bg-orange-50 relative">
          {points.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm font-bold text-gray-500">{t("apartment_map_empty")}</p>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={14}
              scrollWheelZoom
              className="h-full w-full z-0"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitMapToMarkers points={[...points, ...teamPoints]} />
              {points.map(({ apartment, index, position }) => {
                const active = !currentApartmentId || apartment.id === currentApartmentId;
                return (
                  <Marker
                    key={apartment.id}
                    position={position}
                    icon={createMarkerIcon(index, active)}
                  >
                    <Popup>
                      <div className={`w-48 ${textAlignClass}`}>
                        {apartment.image && (
                          <img src={apartment.image} alt="" className="w-full h-20 object-cover rounded-md mb-2" />
                        )}
                        <p className="font-bold text-gray-900 m-0">
                          {displayAddress(apartment, i18n.language)}
                        </p>
                        <p className="text-xs text-gray-500 m-0 mt-1">
                          {priceFormatter.format(apartment.price || 0)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              {teamPoints.map(({ location, index, position }) => (
                <Marker
                  key={`${location.user_id || location.name}-${index}`}
                  position={position}
                  icon={createTeamMarkerIcon(index)}
                >
                  <Popup>
                    <div className={`w-44 ${textAlignClass}`}>
                      <p className="font-bold text-gray-900 m-0">{location.name}</p>
                      <p className="text-xs text-gray-500 m-0 mt-1">
                        {teamLocationLabel(location, i18n.language)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="p-4 space-y-3">
          {apartments.length === 0 ? (
            <p className="text-sm font-bold text-gray-500">{t("apartment_map_empty")}</p>
          ) : (
            points.map(({ apartment, index }) => (
              <div key={apartment.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold ${
                  !currentApartmentId || apartment.id === currentApartmentId
                    ? "bg-[--theme-orange] text-white"
                    : "bg-white border border-gray-100 text-gray-500"
                }`}>
                  {index + 1}
                </div>
                <div className={`flex-1 ${textAlignClass}`}>
                  <p className="font-extrabold text-gray-900">{displayAddress(apartment, i18n.language)}</p>
                  <p className="text-xs font-bold text-gray-500">
                    {displayCity(apartment.city, i18n.language)} · {priceFormatter.format(apartment.price || 0)}
                  </p>
                </div>
                <Building2 className="w-5 h-5 text-gray-300" />
              </div>
            ))
          )}
        </div>
      </section>

      {teamPoints.length > 0 && (
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
          <div className={`flex items-center gap-2 ${textAlignClass}`}>
            <UsersRound className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-gray-900">{t("apartment_team_locations")}</h2>
          </div>
          <div className="space-y-2">
            {teamPoints.map(({ location, index }) => (
              <div key={`${location.user_id || location.name}-${index}`} className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                  {index + 1}
                </div>
                <div className={`flex-1 ${textAlignClass}`}>
                  <p className="font-extrabold text-gray-900">{location.name}</p>
                  <p className="text-xs font-bold text-blue-700">{teamLocationLabel(location, i18n.language)}</p>
                </div>
                <MapPin className="w-5 h-5 text-blue-300" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

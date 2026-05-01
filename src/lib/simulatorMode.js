const SIMULATOR_STORAGE_KEY = 'ruumr_simulator_mode';
const SIMULATOR_QUERY_PARAM = 'simulator_mode';

const PROFILE_PALETTE = [
  ['#FA3803', '#FF7A45'],
  ['#FF8A3D', '#FFB45C'],
  ['#F97316', '#FDBA74'],
];

const APARTMENT_PALETTE = [
  ['#0EA5E9', '#38BDF8'],
  ['#2563EB', '#60A5FA'],
  ['#334155', '#94A3B8'],
];

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getInitials(name) {
  const cleaned = String(name || '').trim();
  if (!cleaned) {
    return 'R';
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || 'R'}${parts[1][0] || ''}`.toUpperCase();
}

function createSimulatorImageDataUri({ title, subtitle, initials, palette, accent = '#FFFFFF' }) {
  const [colorA, colorB] = palette;
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeInitials = escapeXml(initials);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="25%" r="65%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="900" height="1200" rx="72" fill="url(#bg)" />
      <circle cx="200" cy="160" r="280" fill="url(#glow)" />
      <circle cx="730" cy="1020" r="220" fill="#FFFFFF" fill-opacity="0.08" />
      <rect x="120" y="180" width="660" height="840" rx="56" fill="#FFFFFF" fill-opacity="0.16" stroke="#FFFFFF" stroke-opacity="0.18" />
      <circle cx="450" cy="450" r="150" fill="#FFFFFF" fill-opacity="0.92" />
      <text x="450" y="492" text-anchor="middle" font-size="108" font-weight="800" font-family="Inter, Arial, sans-serif" fill="${colorA}">${safeInitials}</text>
      <text x="450" y="710" text-anchor="middle" font-size="62" font-weight="800" font-family="Inter, Arial, sans-serif" fill="#FFFFFF">${safeTitle}</text>
      <text x="450" y="784" text-anchor="middle" font-size="32" font-weight="500" font-family="Inter, Arial, sans-serif" fill="#FFFFFF" fill-opacity="0.9">${safeSubtitle}</text>
      <text x="450" y="910" text-anchor="middle" font-size="26" font-weight="600" font-family="Inter, Arial, sans-serif" fill="#FFFFFF" fill-opacity="0.82">Simulator mode</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function fillWithPlaceholders(existing, minCount, options) {
  const next = [...existing];
  while (next.length < minCount) {
    const index = next.length;
    next.push(createSimulatorImageDataUri({
      title: options.title(index),
      subtitle: options.subtitle(index),
      initials: options.initials,
      palette: options.palette[index % options.palette.length],
      accent: options.accent,
    }));
  }
  return next;
}

export function isRuumrSimulatorMode() {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_RUUMR_SIMULATOR_MODE === 'true';
  }

  try {
    const queryValue = new URLSearchParams(window.location.search).get(SIMULATOR_QUERY_PARAM);
    if (queryValue === 'true' || queryValue === '1') {
      window.localStorage.setItem(SIMULATOR_STORAGE_KEY, 'true');
    } else if (queryValue === 'false' || queryValue === '0') {
      window.localStorage.removeItem(SIMULATOR_STORAGE_KEY);
    }
  } catch {
    // Ignore malformed URL state; fall back to stored/env values.
  }

  return import.meta.env.VITE_RUUMR_SIMULATOR_MODE === 'true' || window.localStorage.getItem(SIMULATOR_STORAGE_KEY) === 'true';
}

export function buildSimulatorProfilePhotos(name, existingPhotos = [], minCount = 2) {
  const initials = getInitials(name);
  const titleBase = String(name || 'Ruumr').trim() || 'Ruumr';

  return fillWithPlaceholders(existingPhotos, minCount, {
    title: (index) => index === 0 ? titleBase : `${titleBase} ${index + 1}`,
    subtitle: (index) => index === 0 ? 'Demo profile photo' : `Simulator photo ${index + 1}`,
    initials,
    palette: PROFILE_PALETTE,
    accent: '#FFFFFF',
  });
}

export function buildSimulatorApartmentPhotos(name, existingPhotos = [], minCount = 3) {
  const initials = getInitials(name);
  const titleBase = String(name || 'Ruumr').trim() || 'Ruumr';

  return fillWithPlaceholders(existingPhotos, minCount, {
    title: (index) => index === 0 ? `${titleBase} home` : `${titleBase} apt ${index + 1}`,
    subtitle: (index) => index === 0 ? 'Demo apartment photo' : `Apartment photo ${index + 1}`,
    initials,
    palette: APARTMENT_PALETTE,
    accent: '#FFFFFF',
  });
}

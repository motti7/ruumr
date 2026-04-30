export function getSafeAuthReturnUrl(fallbackPath = '/') {
  if (typeof window === 'undefined') {
    return fallbackPath;
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('from_url');

    if (url.pathname.toLowerCase() === '/login') {
      url.pathname = fallbackPath;
      url.search = '';
      url.hash = '';
    }

    return url.toString();
  } catch {
    return fallbackPath;
  }
}

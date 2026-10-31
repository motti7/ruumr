const APP_FALLBACK = "https://app.ruumrapp.com";

const IMAGE =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c919adff6ac6fafb51bed6/8bae169ed_1770239914916.png";

const COPY = {
  he: {
    lang: "he",
    dir: "rtl",
    locale: "he_IL",
    title: "Ruumr",
    description:
      "רומר: הטינדר של עולם השותפים. מוצאים את המאץ' המושלם לדירה הבאה שלכם. מחליקים, מתחברים, עוברים.",
    cta: "מעבר לרומר",
  },
  en: {
    lang: "en",
    dir: "ltr",
    locale: "en_US",
    title: "Ruumr",
    description:
      "Ruumr: the Tinder for roommates. Find the perfect match for your next home. Swipe, connect, move in.",
    cta: "Continue to Ruumr",
  },
};

// Public, unauthenticated page used as the shared link so the link preview
// (WhatsApp, Facebook, iMessage...) matches the language the user shared in.
// Crawlers read these Open Graph tags and never execute the app, so the copy
// has to be rendered here on the server, one set per language.
export default async function (req) {
  try {
    const url = new URL(req.url);
    const copy = url.searchParams.get("lang") === "en" ? COPY.en : COPY.he;
    const appUrl = (req.headers.get("X-Base44-App-Url") || APP_FALLBACK).replace(/\/+$/, "");
    const shareUrl = `${url.origin}${url.pathname}?lang=${copy.lang}`;

    const html = `<!doctype html>
<html lang="${copy.lang}" dir="${copy.dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${copy.title}</title>
<meta name="description" content="${copy.description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Ruumr" />
<meta property="og:title" content="${copy.title}" />
<meta property="og:description" content="${copy.description}" />
<meta property="og:image" content="${IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${shareUrl}" />
<meta property="og:locale" content="${copy.locale}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${copy.title}" />
<meta name="twitter:description" content="${copy.description}" />
<meta name="twitter:image" content="${IMAGE}" />
<link rel="canonical" href="${appUrl}/" />
<meta http-equiv="refresh" content="0; url=${appUrl}/" />
<style>
html,body{margin:0;height:100%;background:#F14D16;font-family:"Nunito",system-ui,sans-serif}
body{display:flex;align-items:center;justify-content:center}
a{color:#fff;font-size:18px;font-weight:700;text-decoration:none}
</style>
</head>
<body>
<a href="${appUrl}/">${copy.cta}</a>
<script>window.location.replace("${appUrl}/");</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
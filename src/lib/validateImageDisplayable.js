// Verifies that an image file can actually be decoded and rendered in the app
// (WebView / browser). Catches corrupted files, non-image files renamed with an
// image extension, and unsupported formats that the browser cannot decode.
// Returns a Promise resolving to { ok: boolean, error?: string }.
// `error` is one of: 'not_an_image' | 'failed_to_load' | 'invalid_dimensions'.
export function validateImageDisplayable(file) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve({ ok: false, error: 'not_an_image' });
      return;
    }

    let settled = false;
    const finish = (result) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const valid = img.naturalWidth > 0 && img.naturalHeight > 0;
        finish({ ok: valid, error: valid ? undefined : 'invalid_dimensions' });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        finish({ ok: false, error: 'failed_to_load' });
      };
      img.src = url;
      // Safety net: if neither event fires within 8s, treat as undisplayable.
      setTimeout(() => finish({ ok: false, error: 'failed_to_load' }), 8000);
    } catch {
      finish({ ok: false, error: 'failed_to_load' });
    }
  });
}
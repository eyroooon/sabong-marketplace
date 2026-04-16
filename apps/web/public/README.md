# BloodlinePH public assets

This directory holds static files served at the web root (e.g. `/manifest.json`, `/icon.svg`).

## Required PNG icons (to be added)

The PWA manifest and root metadata reference the following PNG files. They are not
committed as binaries — generate them from the brand logo and drop them in here:

- `icon-192.png` — 192x192, used by the PWA manifest (maskable + any).
- `icon-512.png` — 512x512, used by the PWA manifest (maskable + any).
- `apple-icon.png` — 180x180, used for iOS home screen.
- `favicon.ico` — 32x32/48x48 multi-size favicon.
- `og-image.png` — 1200x630, used for Open Graph / Twitter share previews.

A simple `icon.svg` is included as a placeholder SVG favicon (red "S" mark) and can
be used to generate the PNG variants above using a tool such as
[realfavicongenerator.net](https://realfavicongenerator.net/) or `sharp`/ImageMagick.

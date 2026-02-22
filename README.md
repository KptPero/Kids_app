# Kids Edu PWA

A gentle, offline-first Progressive Web App for children ages 1–3. Features touch-friendly learning activities with audio support.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Features

- **Letters**: Tracing practice with faded letter guides; say each letter aloud
- **Numbers**: Tap-to-count game and flashcards with audio pronunciation
- **Calming**: Breathing guide, gentle tones, and soft color animations
- **Stories**: Read-aloud library with offline caching via "Save Offline"
- **Offline**: Service worker caches core assets for offline play

## Build for Production

```bash
npm run build
npm run preview
```

Output is in `dist/`.

## To Install as PWA

1. Open the app in Chrome/Edge on mobile or desktop
2. Look for "Install" in the address bar or menu
3. Tap "Install" — app is now installed

You can also share the link for others to install.

## Customize

- **Colors**: Edit `:root` in `src/styles.css`
- **Stories**: Add/remove stories in `src/data/stories.ts`
- **Icons**: Replace `public/icons/icon-*.svg` with your artwork

## License

MIT—feel free to use and modify freely.

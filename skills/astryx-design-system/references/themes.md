# Astryx Themes Reference

All 7 official Meta Astryx theme packages. Themes override CSS custom properties under `[data-astryx-theme="<name>"]` without wrapping or forking components.

| Theme | Package | Modes | Body Font | Heading Font | Scale (base / ratio) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Neutral** | `@astryxdesign/theme-neutral` | light, dark | Figtree | Figtree | 14px / 1.2 | Restrained warm grays. Minimal and quiet, so the content stays the focus. |
| **Butter** | `@astryxdesign/theme-butter` | light, dark | Outfit | Outfit | 14px / 1.25 | Warm, creamy yellows with a friendly blue accent. Playful enough for consumer surfaces, soft enough to stay readable. |
| **Chocolate** | `@astryxdesign/theme-chocolate` | light, dark | Albert Sans | Fraunces | 14px / 1.2 | Warm chocolate theme for Astryx — rich brown palette with Fraunces headings, Albert Sans body, and Lucide icons |
| **Gothic** | `@astryxdesign/theme-gothic` | dark | Fustat | Fustat | 16px / 1.25 | Deep blue-grays and a signature display serif. Dramatic and editorial, for surfaces that want to be remembered. |
| **Matcha** | `@astryxdesign/theme-matcha` | light, dark | DM Sans | Playwrite US Trad | 16px / 1.25 | Earthy greens with a calm, organic feel. Naturalistic and grounded, great for wellness or content-first apps. |
| **Stone** | `@astryxdesign/theme-stone` | light, dark | Figtree | Montserrat | 14px / 1.25 | Warm stone and slate, earthy and understated, with just enough character to feel handcrafted. |
| **Y2K** | `@astryxdesign/theme-y2k` | light, dark | Poppins | Poppins | 16px / 1.25 | Hot pinks, lime greens, and Poppins. Bubbly, playful, and unmistakably retro. |

## Using a Theme in React 19

```tsx
import '@astryxdesign/theme-neutral/fonts.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <Theme theme={neutralTheme} mode="system">
      {children}
    </Theme>
  );
}
```

## Serving Theme CSS Directly from the Native Rust Server

The bundled Rust service dynamically compiles any theme into CSS custom properties at:

- `GET http://127.0.0.1:7331/api/themes/neutral/tokens.css`
- `GET http://127.0.0.1:7331/api/themes/butter/tokens.css`
- `GET http://127.0.0.1:7331/api/themes/chocolate/tokens.css`
- `GET http://127.0.0.1:7331/api/themes/gothic/tokens.css`
- `GET http://127.0.0.1:7331/api/themes/matcha/tokens.css`
- `GET http://127.0.0.1:7331/api/themes/stone/tokens.css`
- `GET http://127.0.0.1:7331/api/themes/y2k/tokens.css`

# Astryx Design Tokens Reference

> Extracted from `packages/core/src/theme/tokens.stylex.ts` (211 tokens across 13 families).

Always consume tokens via `var(--token-name)` or `tokenVar("--token-name")` from `@astryxdesign/core/theme/tokens`. Never hardcode hex colors, pixel radii, or arbitrary spacing.

## color (98)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--color-accent` | `#0064E0` | `#0171E3` |
| `--color-accent-muted` | `#0082FB33` | `#0082FB3F` |
| `--color-on-accent` | `#FFFFFF` | `#FFFFFF` |
| `--color-neutral` | `rgba(5, 54, 89, 0.1)` | `rgba(223, 226, 229, 0.2)` |
| `--color-background-surface` | `#FFFFFF` | `#1F1F22` |
| `--color-background-body` | `#F1F4F7` | `#111112` |
| `--color-overlay` | `#01122866` | `#11111299` |
| `--color-overlay-hover` | `#0536590C` | `#FFFFFF0C` |
| `--color-overlay-pressed` | `#05365919` | `#FFFFFF19` |
| `--color-background-muted` | `#0536590C` | `#1111127F` |
| `--color-text-primary` | `#0A1317` | `#DFE2E5` |
| `--color-text-secondary` | `#445564` | `#B0B5BB` |
| `--color-text-disabled` | `#A4B0BC` | `#6F747C` |
| `--color-text-accent` | `#0064E0` | `#3E9EFB` |
| `--color-on-dark` | `#FFFFFF` | `#FFFFFF` |
| `--color-on-light` | `#000000` | `#000000` |
| `--color-icon-accent` | `#0064E0` | `#2694FE` |
| `--color-icon-primary` | `#0A1317` | `#DFE2E5` |
| `--color-icon-secondary` | `#4E606F` | `#AAAFB5` |
| `--color-icon-disabled` | `#A4B0BC` | `#6F747C` |
| `--color-background-card` | `#FFFFFF` | `#1F1F22` |
| `--color-background-popover` | `#FFFFFF` | `#28292C` |
| `--color-background-inverted` | `#0A1317` | `#FFFFFF` |
| `--color-background-error-inverted` | `#AA071E` | `#E3193B` |
| `--color-info` | `#0064E0` | `#0064E0` |
| `--color-info-muted` | `#0082FB33` | `#0082FB3F` |
| `--color-on-info` | `#FFFFFF` | `#FFFFFF` |
| `--color-success` | `#0D8626` | `#0D8626` |
| `--color-success-muted` | `#0B991F33` | `#0B991F3F` |
| `--color-on-success` | `#FFFFFF` | `#FFFFFF` |
| `--color-error` | `#E3193B` | `#F5394F` |
| `--color-error-muted` | `#E3193B33` | `#F5394F3F` |
| `--color-on-error` | `#FFFFFF` | `#0A1317` |
| `--color-warning` | `#E9AF08` | `#F2C00B` |
| `--color-warning-muted` | `#E2A40033` | `#E2A4003F` |
| `--color-on-warning` | `#0A1317` | `#0A1317` |
| `--color-text-info` | `var(--color-text-blue)` | `var(--color-text-blue)` |
| `--color-text-success` | `var(--color-text-green)` | `var(--color-text-green)` |
| `--color-text-warning` | `var(--color-text-yellow)` | `var(--color-text-yellow)` |
| `--color-text-error` | `var(--color-text-red)` | `var(--color-text-red)` |
| `--color-icon-info` | `var(--color-text-info)` | `var(--color-text-info)` |
| `--color-icon-success` | `var(--color-text-success)` | `var(--color-text-success)` |
| `--color-icon-warning` | `var(--color-text-warning)` | `var(--color-text-warning)` |
| `--color-icon-error` | `var(--color-text-error)` | `var(--color-text-error)` |
| `--color-border-info` | `var(--color-text-info)` | `var(--color-text-info)` |
| `--color-border-success` | `var(--color-text-success)` | `var(--color-text-success)` |
| `--color-border-warning` | `var(--color-text-warning)` | `var(--color-text-warning)` |
| `--color-border-error` | `var(--color-text-error)` | `var(--color-text-error)` |
| `--color-on-info-muted` | `var(--color-text-blue)` | `var(--color-text-blue)` |
| `--color-on-success-muted` | `var(--color-text-green)` | `var(--color-text-green)` |
| `--color-on-warning-muted` | `var(--color-text-yellow)` | `var(--color-text-yellow)` |
| `--color-on-error-muted` | `var(--color-text-red)` | `var(--color-text-red)` |
| `--color-border` | `#05365919` | `#F2F4F619` |
| `--color-border-emphasized` | `#CCD3DB` | `#494D53` |
| `--color-skeleton` | `#CCD3DB` | `#5A5E66` |
| `--color-track` | `#CCD3DB` | `#5A5E66` |
| `--color-shadow` | `rgba(5, 54, 89, 0.1)` | `rgba(0, 0, 0, 0.3)` |
| `--color-tint-hover` | `black` | `white` |
| `--color-background-blue` | `#0171E333` | `#0171E333` |
| `--color-border-blue` | `#0064E0` | `#2694FE` |
| `--color-icon-blue` | `#0064E0` | `#2694FE` |
| `--color-text-blue` | `#042F97` | `#AFD7FF` |
| `--color-background-cyan` | `#03A7D733` | `#03A7D733` |
| `--color-border-cyan` | `#089DD0` | `#0171A4` |
| `--color-icon-cyan` | `#00ACC1` | `#26C6DA` |
| `--color-text-cyan` | `#014975` | `#A1EEF9` |
| `--color-background-gray` | `#0A131733` | `#666A724C` |
| `--color-border-gray` | `#647685` | `#748695` |
| `--color-icon-gray` | `#4E606F` | `#AAAFB5` |
| `--color-text-gray` | `#0A1317` | `#E7EAED` |
| `--color-background-green` | `#24BB5E33` | `#24BB5E33` |
| `--color-border-green` | `#0D8626` | `#0B991F` |
| `--color-icon-green` | `#0D8626` | `#26A756` |
| `--color-text-green` | `#09441F` | `#A5F690` |
| `--color-background-orange` | `#F2790233` | `#F2790233` |
| `--color-border-orange` | `#EB6E00` | `#B34A01` |
| `--color-icon-orange` | `#E9690B` | `#FB8C00` |
| `--color-text-orange` | `#6B2203` | `#FDB876` |
| `--color-background-pink` | `#E638B333` | `#E638B333` |
| `--color-border-pink` | `#F351C0` | `#C02294` |
| `--color-icon-pink` | `#C2185B` | `#EC407A` |
| `--color-text-pink` | `#650053` | `#FEADE3` |
| `--color-background-purple` | `#7952FF33` | `#7952FF33` |
| `--color-border-purple` | `#9081FF` | `#7340FE` |
| `--color-icon-purple` | `#5B08D8` | `#7952FF` |
| `--color-text-purple` | `#3E0697` | `#B3B0FE` |
| `--color-background-red` | `#E3193B33` | `#E3193B33` |
| `--color-border-red` | `#E3193B` | `#F5394F` |
| `--color-icon-red` | `#D31130` | `#E3193B` |
| `--color-text-red` | `#7B0210` | `#FFB2B8` |
| `--color-background-teal` | `#0DB7AF33` | `#0DB7AF33` |
| `--color-border-teal` | `#08A3A3` | `#08767D` |
| `--color-icon-teal` | `#009688` | `#26A69A` |
| `--color-text-teal` | `#083943` | `#40DCCD` |
| `--color-background-yellow` | `#E2A40033` | `#E2A40033` |
| `--color-border-yellow` | `#C58600` | `#B47700` |
| `--color-icon-yellow` | `#FBC02D` | `#FFEE58` |
| `--color-text-yellow` | `#753F07` | `#FBCE03` |

## spacing (15)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--spacing-0` | `0rem` | `0rem` |
| `--spacing-0-5` | `0.125rem` | `0.125rem` |
| `--spacing-1` | `0.25rem` | `0.25rem` |
| `--spacing-1-5` | `0.375rem` | `0.375rem` |
| `--spacing-2` | `0.5rem` | `0.5rem` |
| `--spacing-3` | `0.75rem` | `0.75rem` |
| `--spacing-4` | `1rem` | `1rem` |
| `--spacing-5` | `1.25rem` | `1.25rem` |
| `--spacing-6` | `1.5rem` | `1.5rem` |
| `--spacing-7` | `1.75rem` | `1.75rem` |
| `--spacing-8` | `2rem` | `2rem` |
| `--spacing-9` | `2.25rem` | `2.25rem` |
| `--spacing-10` | `2.5rem` | `2.5rem` |
| `--spacing-11` | `2.75rem` | `2.75rem` |
| `--spacing-12` | `3rem` | `3rem` |

## size (3)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--size-element-sm` | `28px` | `28px` |
| `--size-element-md` | `32px` | `32px` |
| `--size-element-lg` | `36px` | `36px` |

## border (1)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--border-width` | `1px` | `1px` |

## focus (4)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--focus-outline-width` | `2px` | `2px` |
| `--focus-outline-style` | `solid` | `solid` |
| `--focus-outline-color` | `var(--color-accent)` | `var(--color-accent)` |
| `--focus-outline-offset` | `3px` | `3px` |

## radius (7)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--radius-none` | `0px` | `0px` |
| `--radius-inner` | `4px` | `4px` |
| `--radius-element` | `8px` | `8px` |
| `--radius-container` | `12px` | `12px` |
| `--radius-page` | `28px` | `28px` |
| `--radius-chat` | `var(--radius-container)` | `var(--radius-container)` |
| `--radius-full` | `9999px` | `9999px` |

## shadow (8)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--shadow-low` | `0px 1px 1px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 2px 8px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))` | `0px 1px 1px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 2px 8px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))` |
| `--shadow-med` | `0px 1px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 2px 12px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))` | `0px 1px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 2px 12px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2))` |
| `--shadow-high` | `0px 2px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 8px 24px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))` | `0px 2px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)), 0px 8px 24px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))` |
| `--shadow-inset-hover` | `inset 0px 0px 0px 2px light-dark(rgba(5, 54, 89, 0.15), rgba(223, 226, 229, 0.2))` | `inset 0px 0px 0px 2px light-dark(rgba(5, 54, 89, 0.15), rgba(223, 226, 229, 0.2))` |
| `--shadow-inset-selected` | `inset 0px 0px 0px 2px rgba(1, 113, 227, 0.5)` | `inset 0px 0px 0px 2px rgba(1, 113, 227, 0.5)` |
| `--shadow-inset-success` | `inset 0px 0px 0px 2px rgba(38, 167, 86, 0.3)` | `inset 0px 0px 0px 2px rgba(38, 167, 86, 0.3)` |
| `--shadow-inset-warning` | `inset 0px 0px 0px 2px rgba(226, 164, 0, 0.3)` | `inset 0px 0px 0px 2px rgba(226, 164, 0, 0.3)` |
| `--shadow-inset-error` | `inset 0px 0px 0px 2px rgba(227, 25, 59, 0.3)` | `inset 0px 0px 0px 2px rgba(227, 25, 59, 0.3)` |

## duration (10)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--duration-fast-min` | `130ms` | `130ms` |
| `--duration-fast` | `175ms` | `175ms` |
| `--duration-fast-max` | `230ms` | `230ms` |
| `--duration-medium-min` | `310ms` | `310ms` |
| `--duration-medium` | `410ms` | `410ms` |
| `--duration-medium-max` | `550ms` | `550ms` |
| `--duration-slow-min` | `730ms` | `730ms` |
| `--duration-slow` | `975ms` | `975ms` |
| `--duration-slow-max` | `1300ms` | `1300ms` |
| `--duration-exit` | `var(--duration-fast)` | `var(--duration-fast)` |

## ease (4)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--ease-standard` | `cubic-bezier(0.24, 1, 0.4, 1)` | `cubic-bezier(0.24, 1, 0.4, 1)` |
| `--ease-entrance` | `cubic-bezier(0.24, 1, 0.4, 1)` | `cubic-bezier(0.24, 1, 0.4, 1)` |
| `--ease-move` | `cubic-bezier(0.24, 1, 0.4, 1)` | `cubic-bezier(0.24, 1, 0.4, 1)` |
| `--ease-exit` | `cubic-bezier(0.3, 0, 0.6, 0.6)` | `cubic-bezier(0.3, 0, 0.6, 0.6)` |

## typography (3)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--font-family-body` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| `--font-family-code` | `"SF Mono", Monaco, Consolas, monospace` | `"SF Mono", Monaco, Consolas, monospace` |
| `--font-family-heading` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |

## textSize (12)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--font-size-4xs` | `0.375rem` | `0.375rem` |
| `--font-size-3xs` | `0.4375rem` | `0.4375rem` |
| `--font-size-2xs` | `0.5rem` | `0.5rem` |
| `--font-size-xs` | `0.625rem` | `0.625rem` |
| `--font-size-sm` | `0.75rem` | `0.75rem` |
| `--font-size-base` | `0.875rem` | `0.875rem` |
| `--font-size-lg` | `1.0625rem` | `1.0625rem` |
| `--font-size-xl` | `1.25rem` | `1.25rem` |
| `--font-size-2xl` | `1.5rem` | `1.5rem` |
| `--font-size-3xl` | `1.8125rem` | `1.8125rem` |
| `--font-size-4xl` | `2.1875rem` | `2.1875rem` |
| `--font-size-5xl` | `2.625rem` | `2.625rem` |

## fontWeight (4)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--font-weight-normal` | `400` | `400` |
| `--font-weight-medium` | `500` | `500` |
| `--font-weight-semibold` | `600` | `600` |
| `--font-weight-bold` | `700` | `700` |

## typeScale (42)

| Token | Light Value | Dark Value |
| :--- | :--- | :--- |
| `--text-heading-1-size` | `var(--font-size-2xl)` | `var(--font-size-2xl)` |
| `--text-heading-1-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-heading-1-leading` | `1.3333` | `1.3333` |
| `--text-heading-2-size` | `var(--font-size-xl)` | `var(--font-size-xl)` |
| `--text-heading-2-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-heading-2-leading` | `1.4` | `1.4` |
| `--text-heading-3-size` | `var(--font-size-lg)` | `var(--font-size-lg)` |
| `--text-heading-3-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-heading-3-leading` | `1.4118` | `1.4118` |
| `--text-heading-4-size` | `var(--font-size-base)` | `var(--font-size-base)` |
| `--text-heading-4-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-heading-4-leading` | `1.4286` | `1.4286` |
| `--text-heading-5-size` | `var(--font-size-sm)` | `var(--font-size-sm)` |
| `--text-heading-5-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-heading-5-leading` | `1.6667` | `1.6667` |
| `--text-heading-6-size` | `var(--font-size-xs)` | `var(--font-size-xs)` |
| `--text-heading-6-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-heading-6-leading` | `1.6` | `1.6` |
| `--text-body-size` | `var(--font-size-base)` | `var(--font-size-base)` |
| `--text-body-weight` | `var(--font-weight-normal)` | `var(--font-weight-normal)` |
| `--text-body-leading` | `1.4286` | `1.4286` |
| `--text-large-size` | `var(--font-size-lg)` | `var(--font-size-lg)` |
| `--text-large-weight` | `var(--font-weight-semibold)` | `var(--font-weight-semibold)` |
| `--text-large-leading` | `1.4118` | `1.4118` |
| `--text-label-size` | `var(--font-size-base)` | `var(--font-size-base)` |
| `--text-label-weight` | `var(--font-weight-medium)` | `var(--font-weight-medium)` |
| `--text-label-leading` | `1.4286` | `1.4286` |
| `--text-code-size` | `var(--font-size-base)` | `var(--font-size-base)` |
| `--text-code-weight` | `var(--font-weight-normal)` | `var(--font-weight-normal)` |
| `--text-code-leading` | `1.4286` | `1.4286` |
| `--text-supporting-size` | `var(--font-size-sm)` | `var(--font-size-sm)` |
| `--text-supporting-weight` | `var(--font-weight-normal)` | `var(--font-weight-normal)` |
| `--text-supporting-leading` | `1.6667` | `1.6667` |
| `--text-display-1-size` | `var(--font-size-5xl)` | `var(--font-size-5xl)` |
| `--text-display-1-weight` | `var(--font-weight-normal)` | `var(--font-weight-normal)` |
| `--text-display-1-leading` | `1.2381` | `1.2381` |
| `--text-display-2-size` | `var(--font-size-4xl)` | `var(--font-size-4xl)` |
| `--text-display-2-weight` | `var(--font-weight-normal)` | `var(--font-weight-normal)` |
| `--text-display-2-leading` | `1.2571` | `1.2571` |
| `--text-display-3-size` | `var(--font-size-3xl)` | `var(--font-size-3xl)` |
| `--text-display-3-weight` | `var(--font-weight-normal)` | `var(--font-weight-normal)` |
| `--text-display-3-leading` | `1.2414` | `1.2414` |

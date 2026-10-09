import nextConfig from "eslint-config-next";
import nextTypescript from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";

const SLATE_OR_GRADIENT = "/(^|[\\s:])((bg|text|border)-slate-|bg-linear-to-)/";

const designSystemColours = [
  {
    selector: `Literal[value=${SLATE_OR_GRADIENT}], TemplateElement[value.raw=${SLATE_OR_GRADIENT}]`,
    message: "No hand-picked slate colours or gradients: use the design-system components or tokens (.claude/rules/design-system.md).",
  },
];

// Pictographs used as icons (workspace ROADMAP M76): icons are lucide components, never emoji in the markup or in
// the data a page prints. Text symbols (⌘, ✓, →, ·) are not pictographs and stay allowed.
const EMOJI = "/[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{23E9}-\\u{23FF}\\u{2139}]/u";

const designSystemEmoji = [
  {
    selector: `Literal[value=${EMOJI}], TemplateElement[value.raw=${EMOJI}], JSXText[value=${EMOJI}]`,
    message: "No emoji as icons: use a lucide icon (DeviceIcon for a device) (.claude/rules/design-system.md).",
  },
];

const designSystemTitle = [
  {
    selector: "JSXOpeningElement[name.name='h1']",
    message: "Use PageHeader (app/components/EmberGlass/PageHeader.tsx) for the page title.",
  },
  {
    selector: "JSXOpeningElement[name.name='Heading'] > JSXAttribute[name.name='level'][value.expression.value=1]",
    message: "Use PageHeader (app/components/EmberGlass/PageHeader.tsx) for the page title; section titles start at level 2.",
  },
];

const designSystemNativeControls = [
  {
    selector: "JSXOpeningElement[name.name='select']",
    message: "Use Select or InlineSelect (app/components/ui) instead of a native <select>.",
  },
  {
    selector: "JSXOpeningElement[name.name='table']",
    message: "Use DataTable (app/components/ui/DataTable.tsx) instead of a native <table>.",
  },
  {
    selector: "JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type'][value.value='range']",
    message: "Use RangeSlider or Slider (app/components/ui) instead of a native range input.",
  },
];

const eslintConfig = [
  // Generated output, reports and agent worktrees are not source
  {
    name: "project/ignores",
    ignores: [".claude/**", ".planning/**", "coverage/**", "playwright-report/**", "test-results/**", "public/sw.js", "public/workbox-*.js", "public/fallback-*.js", "public/swe-worker*.js"],
  },

  // Next.js base config (native flat config format in Next.js 16+)
  ...nextConfig,

  // TypeScript rules from Next.js
  ...nextTypescript,

  // Camera snapshots/posters are signed, short-lived URLs: next/image would route them through
  // Vercel Image Optimization (billed, useless cache), so plain <img> is intended here
  {
    name: "project/camera-img",
    files: ["app/(pages)/camera/**", "app/components/devices/camera/**"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },

  // Design system (workspace ROADMAP M72, M73, M75; ../.claude/rules/design-system.md).
  // `no-restricted-syntax` is one rule: a later block replaces the selectors of an earlier one for the files it
  // matches, so every block below spreads the selectors it keeps.
  //  - colours: no hand-picked slate colours or gradients in class names, in every file of app/ (.ts maps too)
  //  - emoji: no pictographs as icons, in every file of app/
  //  - title: the page title is always the shared PageHeader, never a hand-made <h1>
  //  - native controls: <select>, <table> and <input type="range"> live only inside the design system
  {
    name: "project/design-system-colours",
    files: ["app/**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...designSystemColours, ...designSystemEmoji],
    },
  },
  {
    name: "project/design-system",
    files: ["app/**/*.tsx"],
    // Home (dashboard grid), root loading and login (no app chrome) keep a plain <h1>
    ignores: [
      "app/components/EmberGlass/PageHeader.tsx",
      "app/page.tsx",
      "app/loading.tsx",
      "app/auth/login/page.tsx",
      "app/layout.tsx",
      "app/components/ui/**",
      "app/components/EmberGlass/**/primitives/**",
      "**/__tests__/**",
      "**/*.test.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...designSystemColours, ...designSystemEmoji, ...designSystemTitle, ...designSystemNativeControls],
    },
  },
  // The design system itself writes the native controls, but still never an <h1>
  {
    name: "project/design-system-primitives",
    files: ["app/components/ui/**/*.tsx", "app/components/EmberGlass/**/primitives/**/*.tsx"],
    ignores: ["**/__tests__/**", "**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": ["error", ...designSystemColours, ...designSystemEmoji, ...designSystemTitle],
    },
  },

  // Unused vars: a leading underscore marks a deliberately unused binding
  {
    name: "project/unused-vars",
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],
    },
  },

  // Tailwind CSS v4 class checks (eslint-plugin-tailwindcss 4.x reads the CSS config)
  {
    name: "tailwindcss/design-tokens",
    plugins: {
      tailwindcss,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: "./app/globals.css",
      },
    },
    rules: {
      // Arbitrary values are allowed for one-off values with no token (vh, calc(env()), coloured shadows):
      // plugin v4 has no per-property exceptions. Values that do have a token or a scale class are caught
      // by no-unnecessary-arbitrary-value / enforces-canonical-classname below.
      "tailwindcss/no-arbitrary-value": "off",

      // Enforce consistent class ordering (Tailwind compiler order)
      "tailwindcss/classnames-order": "warn",

      // Enforce negative values use negative prefix (-mt-4 not mt-[-4px])
      "tailwindcss/enforces-negative-arbitrary-values": "warn",

      // Warn on shorthand conflicts (p-4 and px-2 together)
      "tailwindcss/enforces-shorthand": "warn",

      // Prefer the canonical v4 spelling (h-75 not h-[300px], z-60 not z-[60])
      "tailwindcss/enforces-canonical-classname": "warn",
      "tailwindcss/no-unnecessary-arbitrary-value": "warn",

      // Ensure custom classes don't conflict with Tailwind
      "tailwindcss/no-custom-classname": "off", // Allow custom classes from globals.css
    },
  },
];

export default eslintConfig;

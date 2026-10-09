import nextConfig from "eslint-config-next";
import nextTypescript from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";

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

  // Design system (workspace ROADMAP M72, ../.claude/rules/design-system.md): the page title is always the shared
  // PageHeader, never a hand-made <h1>. Home (dashboard grid) and login (no app chrome) keep a plain <h1>.
  {
    name: "project/design-system",
    files: ["app/**/*.tsx"],
    ignores: [
      "app/components/EmberGlass/PageHeader.tsx",
      "app/page.tsx",
      "app/loading.tsx",
      "app/auth/login/page.tsx",
      "**/__tests__/**",
      "**/*.test.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error",
        {
          selector: "JSXOpeningElement[name.name='h1']",
          message: "Use PageHeader (app/components/EmberGlass/PageHeader.tsx) for the page title.",
        },
        {
          selector: "JSXOpeningElement[name.name='Heading'] > JSXAttribute[name.name='level'][value.expression.value=1]",
          message: "Use PageHeader (app/components/EmberGlass/PageHeader.tsx) for the page title; section titles start at level 2.",
        },
      ],
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

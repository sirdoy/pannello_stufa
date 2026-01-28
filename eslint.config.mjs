import nextConfig from "eslint-config-next";
import tailwindcss from "eslint-plugin-tailwindcss";

const eslintConfig = [
  // Next.js config (native flat config format in Next.js 16+)
  ...nextConfig,

  // Tailwind CSS design token enforcement
  {
    name: "tailwindcss/design-tokens",
    plugins: {
      tailwindcss,
    },
    settings: {
      tailwindcss: {
        // Tailwind v4 uses CSS @theme directive, not tailwind.config.js
        // Empty config tells plugin to use built-in defaults
        config: {},
      },
    },
    rules: {
      // Block arbitrary color values - enforce design tokens
      // Start with "warn" to establish baseline, promote to "error" after cleanup
      "tailwindcss/no-arbitrary-value": ["warn", {
        // Allow arbitrary values for properties that legitimately need flexibility
        ignoredProperties: [
          "content",           // CSS content property
          "grid-template-columns", // Grid layouts
          "grid-template-rows",    // Grid layouts
          "animation",         // Custom animations
          "box-shadow",        // Complex shadows (until all shadows use tokens)
        ],
      }],

      // Enforce consistent class ordering for readability
      "tailwindcss/classnames-order": "warn",

      // Enforce negative values use negative prefix (-mt-4 not mt-[-4px])
      "tailwindcss/enforces-negative-arbitrary-values": "warn",

      // Warn on shorthand conflicts (p-4 and px-2 together)
      "tailwindcss/enforces-shorthand": "warn",

      // Warn on redundant migration patterns
      "tailwindcss/migration-from-tailwind-2": "warn",

      // Ensure custom classes don't conflict with Tailwind
      "tailwindcss/no-custom-classname": "off", // Allow custom classes from globals.css
    },
  },
];

export default eslintConfig;

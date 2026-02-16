import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Disable SSR to avoid hydration mismatch during E2E and make network requests client-observable
  ssr: false,
} satisfies Config;

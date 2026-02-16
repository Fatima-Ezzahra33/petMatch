import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [tailwindcss(), reactRouter({ ssr: false }), tsconfigPaths()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL ,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
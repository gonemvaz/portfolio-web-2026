// @ts-check
import { defineConfig } from 'astro/config';

// CSS y JS siempre como archivos aparte, nunca en línea: la CSP de nginx.conf
// solo permite estilos y scripts del propio sitio ('self').
export default defineConfig({
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});

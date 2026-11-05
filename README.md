# Portfolio — Gonzalo Vazquez

Sitio estático hecho con [Astro](https://astro.build).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
npm run preview  # sirve dist/
```

## Dónde está cada cosa

- `src/data/` — contenido del CV (perfil, secciones, experiencia, habilidades, proyectos).
- `src/components/` — barra lateral, botones y una sección por archivo en `sections/`.
- `src/styles/` — `tokens.css` tiene los colores (claro y oscuro), tipografías y tiempos; el resto se importa desde `global.css`.
- `src/scripts/` — `navigation.ts` (diapositivas, rueda, teclado, hash), `theme.ts`, `menu.ts` (menú lateral del teléfono), `copy-email.ts` y `fit.ts` (ajuste del nombre y de la franja de Habilidades).
- `src/assets/` — fotos originales; Astro las convierte a AVIF al compilar.

El corte de 860px está en los `@media` del CSS y en `src/scripts/media.ts`: si se cambia, hay que cambiarlo en ambos.

# Mesa

PWA para armar equipos al azar y llevar los puntos de tus juegos de mesa ronda por ronda. Funciona sin conexión y guarda los datos en el dispositivo.

## Funcionalidades

- **Equipos**: cargá jugadores, elegí cuántos equipos armar y repartilos con una ruleta animada.
- **Quién empieza**: sorteo animado entre todos los jugadores.
- **Anotador**: partida por rondas, puntaje máximo opcional, historial por ronda y pantalla de ganador con confeti.
- **Persistencia**: el estado del anotador se guarda en `localStorage` y se retoma al volver.
- **PWA**: instalable, con service worker y funcionamiento offline (incluida la tipografía).

## Stack

- [React 19](https://react.dev/) + TypeScript
- [Vite 8](https://vite.dev/)
- [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox)
- [`@fontsource-variable/outfit`](https://fontsource.org/fonts/outfit)
- [Playwright](https://playwright.dev/) para el test E2E de la UI

## Requisitos

- Node.js `>= 22.12`
- Google Chrome instalado para correr el test E2E (o definir `CHROME_PATH`)

## Scripts

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo
npm run build     # typecheck + build de producción
npm run preview   # servir el build
npm test          # build + test E2E de la UI
npm run icons     # regenerar los íconos PWA en public/icons
```

## Estructura

```
public/          íconos PWA y favicon
scripts/         generador de íconos
src/
  components/    pantallas y componentes de UI
  lib/           lógica de sorteo y persistencia
  styles/        estilos por pantalla
  App.tsx        ruteo por hash (#/equipos, #/anotador)
  types.ts       tipos compartidos
test-ui.mjs      test E2E con Playwright
```

## Rutas

- `/` — inicio
- `#/equipos` — sorteo de equipos
- `#/anotador` — anotador de puntajes

## Test E2E

`npm test` compila el proyecto, levanta `vite preview` y recorre el flujo completo: sorteo de equipos, ruleta, sorteo del jugador inicial, partida con ganador y persistencia tras recargar. También prueba la vista móvil.

- Las capturas se guardan en el directorio temporal del sistema (o en `SHOTS_DIR`).
- Se puede apuntar a un servidor ya levantado con `BASE_URL`, por ejemplo:

```bash
BASE_URL=http://localhost:4173 npm test
```

## Deploy

El resultado del build queda en `dist/`. Al ser una SPA con ruteo por hash y `navigateFallback`, se puede publicar en cualquier hosting estático (Netlify, Vercel, GitHub Pages, etc.). Recordá que la PWA requiere HTTPS para instalarse.

# Stick Story: Prison Break Nutricional — Fase 1 (+ Panel Admin)

Prototipo local + competencia en vivo con Supabase. Sin frameworks de UI.

## Estructura

```text
public/
  index.html                 Juego cliente (celular) · <script type="module">
  admin.html                 Panel admin (proyector) · leaderboard realtime
  css/styles.css             Post-Its, cintas, polaroids, shake/faint/bounce
  js/config/roundsData.js    8 rondas con trampa + TIMEOUT (export)
  js/core/gameState.js       Clase GameState (vidas, reloj 8 s, peso, errores, grupo)
  js/core/supabaseClient.js  Cliente Supabase (URL + anon key configurables)
  js/components/canvas2d.js  StickmanAnimator (Canvas 2D, requestAnimationFrame)
  js/components/ui.js        HUD, polaroids, picker de grupo, podio (DOM)
  js/main.js                 Orquestador cliente: timer, flujo, sync a Supabase
  js/admin.js                Orquestador admin: slots, leaderboard, controles
database_schema.sql          Tablas sessions + players (+ RLS demo + realtime)
backup/                      Monolítico antiguo (fuera del servidor)
vite.config.js               Raíz web = public/ · dev :3000 · build a dist/
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000/index.html (juego)
                 # http://localhost:3000/admin.html  (proyector)
npm run build    # salida lista en dist/
```

> Los ES Modules exigen servidor (el `file://` bloquea imports).

## Competencia en vivo (Supabase)

1. Crea proyecto en https://supabase.com → copia **URL** + **anon key**.
2. Copia `.env.example` como `.env.local` y pega tus credenciales
   (este archivo está en `.gitignore`: nunca se sube al repo).
3. Ejecuta `database_schema.sql` en el SQL Editor (crea tablas + RLS + realtime).
4. Proyecta `/admin.html`, pulsa **🚀 Iniciar Dinámica**.
5. Cada celular abre el juego, elige su grupo (1–4) y juega: cada decisión
   publica vidas/errores/peso/ronda y el proyector se actualiza al instante.
6. **▶️ Siguiente Ronda** avanza la ronda global · **🔄 Reiniciar** limpia todo.

Sin configurar Supabase, el juego funciona 100 % en local.

## Mecánicas

- 8 rondas con trampa · 8 s por decisión · timeout = parálisis (-1 vida).
- Opción mala = -1 vida ❤️→🖤 · sana = vidas intactas.
- Sin vidas = `GAME OVER 💀 - HOSPITALIZADO POR GASTRITIS/DESNUTRICIÓN`.
- Medallas: 🥇 oro (3 vidas + 0 errores) · 🥈 plata (2 vidas) · 🥉 bronce (1 vida).
- Cero spoilers en polaroids: solo título engañoso + ícono.

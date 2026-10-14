# Stick Story: Prison Break Nutricional — Fase 1 (+ Panel Admin)

> Los pitufos del señor · Grupo 2 · Dev: Yorlxx (Jhoel)
>
> Integrantes: Gabriel · Luis Figo · Luis · Saymer · Marck · Dafne · Yuberson · Jhoel
>
> Salud y Cultura Fisica II · UPeU, Ciclo II, 2026 · Docente: Gladys Glady
>
> *"Mas vale Saber que no saber"*

Prototipo local + competencia en vivo con Supabase. Sin frameworks de UI.

## Estructura

```text
public/
  index.html                 Juego cliente (celular) · <script type="module">
  admin.html                 Panel admin (proyector) · leaderboard realtime
  css/styles.css             Post-Its, cintas, polaroids, shake/faint/bounce
  js/config/roundsData.js    8 rondas con trampa + TIMEOUT (export)
  js/core/gameState.js       Clase GameState (puntos, reloj 15 s, peso, errores, grupo)
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
4. Proyecta `/admin.html`, pulsa **CREAR NUEVA SALA** (PIN de 6 dígitos + QR).
5. Cada celular escanea el QR o entra con el PIN + su nombre (equipo o alumno):
   espera en lobby hasta **INICIAR PARTIDA**; cada decisión publica
   puntos/errores/peso/ronda y el proyector se actualiza al instante.
6. Cada celular avanza a su ritmo con CONTINUAR (es competencia) ·
   **PAUSAR** congela relojes y botones · **FINALIZAR** despliega
   el podio · **REINICIAR** limpia todo.
7. Vista auto: ≤6 carriles con Stickman animado · 7+ lista densa Quizizz
   (o fórzalo con el toggle de modos).

Sin configurar Supabase, el juego funciona 100 % en local.

## Mecánicas

- 17 rondas con trampa en 3 niveles: FÁCIL ×1.0 (1-6), MEDIA ×1.5 (7-12), DURA ×2.0 (13-17) · máximo 25.000 pts.
- 15 s por decisión (los grupos debaten) · timeout = 0 pts (+2 errores).
- Acierto = (500 base + hasta 500 por velocidad) × nivel · fallo = 0 pts.
- Sin eliminación: todos completan las 17 rondas · sin Reintentar en sala.
- Medallas por puntos: oro ≥21000 · plata ≥13000 · bronce ≥6000.
- Cero spoilers en polaroids: solo título engañoso + ícono.

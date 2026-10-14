/* =====================================================================
 * MAIN · Controlador principal: registro a sala + lobby + pausa realtime.
 * Flujo online: PIN/nombre → espera al anfitrión → rondas → podio.
 * Flujo local (sin PIN o sin Supabase): práctica directa sin esperas.
 * Cada decisión se sincroniza a Supabase para el panel en tiempo real.
 * ===================================================================== */

import { ROUNDS, TIMEOUT } from "./config/roundsData.js";
import { state, ROUND_SECONDS } from "./core/gameState.js";
import { supabase, isSupabaseConfigured } from "./core/supabaseClient.js";
import { hydrateIcons } from "./components/icons.js";
import { StickmanAnimator } from "./components/canvas2d.js";
import * as ui from "./components/ui.js";

// ---------- Sonido sintetizado (WebAudio, sin archivos) ----------
let AC = null;
function beep(freq, dur, type, vol) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || "square"; o.frequency.value = freq || 440;
    g.gain.value = vol || 0.05;
    o.connect(g); g.connect(AC.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (dur || 0.12));
    o.stop(AC.currentTime + (dur || 0.12));
  } catch (e) { /* sin audio no pasa nada */ }
}
const sfxPop = () => { beep(700, 0.1); setTimeout(() => beep(1000, 0.12), 90); };
const sfxFail = () => { beep(220, 0.18, "sawtooth"); setTimeout(() => beep(140, 0.3, "sawtooth"), 150); };
const sfxBoing = () => { beep(180, 0.12, "sine", 0.08); setTimeout(() => beep(320, 0.14, "sine", 0.08), 110); };
const sfxHeart = () => beep(160, 0.25, "sawtooth", 0.07);

// ---------- Motor + temporizador (congelabe por pausa) ----------
const animator = new StickmanAnimator(document.getElementById("gameCanvas"), { boing: sfxBoing });

let timerInt = null, timeLeft = ROUND_SECONDS, busy = false;
let matchStart = Date.now(); // desempate por tiempo del leaderboard
let pausedFlag = false; // pausa impuesta por el docente
// Con Supabase + sala: el celular espera en lobby hasta que el admin inicie.
const sessionMode = isSupabaseConfigured() && !!supabase;
let waiting = false;
let myMatchNo = 0; // época de la partida actual: la impone el admin con cada Iniciar
let session = null; // fila sessions de MI sala (null = práctica local)
let myPin = ""; // PIN visible para verificar que estás en la sala correcta

const awaitingContinue = () => document.getElementById("btnContinue").classList.contains("show");

function currentRound() {
  return ROUNDS[Math.min(state.roundIndex, ROUNDS.length - 1)];
}
function stopTimer() { if (timerInt) clearInterval(timerInt); timerInt = null; }
function armTimer(fromTop) {
  stopTimer();
  if (fromTop) timeLeft = ROUND_SECONDS;
  ui.paintTimer(timeLeft, ROUND_SECONDS);
  timerInt = setInterval(() => {
    timeLeft -= 0.1; ui.paintTimer(timeLeft, ROUND_SECONDS);
    if (timeLeft <= 0) { stopTimer(); choose({ ...TIMEOUT, auto: true }); }
  }, 100);
}
const startTimer = () => armTimer(true);
const resumeTimer = () => armTimer(false); // continúa donde se congeló

/** ⏸️ Congela reloj + botones y muestra el modal docente. */
function pauseGame() {
  if (pausedFlag) return;
  pausedFlag = true;
  stopTimer();
  ui.setAnswersEnabled(false);
  ui.showPause();
}
/** ▶️ Reanuda: el reloj continúa (salvo que espere tap en CONTINUAR). */
function resumeGame() {
  if (!pausedFlag) return;
  pausedFlag = false;
  ui.hidePause();
  ui.setAnswersEnabled(true);
  if (!busy && !waiting && !awaitingContinue() && state.roundIndex < ROUNDS.length) {
    resumeTimer();
  }
}

// ---------- Sincronización con el panel admin (fire-and-forget) ----------
function syncPlayer() {
  if (!sessionMode || !supabase || !state.sessionId || !state.playerName) return;
  const payload = {
    ...state.toPayload(ROUNDS.length),
    total_time_s: Math.floor((Date.now() - matchStart) / 1000),
  };
  supabase.from("players").upsert(payload, { onConflict: "session_id,player_name" }).then(({ error }) => {
    if (error) console.warn("[supabase] sync players:", error.message);
  });
}

// ---------- Flujo de juego ----------
async function choose(opt) {
  if (busy || waiting || pausedFlag) return;
  busy = true; stopTimer();
  const round = currentRound();
  const impact = state.applyChoice(opt, timeLeft, round.mult || 1); // puntos: velocidad × nivel
  ui.renderHUD(state, round, ROUNDS.length);
  syncPlayer(); // ← el admin se entera en tiempo real
  if (opt.fail) { ui.shakeApp(); sfxHeart(); } // fallo: 0 puntos
  else ui.showGain(impact.gained); // "+850" flotante al acertar
  ui.lockOptions(); // las tarjetas se ocultan
  ui.setCutMode(true);
  ui.setNarrative((opt.auto ? "⏱️ ¡Tiempo agotado! " : "🎬 ") + opt.bio);
  beep(500, 0.1);
  await animator.play(opt.scene, { fail: opt.fail, stamp: opt.stamp }, round.room, round.day);
  if (sessionMode && session && document.getElementById("endScreen").classList.contains("show")) return; // el admin cerró en mitad de la cinemática
  if (opt.fail) sfxFail(); else sfxPop();
  ui.showContinue(); // cada celular avanza a su ritmo: es competencia
}

function next() {
  if (pausedFlag) return; // el docente manda: sin avance en pausa
  state.roundIndex++;
  ui.setCutMode(false);
  ui.hideContinue();
  if (state.roundIndex >= ROUNDS.length) { enterResultsLobby(); return; } // terminó todo: lobby de resultados
  busy = false;
  const round = currentRound();
  animator.startIdle(round.room, round.day);
  ui.renderHUD(state, round, ROUNDS.length);
  ui.renderRound(round, onPick);
  syncPlayer(); // publica la ronda actual al instante
  startTimer();
}

function finish() {
  stopTimer(); busy = false;
  ui.hideDone();
  state.result = "FINISHED"; // sin eliminación: todos llegan al podio
  ui.renderHUD(state, currentRound(), ROUNDS.length);
  syncPlayer(); // resultado final también se publica
  const medal = ui.showEndScreen(state, ROUNDS.length);
  if (medal === "gold") sfxPop(); else sfxFail();
  revealRank(); // puesto en vivo (no bloquea; si falla, no rompe nada)
}

/** Mi puesto con el MISMO criterio del admin; lo antepone en el podio. */
async function revealRank() {
  if (!sessionMode || !supabase || !state.sessionId || !state.playerName) return;
  try {
    const { data, error } = await supabase.from("players").select("*").eq("session_id", state.sessionId);
    if (error || !data) return;
    const list = [...data].sort((a, z) =>
      ((z.points ?? 0) - (a.points ?? 0)) || (a.errors - z.errors) ||
      (z.current_round - a.current_round) || ((a.total_time_s ?? 1e9) - (z.total_time_s ?? 1e9)) || String(a.player_name).localeCompare(String(z.player_name)));
    const pos = list.findIndex((p) => p.player_name === state.playerName);
    if (pos < 0) return;
    const el = document.getElementById("endDesc");
    if (el && !el.dataset.ranked) {
      el.dataset.ranked = "1";
      el.textContent = `Puesto #${pos + 1} de ${list.length} · ` + el.textContent;
    }
  } catch (e) { /* sin rank no se rompe nada */ }
}

/** Terminó sus 8 rondas con vidas: lobby de resultados, sin reset. */
function enterResultsLobby() {
  stopTimer();
  busy = true;
  state.result = "FINISHED";
  ui.renderHUD(state, currentRound(), ROUNDS.length);
  syncPlayer(); // publica FINISHED para el podio del admin
  ui.hideContinue(); ui.setCutMode(false);
  ui.showDone(state.points, state.errors);
}

function reset() {
  state.reset();
  matchStart = Date.now();
  ui.setRetryVisible(!state.sessionId); // en sala no hay reintentos (competencia supervisada)
  delete document.getElementById("endDesc").dataset.ranked; // el próximo podio recalcula puesto
  ui.hideEnd(); ui.hideDone();
  ui.setCutMode(false);
  ui.hideContinue();
  busy = false;
  const round = currentRound();
  animator.startIdle(round.room, round.day);
  ui.renderHUD(state, round, ROUNDS.length);
  ui.renderRound(round, onPick);
  syncPlayer();
  if (!pausedFlag) startTimer();
}

/** Salto forzado de ronda (corta cinemática, timer y espera actuales). */
function jumpToRound(i) {
  stopTimer();
  state.roundIndex = i;
  ui.hideWaiting();
  ui.hideEnd(); ui.hideDone(); ui.setCutMode(false); ui.hideContinue();
  busy = false;
  const round = currentRound();
  animator.startIdle(round.room, round.day);
  ui.renderHUD(state, round, ROUNDS.length);
  ui.renderRound(round, onPick);
  syncPlayer();
  if (!pausedFlag) startTimer();
}

// ---------- Sala: registro, lobby, control remoto del admin ----------
let sessCh = null; // canal realtime de MI sala (se recrea al unirse)
let pollInt = null; // respaldo por sondeo: el lobby arranca aunque falle realtime
function subscribeSession() {
  if (!sessionMode || !supabase || !session) return;
  if (sessCh) supabase.removeChannel(sessCh);
  sessCh = supabase.channel("sessions_realtime")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
      (payload) => { if (payload.new) { ui.setNet(true); safeApply(applySessionUpdate, payload.new); } })
    .subscribe((status) => ui.setNet(status === "SUBSCRIBED"));
  // Respaldo: sondea la sesión cada 4 s. applySessionUpdate es idempotente,
  // así que el doble aviso (realtime + sondeo) no duplica arranques ni saltos.
  if (!pollInt) pollInt = setInterval(pollSession, 4000);
}
/** Plan B ante realtime caído: lee la sesión y aplica exactamente lo mismo. */
async function pollSession() {
  if (!sessionMode || !supabase || !session) return;
  try {
    const { data, error } = await supabase.from("sessions").select("*").eq("id", session.id).single();
    if (!error && data) { ui.setNet(true); safeApply(applySessionUpdate, data); }
  } catch (e) { ui.setNet(false); }
}

/** Ejecuta una orden del admin mostrando el error EN PANTALLA si falla.
    Sin esto, cualquier excepción congela el celular en silencio. */
function safeApply(fn, data) {
  try { fn(data); }
  catch (e) {
    console.error("[devstick] orden admin:", e);
    try { ui.setNarrative("⚠️ No pude aplicar la orden del admin (" + (e && e.message) + "). Cierra y reabre la página."); } catch (_) {}
  }
}
function applySessionUpdate(s) {
  if (!sessionMode || !session || s.id !== session.id) return;
  session = s;
  if (s.paused) { pauseGame(); return; } // congela todo hasta reanudar
  if (s.status === "RUNNING") {
    if (pausedFlag) resumeGame(); // venía de pausa → sigue (o arranca si esperaba)
    // Nueva partida = match_no distinto (o primera vez en espera).
    // Quien ya terminó se queda en su lobby de resultados: SIN reseteos.
    if (waiting || (s.match_no ?? 1) !== myMatchNo) startFromSession(s); // 🚀 Iniciar
  } else if (s.status === "LOBBY") {
    enterWaiting("⌛ Esperando a que el profesor inicie la partida...");
  } else if (s.status === "FINISHED") {
    // Podio final para todos (el que ya lo veía lo conserva).
    if (!document.getElementById("endScreen").classList.contains("show")) finish();
  }
}

/** Congela todo y muestra la sala de espera (sin timer, sin decisiones). */
function enterWaiting(msg) {
  stopTimer();
  busy = true; waiting = true;
  pausedFlag = false; ui.hidePause(); ui.setAnswersEnabled(true);
  ui.hideEnd(); ui.hideDone(); ui.setCutMode(false); ui.hideContinue();
  ui.showWaiting(myPin ? msg + ` (Sala ${myPin})` : msg);
}

/** Arranque ordenado por el admin (o ubicación si entró tarde). */
function startFromSession(s) {
  reset(); // vidas, ronda, timer y sincronización frescos
  myMatchNo = s.match_no ?? 1;
  ui.hideWaiting();
  waiting = false;
  const target = Math.max(0, Math.min(s.current_round - 1, ROUNDS.length - 1));
  if (target > 0) jumpToRound(target); // entró tarde: lo ubican en la ronda actual
  if (s.paused) pauseGame();
}

/** Estado inicial de la sesión (por si el celular entra a mitad). */
async function bootstrapSession() {
  if (!sessionMode || !session) return;
  try {
    const { data: s } = await supabase.from("sessions").select("*").eq("id", session.id).single();
    if (s) safeApply(applySessionUpdate, { ...s, paused: !!s.paused });
  } catch (e) { /* sin sesión: sigue esperando */ }
}

/**
 * Une el celular a una sala (o a práctica local si no hay PIN).
 * Valida que la sala exista antes de entrar al lobby.
 */
async function joinRoom(pin, name) {
  ui.joinError("");
  if (!sessionMode || !pin) { // práctica local directa, sin esperas
    state.setIdentity(null, name || "Local");
    myPin = "";
    ui.hideJoinForm();
    reset();
    return;
  }
  try {
    const { data: s, error } = await supabase.from("sessions").select("*").eq("room_code", pin).single();
    if (error || !s) { ui.joinError("❌ Sala no existe. Revisa el PIN."); return; }
    if (s.status === "FINISHED") { ui.joinError("🏁 Esa partida ya terminó. Pide un PIN nuevo."); return; }
    session = s;
    myPin = pin;
    myMatchNo = s.match_no ?? 1;
    state.setIdentity(s.id, name);
    try {
      localStorage.setItem("stick-room", pin);
      localStorage.setItem("stick-name", name);
    } catch (e) { /* modo privado */ }
    ui.hideJoinForm();
    matchStart = Date.now();
    syncPlayer(); // aparece al instante en el proyector
    subscribeSession();
    if (s.status === "RUNNING") startFromSession(s);
    else enterWaiting("⌛ Esperando a que el profesor inicie la partida...");
    if (s.paused) pauseGame();
  } catch (e) {
    ui.joinError("❌ Sin conexión. Intenta de nuevo.");
  }
}

/** Las pupilas del Stickman miran la foto que tocas. */
function onPick(opt, ev) {
  const rc = document.getElementById("gameCanvas").getBoundingClientRect();
  animator.lookX = Math.max(-1, Math.min(1, ((ev.clientX - rc.left) / rc.width - 0.5) * 2));
  choose(opt);
}

// ---------- Init: registro → (lobby) → juego ----------
const qp = new URLSearchParams(location.search);
let savedPin = "", savedName = "";
try {
  savedPin = localStorage.getItem("stick-room") || "";
  savedName = localStorage.getItem("stick-name") || "";
} catch (e) { /* modo privado */ }

document.getElementById("btnContinue").addEventListener("click", next);
document.getElementById("btnRetry").addEventListener("click", reset);
document.getElementById("btnReplay").addEventListener("click", reset); // reintentar desde el lobby de resultados

hydrateIcons(document); // convierte <i data-ic> en SVG vectoriales

ui.showJoinForm(
  { pin: qp.get("room") || savedPin, name: savedName, local: !sessionMode },
  joinRoom,
);

animator.startIdle(currentRound().room, currentRound().day);
ui.renderHUD(state, currentRound(), ROUNDS.length);
ui.renderRound(currentRound(), onPick);
// Sin sala: el timer NO arranca hasta unirse (joinRoom → reset/startFromSession).

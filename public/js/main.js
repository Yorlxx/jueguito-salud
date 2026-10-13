/* =====================================================================
 * MAIN · Controlador principal: orquesta estado + canvas + UI + reloj.
 * Flujo: grupo → polaroid → cutscene 3 s + sello → CONTINUAR → podio.
 * Cada decisión se sincroniza a Supabase (si está configurado) para que
 * el panel admin (/admin.html) la vea en tiempo real. Sin configurar,
 * el juego sigue funcionando 100 % en local.
 * ===================================================================== */

import { ROUNDS, TIMEOUT } from "./config/roundsData.js";
import { state, ROUND_SECONDS } from "./core/gameState.js";
import { supabase, isSupabaseConfigured } from "./core/supabaseClient.js";
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

// ---------- Motor + temporizador ----------
const animator = new StickmanAnimator(document.getElementById("gameCanvas"), { boing: sfxBoing });

let timerInt = null, timeLeft = ROUND_SECONDS, busy = false;
let matchStart = Date.now(); // para el desempate por tiempo del leaderboard

function currentRound() {
  return ROUNDS[Math.min(state.roundIndex, ROUNDS.length - 1)];
}
function stopTimer() { if (timerInt) clearInterval(timerInt); timerInt = null; }
function startTimer() {
  stopTimer(); timeLeft = ROUND_SECONDS; ui.paintTimer(timeLeft, ROUND_SECONDS);
  timerInt = setInterval(() => {
    timeLeft -= 0.1; ui.paintTimer(timeLeft, ROUND_SECONDS);
    if (timeLeft <= 0) { stopTimer(); choose({ ...TIMEOUT, auto: true }); }
  }, 100);
}

// ---------- Sincronización con el panel admin (fire-and-forget) ----------
function syncPlayer() {
  if (!isSupabaseConfigured() || !supabase || !state.groupName) return;
  const payload = {
    ...state.toPayload(),
    total_time_s: Math.floor((Date.now() - matchStart) / 1000),
  };
  supabase.from("players").upsert(payload, { onConflict: "group_name" }).then(({ error }) => {
    if (error) console.warn("[supabase] sync players:", error.message);
  });
}

// ---------- Flujo de juego ----------
async function choose(opt) {
  if (busy) return;
  busy = true; stopTimer();
  const impact = state.applyChoice(opt);
  const round = currentRound();
  ui.renderHUD(state, round, ROUNDS.length);
  syncPlayer(); // ← el admin se entera en tiempo real
  if (impact.lost > 0) { ui.shakeApp(); sfxHeart(); } // corazón roto
  ui.lockOptions(); // las tarjetas se ocultan
  ui.setCutMode(true);
  ui.setNarrative((opt.auto ? "⏱️ ¡Tiempo agotado! " : "🎬 ") + opt.bio);
  beep(500, 0.1);
  await animator.play(opt.scene, { fail: opt.fail, stamp: opt.stamp }, round.room, round.day);
  if (opt.fail) sfxFail(); else sfxPop();
  if (state.isDead) { finish(); return; } // ¡sin vidas! game over inmediato
  ui.showContinue();
}

function next() {
  state.roundIndex++;
  ui.setCutMode(false);
  ui.hideContinue();
  if (state.roundIndex >= ROUNDS.length || state.isDead) { finish(); return; }
  busy = false;
  const round = currentRound();
  animator.startIdle(round.room, round.day);
  ui.renderHUD(state, round, ROUNDS.length);
  ui.renderRound(round, onPick);
  startTimer();
}

function finish() {
  stopTimer(); busy = false;
  ui.renderHUD(state, currentRound(), ROUNDS.length);
  syncPlayer(); // resultado final también se publica
  const medal = ui.showEndScreen(state);
  if (medal === "gold") sfxPop(); else sfxFail();
}

function reset() {
  state.reset();
  matchStart = Date.now();
  ui.resetHearts();
  ui.hideEnd();
  ui.setCutMode(false);
  ui.hideContinue();
  busy = false;
  const round = currentRound();
  animator.startIdle(round.room, round.day);
  ui.renderHUD(state, round, ROUNDS.length);
  ui.renderRound(round, onPick);
  syncPlayer();
  startTimer();
}

/** Las pupilas del Stickman miran la foto que tocas. */
function onPick(opt, ev) {
  const rc = document.getElementById("gameCanvas").getBoundingClientRect();
  animator.lookX = Math.max(-1, Math.min(1, ((ev.clientX - rc.left) / rc.width - 0.5) * 2));
  choose(opt);
}

// ---------- Init: grupo → HUD → ronda → reloj ----------
const GROUP_KEY = "stick-story-group";
document.getElementById("btnContinue").addEventListener("click", next);
document.getElementById("btnRetry").addEventListener("click", reset);

ui.showGroupPicker(localStorage.getItem(GROUP_KEY), (group) => {
  state.setGroup(group);
  try { localStorage.setItem(GROUP_KEY, group); } catch (e) { /* modo privado */ }
  ui.hideGroupPicker();
  syncPlayer(); // el grupo aparece al instante en el proyector
});

animator.startIdle(currentRound().room, currentRound().day);
ui.renderHUD(state, currentRound(), ROUNDS.length);
ui.renderRound(currentRound(), onPick);
startTimer();

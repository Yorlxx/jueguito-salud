/* =====================================================================
 * ADMIN · Tablero estilo Quizizz/Kahoot: carriles de equipos + leaderboard
 * + controles, todo en tiempo real con Supabase:
 *   supabase.channel('players_realtime')
 *     .on('postgres_changes', { table: 'players' }, updateTeamCard…)
 * Si un celular falla, el Stickman de su tarjeta hace el desmayo en el
 * proyector; si acierta, celebra. Sin Supabase muestra aviso y no rompe.
 * ===================================================================== */

import { supabase, isSupabaseConfigured } from "./core/supabaseClient.js";
import { StickmanAnimator } from "./components/canvas2d.js";
import { ROUNDS } from "./config/roundsData.js";

const GROUPS = ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4"];
const SESSION_ID = 1;
const ACTIVE_MS = 25000; // "Respondiendo" si actualizó hace menos de esto
const $ = (id) => document.getElementById(id);

// ---------- Estado local del tablero ----------
const cache = new Map(); // group_name → fila players
let lastSession = null;
const slots = new Map(); // group_name → { card, animator, room, day, seq, els }

// ---------- Carriles de equipos ----------
function buildTeams() {
  const box = $("teams");
  box.innerHTML = "";
  const rooms = [["bedroom", "DÍA"], ["desk", "DÍA"], ["desk", "TARDE"], ["bedroom", "NOCHE"]];
  GROUPS.forEach((g, i) => {
    const card = document.createElement("div");
    card.className = "team off";
    card.innerHTML = `
      <header><span>${g.toUpperCase()}</span><span class="st">💤 sin conectar</span></header>
      <canvas width="240" height="200"></canvas>
      <div class="lvlrow"><span class="lvl">Ronda –/8</span><span class="wt">—</span></div>
      <div class="prog"><div class="fill"></div></div>
      <div class="tstats"><span class="lv">—</span><span class="er">—</span></div>`;
    box.appendChild(card);
    const animator = new StickmanAnimator(card.querySelector("canvas"), {});
    animator.startIdle(rooms[i][0], rooms[i][1]);
    slots.set(g, { card, animator, room: rooms[i][0], day: rooms[i][1], seq: 0,
      st: card.querySelector(".st"), lvl: card.querySelector(".lvl"),
      fill: card.querySelector(".fill"), lv: card.querySelector(".lv"),
      er: card.querySelector(".er"), wt: card.querySelector(".wt") });
  });
}

const hearts = (n) => "❤️".repeat(n) + "🖤".repeat(Math.max(0, 3 - n));

/** 🟢 En línea · ✍️ Respondiendo · 🏁 Terminado · 💀 Eliminado */
function statusOf(p) {
  if (!p) return ["💤 sin conectar", ""];
  if (p.lives <= 0) return ["💀 Eliminado", ""];
  if (lastSession?.status === "finished") return ["🏁 Terminado", ""];
  const age = Date.now() - new Date(p.updated_at).getTime();
  if (age < ACTIVE_MS) return ["✍️ Respondiendo", "typing"];
  return ["🟢 En línea", ""];
}

/** Pinta UNA tarjeta (vidas, nivel, progreso, peso, errores, estado). */
function renderCard(g) {
  const s = slots.get(g);
  if (!s) return;
  const p = cache.get(g);
  s.card.classList.toggle("off", !p);
  s.card.classList.toggle("dead", !!p && p.lives <= 0);
  const [txt, cls] = statusOf(p);
  s.st.textContent = txt;
  s.st.className = "st" + (cls ? " " + cls : "");
  s.lvl.textContent = p ? `Ronda ${p.current_round} / 8` : "Ronda –/8";
  s.fill.style.width = p ? (((p.current_round - 1) / ROUNDS.length) * 100) + "%" : "0%";
  s.lv.textContent = p ? hearts(p.lives) : "—";
  s.er.textContent = p ? `⚠️ ${p.errors} err` : "—";
  s.wt.textContent = p ? `⚖️ ${Number(p.weight_kg).toFixed(1)} kg` : "—";
}
const renderAllCards = () => GROUPS.forEach(renderCard); // re-tick de estados (sin animar)

/** Mini-cinemática en el proyector y vuelta a idle (carril del grupo). */
async function runScene(g, scene, fail) {
  const s = slots.get(g);
  if (!s) return;
  const my = ++s.seq; // si llega otro evento, el anterior no pisa el idle
  await s.animator.play(scene, { fail, stamp: "" }, s.room, s.day, false);
  if (my === s.seq) s.animator.startIdle(s.room, s.day);
}

/**
 * Llamado por CADA cambio realtime de `players`: actualiza la tarjeta
 * del grupo (vidas, progreso, nivel), dispara su animación y reordena.
 */
function updateTeamCard(p) {
  if (!p || !slots.has(p.group_name)) { refreshAll(); return; } // DELETE u otro grupo
  const prev = cache.get(p.group_name);
  cache.set(p.group_name, p);
  if (!prev || p.lives < prev.lives) {
    runScene(p.group_name, "gastritis", true); // 💔 falló en su cel → desmayo en el proyector
  } else if (p.current_round > prev.current_round) {
    runScene(p.group_name, "balanced", false); // ✅ avanzó sano → celebra
  }
  renderCard(p.group_name);
  reorderLeaderboard();
}

/** Menos errores → más vidas → menor tiempo. */
function sortedPlayers() {
  return [...cache.values()].sort((a, z) =>
    (a.errors - z.errors) || (z.lives - a.lives) || ((a.total_time_s ?? 1e9) - (z.total_time_s ?? 1e9)));
}
const fmtTime = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

function reorderLeaderboard() {
  const list = sortedPlayers();
  $("boardBody").innerHTML = list.length ? list.map((p, i) => `
    <tr class="${i === 0 ? "leader" : ""}">
      <td>${["🥇", "🥈", "🥉", "4️⃣"][i] || (i + 1)}</td>
      <td>${p.group_name}</td><td>${p.lives}</td><td>${p.errors}</td>
      <td>${Number(p.weight_kg).toFixed(1)} kg</td><td>${p.current_round}/8</td>
      <td>${fmtTime(p.total_time_s || 0)}</td>
    </tr>`).join("")
    : `<tr><td colspan="7">Esperando grupos… cada celular elige el suyo al abrir el juego.</td></tr>`;
  $("sumGroups").textContent = `${cache.size}/${GROUPS.length}`;
}

function renderSession() {
  const label = { lobby: "LOBBY", running: "EN VIVO", paused: "PAUSA", finished: "FIN" }[lastSession?.status] || "LOBBY";
  $("sumStatus").textContent = label;
  $("sumRound").textContent = `${lastSession?.current_round || 1}/8`;
}

function setConn(ok, txt) {
  $("connDot").style.color = ok ? "#22c55e" : "#ef4444";
  $("connTxt").textContent = txt;
}

// ---------- Carga inicial + realtime ----------
async function refreshAll() {
  const [{ data: players }, { data: sess }] = await Promise.all([
    supabase.from("players").select("*"),
    supabase.from("sessions").select("*").eq("id", SESSION_ID).single(),
  ]);
  cache.clear();
  (players || []).forEach((p) => cache.set(p.group_name, p));
  lastSession = sess || null;
  renderAllCards();
  renderSession();
  reorderLeaderboard();
}

function subscribe() {
  supabase.channel("players_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "players" }, (payload) => {
      // Actualizar vidas, barra de progreso, nivel y animación del grupo específico
      updateTeamCard(payload.new);
      reorderLeaderboard();
    })
    .subscribe((status) => setConn(status === "SUBSCRIBED", status === "SUBSCRIBED" ? "realtime en vivo" : status));
  supabase.channel("session_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, (payload) => {
      lastSession = payload.new || lastSession;
      renderSession();
      renderAllCards(); // "Terminado" depende del estado global
    })
    .subscribe();
}

// ---------- Controles del admin ----------
async function safe(fn) {
  try { await fn(); await refreshAll(); }
  catch (e) { alert("Supabase: " + e.message); }
}
const setButtons = (on) => ["btnStart", "btnNext", "btnReset"].forEach((id) => { $(id).disabled = !on; });

// ---------- Init ----------
buildTeams();
setInterval(renderAllCards, 5000); // los "Respondiendo" envejecen solos
if (!isSupabaseConfigured() || !supabase) {
  $("warn").classList.add("show");
  setButtons(false);
  setConn(false, "sin configurar");
  reorderLeaderboard();
} else {
  setButtons(true);
  $("btnStart").onclick = () => safe(async () => {
    await supabase.from("players").delete().neq("group_name", "");
    await supabase.from("sessions").upsert({ id: SESSION_ID, status: "running", current_round: 1, paused: false });
  });
  $("btnNext").onclick = () => safe(async () => {
    const { data: s } = await supabase.from("sessions").select("current_round").eq("id", SESSION_ID).single();
    const nr = Math.min((s?.current_round || 1) + 1, ROUNDS.length);
    await supabase.from("sessions").update({
      current_round: nr, status: nr >= ROUNDS.length ? "finished" : "running",
    }).eq("id", SESSION_ID);
  });
  $("btnReset").onclick = () => safe(async () => {
    await supabase.from("players").delete().neq("group_name", "");
    await supabase.from("sessions").upsert({ id: SESSION_ID, status: "lobby", current_round: 1, paused: false });
  });
  refreshAll().then(() => subscribe()).catch((e) => setConn(false, e.message));
}

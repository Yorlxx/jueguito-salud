/* =====================================================================
 * ADMIN · Plataforma estilo Quizizz/Kahoot: salas por PIN + QR, carriles
 * con canvas (≤6) o lista densa (7+), leaderboard, podio y controles.
 * Realtime:
 *   supabase.channel('players_realtime').on('postgres_changes', players…)
 *   supabase.channel('session_realtime').on('postgres_changes', sessions…)
 * ===================================================================== */

import { supabase, isSupabaseConfigured } from "./core/supabaseClient.js";
import { StickmanAnimator } from "./components/canvas2d.js";
import { ROUNDS } from "./config/roundsData.js";
import { icon, hydrateIcons } from "./components/icons.js";

const $ = (id) => document.getElementById(id);
const MAX_CANVAS_TEAMS = 8; // tope de mini-canvas simultáneos
const ACTIVE_MS = 25000; // "Respondiendo" si actualizó hace menos de esto
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- Estado del tablero ----------
let room = null; // fila sessions activa (una sala a la vez)
let viewPref = "auto"; // auto | teams | rows
const cache = new Map(); // player_name → fila players
const slots = new Map(); // player_name → { card, animator, room, day, seq, connected }
let chPlayers = null, chSess = null;
const BG = [["bedroom", "DÍA"], ["desk", "DÍA"], ["desk", "TARDE"], ["bedroom", "NOCHE"]];
let bgCounter = 0;

// ---------- Sala: PIN + QR ----------
function joinUrl(pin) {
  const u = new URL("./index.html", window.location.href);
  u.searchParams.set("room", pin);
  return u.toString();
}
function renderRoomCard() {
  if (!room) {
    $("roomPin").textContent = "––––––";
    $("roomUrl").textContent = "Crea una sala para obtener su PIN y QR.";
    $("roomQr").classList.add("hide");
    return;
  }
  $("roomPin").textContent = room.room_code;
  const url = joinUrl(room.room_code);
  $("roomUrl").textContent = url;
  const qr = $("roomQr");
  qr.classList.remove("hide");
  qr.onerror = () => qr.classList.add("hide"); // sin internet: queda PIN + URL
  qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(url);
}

// ---------- Carriles dinámicos (un slot por jugador) ----------
function ensureSlot(name) {
  if (slots.has(name)) return slots.get(name);
  const [r, d] = BG[bgCounter++ % BG.length];
  const card = document.createElement("div");
  card.className = "team off";
  card.innerHTML = `
    <header><span>${esc(name).toUpperCase()}</span><span class="st">${icon("moon")} sin conectar</span></header>
    <canvas width="240" height="200"></canvas>
    <div class="lvlrow"><span class="lvl">Ronda –/${ROUNDS.length}</span><span class="wt">—</span></div>
    <div class="prog"><div class="fill"></div></div>
    <div class="tstats"><span class="lv">—</span><span class="er">—</span></div>`;
  $("teams").appendChild(card);
  const animator = new StickmanAnimator(card.querySelector("canvas"), {});
  animator.drawEmpty(r, d); // quieto hasta que el jugador actúe
  const slot = { card, animator, room: r, day: d, seq: 0, connected: false,
    st: card.querySelector(".st"), lvl: card.querySelector(".lvl"),
    fill: card.querySelector(".fill"), lv: card.querySelector(".lv"),
    er: card.querySelector(".er"), wt: card.querySelector(".wt") };
  slots.set(name, slot);
  return slot;
}
function pruneSlots() {
  for (const [name, s] of slots) {
    if (!cache.has(name)) { s.animator.cancel(); s.card.remove(); slots.delete(name); }
  }
}

/** Puntaje estilo Kahoot con formato local. */
const pts = (n) => `★ ${Number(n || 0).toLocaleString("es")}`;

/** En línea · Respondiendo · Terminado (icono + texto) */
function statusOf(p) {
  if (!p) return ["moon", "sin conectar", ""];
  if (p.status === "FINISHED" || p.status === "ELIMINATED" || room?.status === "FINISHED") return ["flag", "Terminado", ""];
  if (p.status === "FINISHED" || room?.status === "FINISHED") return ["flag", "Terminado", ""];
  const age = Date.now() - new Date(p.updated_at).getTime();
  if (age < ACTIVE_MS) return ["bolt", "Respondiendo", "typing"];
  return ["check", "En línea", ""];
}

/** Pinta UNA tarjeta (vidas, nivel, progreso, peso, errores, estado). */
function renderCard(name) {
  const s = slots.get(name);
  if (!s) return;
  const p = cache.get(name);
  s.card.classList.toggle("off", !p);
  // El idle vive solo mientras el jugador existe.
  if (p && !s.connected) { s.connected = true; s.animator.startIdle(s.room, s.day); }
  else if (!p && s.connected) { s.connected = false; s.animator.drawEmpty(s.room, s.day); }
  const [sic, txt, cls] = statusOf(p);
  s.st.innerHTML = `${icon(sic)} ${txt}`;
  s.st.className = "st" + (cls ? " " + cls : "");
  const rank = p ? sortedPlayers().findIndex((x) => x.player_name === name) + 1 : 0;
  s.lvl.textContent = p ? `Ronda ${p.current_round}/${ROUNDS.length} · #${rank}` : `Ronda –/${ROUNDS.length}`;
  s.fill.style.width = p ? (((p.current_round - 1) / ROUNDS.length) * 100) + "%" : "0%";
  s.lv.innerHTML = p ? `<b>${pts(p.points)}</b>` : "—";
  s.er.innerHTML = p ? `${icon("alert")} ${p.errors} err` : "—";
  s.wt.innerHTML = p ? `${icon("scale")} ${Number(p.weight_kg).toFixed(1)} kg` : "—";
}

/** Mini-cinemática en el proyector y vuelta a idle (carril del jugador). */
async function runScene(name, scene, fail) {
  const s = slots.get(name);
  if (!s) return;
  const my = ++s.seq; // si llega otro evento, el anterior no pisa el idle
  await s.animator.play(scene, { fail, stamp: "" }, s.room, s.day, false);
  if (my === s.seq) s.animator.startIdle(s.room, s.day);
}

// ---------- Vistas: grupos (canvas) vs individual (filas densas) ----------
function effMode() {
  if (viewPref !== "auto") return viewPref;
  return cache.size > 6 ? "rows" : "teams";
}
function applyView() {
  const m = effMode();
  $("teams").classList.toggle("hide", m !== "teams");
  $("rowsList").classList.toggle("hide", m !== "rows");
  $("viewAuto").classList.toggle("on", viewPref === "auto");
  $("viewTeams").classList.toggle("on", viewPref === "teams");
  $("viewRows").classList.toggle("on", viewPref === "rows");
  if (m === "teams") renderTeams();
  else renderRows(false);
}
function renderTeams() {
  sortedPlayers().slice(0, MAX_CANVAS_TEAMS).forEach((p) => { ensureSlot(p.player_name); renderCard(p.player_name); });
  pruneSlots();
}

/** Lista densa Quizizz con reordenamiento animado (FLIP). */
function renderRows(animate) {
  const box = $("rowsList");
  const list = sortedPlayers();
  if (!animate) { buildRows(box, list); return; }
  const first = new Map([...box.children].map((el) => [el.dataset.name, el.getBoundingClientRect().top]));
  buildRows(box, list);
  [...box.children].forEach((el) => {
    const f = first.get(el.dataset.name);
    if (f == null) {
      el.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "scale(1)" }], { duration: 300 });
      return;
    }
    const d = f - el.getBoundingClientRect().top;
    if (Math.abs(d) > 2) {
      el.animate([{ transform: `translateY(${d}px)` }, { transform: "translateY(0)" }],
        { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  });
}
function buildRows(box, list) {
  box.innerHTML = "";
  list.forEach((p, i) => {
    const pct = ((p.current_round - 1) / ROUNDS.length) * 100;
    const [sic, st] = statusOf(p);
    const div = document.createElement("div");
    div.className = "rowp";
    div.dataset.name = p.player_name;
    div.innerHTML = `<span class="pos"><span class="rank r${i + 1}">${i + 1}</span></span>
      <span class="nm">${esc(p.player_name)}</span>
      <span class="meta"><span class="bar"><i style="width:${pct}%"></i></span>
      <span><b>${pts(p.points)}</b></span><span class="badge">${icon(sic)} ${st}</span><span>${icon("alert")}${p.errors}</span></span>`;
    box.appendChild(div);
  });
  if (!list.length) box.innerHTML = `<div class="rowp"><span class="pos">…</span><span class="nm">Esperando jugadores…</span><span></span><span></span></div>`;
}

/**
 * Llamado por CADA cambio realtime de `players`: actualiza vidas, barra,
 * nivel y animación del jugador específico, y reordena el ranking.
 */
function updateTeamCard(p) {
  if (!p || !room || p.session_id !== room.id) return;
  const prev = cache.get(p.player_name);
  cache.set(p.player_name, p);
  if (effMode() === "teams") {
    ensureSlot(p.player_name);
    if (prev && p.errors > prev.errors) runScene(p.player_name, "gastritis", true); // falló → desmayo (0 puntos)
    else if (prev && p.current_round > prev.current_round) runScene(p.player_name, "balanced", false); // avanza → celebra
    renderCard(p.player_name);
    if (!prev) applyView(); // cambió el conteo → quizá auto-cambia de vista
  } else {
    renderRows(true); // reordena con animación suave
  }
  reorderLeaderboard();
  renderSummary();
}

/** Más puntos → menos errores → mayor ronda → menor tiempo. */
function sortedPlayers() {
  return [...cache.values()].sort((a, z) =>
    ((z.points ?? 0) - (a.points ?? 0)) || (a.errors - z.errors) ||
    (z.current_round - a.current_round) || ((a.total_time_s ?? 1e9) - (z.total_time_s ?? 1e9)) || String(a.player_name).localeCompare(String(z.player_name)));
}
const fmtTime = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

function reorderLeaderboard() {
  const list = sortedPlayers();
  $("boardBody").innerHTML = list.length ? list.map((p, i) => `
    <tr class="${i === 0 ? "leader" : ""}">
      <td><span class="rank r${i + 1}">${i + 1}</span></td>
      <td>${esc(p.player_name)}</td><td><b>${Number(p.points || 0).toLocaleString("es")}</b></td><td>${p.errors}</td>
      <td>${Number(p.weight_kg).toFixed(1)} kg</td><td>${p.current_round}/${ROUNDS.length}</td>
      <td>${fmtTime(p.total_time_s || 0)}</td>
    </tr>`).join("")
    : `<tr><td colspan="7">${room ? "Esperando jugadores… escanea el QR." : "Crea una sala para empezar…"}</td></tr>`;
}

/** Podio final con medallas (visible al finalizar la partida). */
function renderPodium() {
  const show = room?.status === "FINISHED" && cache.size > 0;
  $("podium").classList.toggle("show", show);
  if (!show) return;
  const rcls = ["gold", "silver", "bronze"];
  $("podiumCards").innerHTML = sortedPlayers().slice(0, 3).map((p, i) => `
    <div class="pdc"><div class="med ${rcls[i]}">${icon("trophy")}</div>
      <div class="pn">${esc(p.player_name)}</div>
      <div class="ps">${pts(p.points)} · ${icon("alert")}${p.errors} · R${p.current_round}/${ROUNDS.length}</div></div>`).join("");
}

function renderSummary() {
  $("sumGroups").textContent = cache.size;
  // En competencia libre la sala no impone ronda: se muestra la del líder.
  const lead = cache.size ? Math.max(...[...cache.values()].map((p) => p.current_round)) : null;
  $("sumRound").textContent = `${lead ?? "–"}/${ROUNDS.length}`;
  const label = { LOBBY: "LOBBY", RUNNING: "EN VIVO", PAUSED: "PAUSA", FINISHED: "FIN" }[room?.status] || "–";
  $("sumStatus").textContent = room?.paused ? "PAUSA" : label;
  $("btnPause").innerHTML = room?.paused ? `${icon("play")} REANUDAR` : `${icon("pause")} PAUSAR`;
}

function renderDynamic() {
  if (effMode() === "teams") renderTeams();
  else renderRows(false);
  reorderLeaderboard();
  renderSummary();
  renderPodium();
}

function setConn(ok, txt) {
  $("connDot").style.color = ok ? "#22c55e" : "#ef4444";
  $("connTxt").textContent = txt;
}

// ---------- Datos + realtime ----------
async function refreshAll() {
  if (!room) return;
  const [{ data: players }, { data: sess }] = await Promise.all([
    supabase.from("players").select("*").eq("session_id", room.id),
    supabase.from("sessions").select("*").eq("id", room.id).single(),
  ]);
  if (sess) room = sess;
  cache.clear();
  (players || []).forEach((p) => cache.set(p.player_name, p));
  pruneSlots();
  renderRoomCard();
  renderDynamic();
}

function subscribeRoom() {
  if (chPlayers) supabase.removeChannel(chPlayers);
  if (chSess) supabase.removeChannel(chSess);
  chSess = supabase.channel("session_realtime")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "sessions", filter: `id=eq.${room.id}` },
      (payload) => { if (payload.new) { room = payload.new; renderRoomCard(); renderDynamic(); } })
    .subscribe();
  chPlayers = supabase.channel("players_realtime")
    .on("postgres_changes",
      { event: "*", schema: "public", table: "players", filter: `session_id=eq.${room.id}` },
      (payload) => {
        // Actualizar vidas, barra de progreso, nivel y animación del jugador específico
        if (payload.new) updateTeamCard(payload.new);
        else refreshAll(); // DELETE (reinicio): reconstruye todo
        reorderLeaderboard();
      })
    .subscribe((status) => setConn(status === "SUBSCRIBED", status === "SUBSCRIBED" ? "realtime en vivo" : status));
}

function setRoom(r) {
  room = r;
  cache.clear();
  pruneSlots();
  try { localStorage.setItem("stick-admin-room", r ? r.room_code : ""); }
  catch (e) { /* modo privado */ }
  renderRoomCard();
  renderDynamic();
  if (r) subscribeRoom();
  scheduleRooms(); // la lista marca la sala activa
}

// ---------- Gestor de salas: revisar y cerrar (la BD no se llena) ----------
let roomsT = null;
const scheduleRooms = () => { clearTimeout(roomsT); roomsT = setTimeout(loadRooms, 800); };

/** Todas las salas con su conteo de jugadores (detecta las vacías). */
async function loadRooms() {
  if (!supabase) return;
  const { data, error } = await supabase.from("sessions")
    .select("id,room_code,status,current_round,paused,created_at,players(count)")
    .order("created_at", { ascending: false });
  if (error) { console.warn("[admin] salas:", error.message); return; }
  renderRooms(data || []);
}

function renderRooms(list) {
  const box = $("roomList");
  if (!box) return;
  const badge = {
    LOBBY: '<span class="dot warn"></span>LOBBY',
    RUNNING: '<span class="dot ok"></span>EN VIVO',
    PAUSED: '<span class="dot warn"></span>PAUSA',
    FINISHED: '<span class="dot"></span>FIN',
  };
  box.innerHTML = list.length ? list.map((r) => {
    const n = r.players?.[0]?.count ?? 0;
    const cur = room && r.id === room.id;
    const st = r.paused ? badge.PAUSED : (badge[r.status] || esc(r.status));
    const when = new Date(r.created_at).toLocaleString("es", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    return `<div class="roomrow${cur ? " cur" : ""}${n === 0 ? " empty" : ""}" data-id="${r.id}">
      <span class="rpin">${icon("key")} ${r.room_code}</span>
      <span class="rst">${st}</span>
      <span class="rcount">${n === 0 ? "vacía" : `${icon("users")} ${n}`}</span>
      <span class="rrnd">R${r.current_round}/${ROUNDS.length}</span>
      <span class="rwhen">${when}</span>
      <span class="racts">${cur ? `<em><span class="dot ok"></span> activa</em>` : `<button type="button" data-act="open">ENTRAR</button>`}<button type="button" data-act="close">${icon("x")} CERRAR</button></span>
    </div>`;
  }).join("") : `<div class="roomrow"><span>Sin salas. Crea la primera con CREAR NUEVA SALA.</span></div>`;
}

$("roomList").onclick = async (e) => {
  if (!supabase) return;
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.closest(".roomrow")?.dataset.id;
  if (!id) return;
  if (btn.dataset.act === "open") {
    const { data } = await supabase.from("sessions").select("*").eq("id", id).single();
    if (data) { setRoom(data); await refreshAll(); }
  } else if (btn.dataset.act === "close") {
    const pin = btn.closest(".roomrow").querySelector(".rpin")?.textContent || id;
    if (!confirm(`¿Cerrar la sala ${pin}? Se borra con todos sus jugadores.`)) return;
    await safe(async () => {
      await supabase.from("sessions").delete().eq("id", id); // CASCADE borra sus players
      if (room && room.id === id) setRoom(null); // limpiaba el tablero
      await loadRooms();
    });
  }
};

$("btnCleanEmpty").onclick = () => safe(async () => {
  const { data } = await supabase.from("sessions").select("id,room_code,players(count)");
  const empty = (data || []).filter((r) => (r.players?.[0]?.count ?? 0) === 0 && (!room || r.id !== room.id));
  if (!empty.length) { alert("No hay salas vacías para cerrar."); return; }
  if (!confirm(`¿Cerrar ${empty.length} sala(s) vacía(s)? La activa no se toca.`)) return;
  await supabase.from("sessions").delete().in("id", empty.map((r) => r.id));
  await loadRooms();
});

// La lista vive sola: cambios en salas o jugadores la refrescan (con debounce).
if (isSupabaseConfigured() && supabase) {
  supabase.channel("rooms_list")
    .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => scheduleRooms())
    .subscribe();
  supabase.channel("rooms_count")
    .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => scheduleRooms())
    .subscribe();
}

// ---------- Controles del admin ----------
async function safe(fn) {
  try { await fn(); await refreshAll(); }
  catch (e) { alert("Supabase: " + e.message); }
}
const setButtons = (on) => ["btnNew", "btnStart", "btnPause", "btnEnd", "btnReset", "btnCleanEmpty"]
  .forEach((id) => { $(id).disabled = !on; });

async function makePin() {
  for (let i = 0; i < 5; i++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const { data } = await supabase.from("sessions").select("id").eq("room_code", pin);
    if (!data || !data.length) return pin;
  }
  return String(Date.now()).slice(-6); // respaldo casi imposible de chocar
}

// ---------- Init ----------
$("viewAuto").onclick = () => { viewPref = "auto"; applyView(); };
$("viewTeams").onclick = () => { viewPref = "teams"; applyView(); };
$("viewRows").onclick = () => { viewPref = "rows"; applyView(); };
setInterval(() => { if (room) renderDynamic(); }, 5000); // los "Respondiendo" envejecen solos

(async function init() {
  applyView();
  if (!isSupabaseConfigured() || !supabase) {
    $("warn").classList.add("show");
    setButtons(false);
    setConn(false, "sin configurar");
    reorderLeaderboard();
    return;
  }
  setButtons(true);
  $("btnNew").onclick = () => safe(async () => {
    const pin = await makePin();
    const { data, error } = await supabase.from("sessions")
      .insert({ room_code: pin, status: "LOBBY", current_round: 1, paused: false, timer_seconds: 15 })
      .select().single();
    if (error) throw error;
    setRoom(data);
    await refreshAll();
  });
  $("btnStart").onclick = () => safe(async () => {
    if (!room) return alert("Crea una sala primero.");
    // Partida nueva = tabla limpia: se borran filas de partidas anteriores
    // para que el ranking por puntos no herede fantasmas (quedar 2° solo).
    // Es seguro: al arrancar, cada celular resetea y recrea su fila al instante.
    // match_no = nueva época: obliga a todos a arrancar de cero.
    await supabase.from("players").delete().eq("session_id", room.id);
    await supabase.from("sessions").update({ status: "RUNNING", current_round: 1, paused: false, match_no: Date.now() }).eq("id", room.id);
  });
  $("btnPause").onclick = () => {
    if (!room) return;
    // Optimista: cambia ya a REANUDAR/PAUSAR; el realtime lo confirma.
    $("btnPause").innerHTML = room.paused ? `${icon("pause")} PAUSAR` : `${icon("play")} REANUDAR`;
    safe(async () => {
      await supabase.from("sessions").update({ paused: !room.paused }).eq("id", room.id);
    });
  };
  $("btnEnd").onclick = () => safe(async () => {
    if (!room) return;
    await supabase.from("sessions").update({ status: "FINISHED", paused: false }).eq("id", room.id);
  });
  $("btnReset").onclick = () => safe(async () => {
    if (!room) return;
    await supabase.from("players").delete().eq("session_id", room.id);
    await supabase.from("sessions").update({ status: "LOBBY", current_round: 1, paused: false }).eq("id", room.id);
  });

  // Sala guardada o la más reciente; si no hay, el admin crea una.
  hydrateIcons(document); // convierte <i data-ic> estáticos en SVG
  try {
    let r = null;
    const saved = localStorage.getItem("stick-admin-room");
    if (saved) r = (await supabase.from("sessions").select("*").eq("room_code", saved).single()).data;
    if (!r) r = (await supabase.from("sessions").select("*").order("created_at", { ascending: false }).limit(1).single()).data;
    if (r) { setRoom(r); await refreshAll(); }
    else { renderRoomCard(); reorderLeaderboard(); renderSummary(); }
    loadRooms(); // lista de salas (con conteos) desde el inicio
  } catch (e) { setConn(false, e.message); }
})();

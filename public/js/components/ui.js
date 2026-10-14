/* =====================================================================
 * COMPONENTE · Renderizado de interfaz: HUD de Vidas, notas, Polaroids,
 * registro a sala, sala de espera, pausa docente y podio final.
 * Solo toca el DOM; la lógica vive en core + main.
 * ===================================================================== */

/* =====================================================================
 * COMPONENTE · Renderizado de interfaz: HUD de Puntos, notas, Polaroids,
 * registro a sala, sala de espera, pausa docente y podio final.
 * Solo toca el DOM; la lógica vive en core + main.
 * ===================================================================== */

const $ = (id) => document.getElementById(id);

/** Banderines: puntos, nivel, peso, errores + cinta + puntitos. */
export function renderHUD(state, round, totalRounds) {
  // puntos estilo Kahoot: el número manda (con salto al sumar)
  const h = $("hudPts");
  const before = Number(h.dataset.pts || 0);
  h.textContent = state.points.toLocaleString("es");
  h.dataset.pts = state.points;
  if (state.points > before) { h.classList.remove("bump"); void h.offsetWidth; h.classList.add("bump"); }

  $("hudLvl").textContent = Math.min(state.roundIndex + 1, totalRounds) + "/" + totalRounds;
  $("hudWeight").textContent = state.weight.toFixed(1);
  $("hudErr").textContent = state.errors + " ERR";
  $("tapeTitle").textContent = round.tape + (["", " · ★ FÁCIL", " · ★★ MEDIA", " · ★★★ DURA"][round.difficulty] || "");
  $("sceneLabel").textContent = round.scene + " · " + round.clock;
  $("dots").innerHTML = Array.from({ length: totalRounds }, (_, i) =>
    `<span class="${i < state.roundIndex ? "done" : i === state.roundIndex ? "now" : ""}"></span>`).join("");
}

/** Reloj de 15 s del banderín central. */
export function paintTimer(timeLeft, total) {
  const v = Math.max(0, timeLeft);
  const n = $("timerNum");
  n.textContent = Math.ceil(v);
  n.classList.toggle("danger", v <= 3);
}

/**
 * Polaroids: título engañoso + ícono. Cero HP/errores (cero spoilers).
 * @param {object} round ronda activa
 * @param {(opt: object, ev: PointerEvent) => void} onPick callback al tocar
 */
export function renderRound(round, onPick) {
  $("narrativeText").textContent = round.narrative;
  const box = $("polas");
  box.innerHTML = ""; box.style.display = "flex";
  $("optsHidden").style.display = "none";
  hideContinue();
  round.options.forEach((opt) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pola"; b.setAttribute("aria-label", opt.name);
    b.innerHTML = `<span class="photo">${opt.icon}</span><span class="cap">${opt.label}</span>`;
    b.onclick = (e) => onPick(opt, e);
    box.appendChild(b);
  });
}

/** Oculta las fotos durante la cinemática. */
export function lockOptions() {
  $("polas").style.display = "none";
  $("optsHidden").style.display = "block";
}

/** Activa/desactiva las respuestas (pausa docente). */
export function setAnswersEnabled(on) {
  const p = $("polas");
  p.style.pointerEvents = on ? "" : "none";
  p.style.opacity = on ? "" : ".45";
}

export function setNarrative(text) { $("narrativeText").textContent = text; }
export function setCutMode(on) { $("panel").classList.toggle("cut", on); }
export function showContinue() { $("optsHidden").style.display = "none"; $("btnContinue").classList.add("show"); }
export function hideContinue() { $("btnContinue").classList.remove("show"); }

/** Vibración de pantalla al perder una vida. */
export function shakeApp() {
  const a = $("app");
  a.classList.remove("shake"); void a.offsetWidth; a.classList.add("shake");
}

// ---------- Registro a sala ----------
/**
 * Formulario PIN + nombre (el PIN viene prellenado si se escaneó el QR).
 * @param {{pin: string, name: string, local: boolean}} preset valores previos
 * @param {(pin: string, name: string) => void} onJoin callback al unirse
 */
export function showJoinForm(preset, onJoin) {
  if (!preset.local) {
    $("inpPin").value = preset.pin || "";
    $("inpPin").closest("label").style.display = "";
    $("joinLocalNote").textContent = "¿Sin PIN? Déjalo vacío para practicar en local.";
  } else {
    // Sin Supabase: partida local directa, solo pide nombre.
    $("inpPin").closest("label").style.display = "none";
    $("joinLocalNote").textContent = "Modo local sin conexión: juega libremente.";
  }
  $("inpName").value = preset.name || "";
  joinError("");
  $("joinOverlay").classList.remove("hide");
  $("btnJoin").onclick = () => onJoin($("inpPin").value.trim(), ($("inpName").value.trim() || "Anónimo"));
}
export function hideJoinForm() { $("joinOverlay").classList.add("hide"); }
export function joinError(msg) { $("joinErr").textContent = msg || ""; }

// ---------- Sala de espera y pausa ----------
/** Sala de espera: bloquea el juego hasta que el anfitrión inicie. */
export function showWaiting(msg) { $("waitMsg").textContent = msg; $("waitOverlay").classList.remove("hide"); }
export function hideWaiting() { $("waitOverlay").classList.add("hide"); }

/** Modal de pausa impuesta por el docente (congela reloj y botones). */
export function showPause() { $("pauseOverlay").classList.remove("hide"); }
export function hidePause() { $("pauseOverlay").classList.add("hide"); }

/**
 * Podio final: medalla según puntos + contador de errores.
 * @returns {"gold"|"silver"|"bronze"|"none"} medalla obtenida (para SFX)
 */
export function showEndScreen(state, totalRounds = 8) {
  const p = state.points, e = state.errors;
  let emoji, badge, color, desc, medal;
  if (p >= 21000) {
    medal = "gold";
    emoji = "🏆"; badge = "MEDALLA DE ORO 🏆 ¡FUGA PERFECTA!"; color = "#b45309";
    desc = `¡${p.toLocaleString("es")} puntos en ${totalRounds} rondas! Dev escapa de la prisión. ¡LEYENDA!`;
  } else if (p >= 13000) {
    medal = "silver";
    emoji = "🥈"; badge = "MEDALLA DE PLATA 🥈 ¡CASI LIBRE!"; color = "#64748b";
    desc = `¡${p.toLocaleString("es")} puntos y ${e} error(es)! El túnel está casi listo… ¡reintenta el oro!`;
  } else if (p >= 6000) {
    medal = "bronze";
    emoji = "🥉"; badge = "MEDALLA DE BRONCE 🥉 ¡SOBREVIVIENTE!"; color = "#92400e";
    desc = `¡${p.toLocaleString("es")} puntos y ${e} errores! Saliste gateando, pero saliste. ¡Ve por más puntos!`;
  } else {
    medal = "none";
    emoji = "💤"; badge = "¡PARTIDA COMPLETADA!"; color = "#475569";
    desc = `¡${p.toLocaleString("es")} puntos y ${e} errores! Completaste la fuga: ahora apunta a las medallas.`;
  }
  $("endEmoji").textContent = emoji;
  $("endBadge").textContent = badge;
  $("endBadge").style.color = color;
  $("endDesc").textContent = desc;
  $("endStats").innerHTML =
    `<div class="cell">★ PUNTOS<span class="big">${state.points.toLocaleString("es")}</span></div>` +
    `<div class="cell">⚠️ ERRORES<span class="big">${state.errors}</span></div>` +
    `<div class="cell">⚖️ PESO<span class="big">${state.weight.toFixed(1)} kg</span></div>`;
  $("endScreen").classList.add("show");
  return medal;
}

export function hideEnd() { $("endScreen").classList.remove("show"); }

/** Punto de conexión: verde = backend alcanzable (realtime o sondeo). */
export function setNet(ok) {
  const d = $("netDot");
  if (d) d.style.color = ok ? "#22c55e" : "#ef4444";
}

/** Lobby de resultados: ya respondí todo, espero el podio del docente. */
export function showDone(points, errors) {
  $("doneLives").textContent = `★ ${points.toLocaleString("es")} pts`;
  $("doneErrors").textContent = `⚠️ ${errors} errores`;
  $("doneOverlay").classList.remove("hide");
}
export function hideDone() { $("doneOverlay").classList.add("hide"); }

/** "+850" flotante al acertar (feedback de puntos Kahoot). */
export function showGain(n) {
  const g = $("gainPop");
  g.textContent = `+${n}`;
  g.classList.remove("pop"); void g.offsetWidth; g.classList.add("pop");
}

/** En sala no hay reintentos (competencia supervisada); en local sí. */
export function setRetryVisible(on) {
  const r = $("btnRetry"), p = $("btnReplay");
  if (r) r.style.display = on ? "" : "none";
  if (p) p.style.display = on ? "" : "none";
}

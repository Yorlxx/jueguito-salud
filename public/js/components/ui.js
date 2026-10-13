/* =====================================================================
 * COMPONENTE · Renderizado de interfaz: HUD de Vidas, notas, Polaroids
 * y podio final. Solo toca el DOM; la lógica vive en core + main.
 * ===================================================================== */

import { MAX_LIVES } from "../core/gameState.js";

const $ = (id) => document.getElementById(id);
let prevLives = MAX_LIVES; // para animar el corazón recién perdido

/** Reinicia la animación de corazones (al reintentar). */
export function resetHearts() { prevLives = MAX_LIVES; }

/** Banderines: vidas, nivel, peso, errores + cinta + puntitos. */
export function renderHUD(state, round, totalRounds) {
  // corazones: ❤️ vivas, 🖤 perdidas; el recién roto tiembla
  let hearts = "";
  for (let i = 0; i < MAX_LIVES; i++) {
    hearts += `<span class="${i < state.lives ? "" : "lost"}">${i < state.lives ? "❤️" : "🖤"}</span>`;
  }
  const h = $("hearts");
  h.innerHTML = hearts;
  if (state.lives < prevLives) { h.classList.remove("break"); void h.offsetWidth; h.classList.add("break"); }
  prevLives = state.lives;

  $("hudLvl").textContent = Math.min(state.roundIndex + 1, totalRounds) + "/" + totalRounds;
  $("hudWeight").textContent = state.weight.toFixed(1);
  $("hudErr").textContent = state.errors + " ERR";
  $("tapeTitle").textContent = round.tape;
  $("sceneLabel").textContent = round.scene + " · " + round.clock;
  $("dots").innerHTML = Array.from({ length: totalRounds }, (_, i) =>
    `<span class="${i < state.roundIndex ? "done" : i === state.roundIndex ? "now" : ""}"></span>`).join("");
}

/** Reloj de 8 s del banderín central. */
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

export function setNarrative(text) { $("narrativeText").textContent = text; }
export function setCutMode(on) { $("panel").classList.toggle("cut", on); }
export function showContinue() { $("optsHidden").style.display = "none"; $("btnContinue").classList.add("show"); }
export function hideContinue() { $("btnContinue").classList.remove("show"); }

/** Vibración de pantalla al perder una vida. */
export function shakeApp() {
  const a = $("app");
  a.classList.remove("shake"); void a.offsetWidth; a.classList.add("shake");
}

/**
 * Podio final: medalla según vidas sobrevivientes + contador de errores.
 * @returns {"gold"|"silver"|"bronze"|"dead"} medalla obtenida (para SFX)
 */
export function showEndScreen(state) {
  const e = state.errors;
  let emoji, badge, color, desc, medal;
  if (state.lives <= 0) {
    medal = "dead";
    emoji = "💀"; badge = "GAME OVER 💀 - HOSPITALIZADO POR GASTRITIS/DESNUTRICIÓN"; color = "#dc2626";
    desc = "¡Perdiste las 3 vidas! Dev termina hospitalizado por gastritis y desnutrición. ¡Reintenta la fuga con decisiones sanas!";
  } else if (state.lives === 3 && e === 0) {
    medal = "gold";
    emoji = "🏆"; badge = "MEDALLA DE ORO 🏆 ¡FUGA PERFECTA!"; color = "#b45309";
    desc = "¡Cero errores en 8 rondas con 3 vidas intactas! Dev escapa de la prisión. ¡LEYENDA!";
  } else if (state.lives === 2) {
    medal = "silver";
    emoji = "🥈"; badge = "MEDALLA DE PLATA 🥈 ¡CASI LIBRE!"; color = "#64748b";
    desc = "¡2 vidas sobrevivientes y " + e + " error(es)! El túnel está casi listo… ¡reintenta el oro!";
  } else {
    medal = "bronze";
    emoji = "🥉"; badge = "MEDALLA DE BRONCE 🥉 ¡SOBREVIVIENTE!"; color = "#92400e";
    desc = "¡1 vida y " + e + " errores! Saliste gateando, pero saliste. ¡Ve por más vidas!";
  }
  $("endEmoji").textContent = emoji;
  $("endBadge").textContent = badge;
  $("endBadge").style.color = color;
  $("endDesc").textContent = desc;
  $("endStats").innerHTML =
    `<div class="cell">❤️ VIDAS<span class="big">${"❤️".repeat(state.lives)}${"🖤".repeat(MAX_LIVES - state.lives)}</span></div>` +
    `<div class="cell">⚠️ ERRORES<span class="big">${state.errors}</span></div>` +
    `<div class="cell">⚖️ PESO<span class="big">${state.weight.toFixed(1)} kg</span></div>`;
  $("endScreen").classList.add("show");
  return medal;
}

export function hideEnd() { $("endScreen").classList.remove("show"); }

/**
 * Overlay "Elige tu grupo" (identidad del celular para el admin).
 * @param {string|null} current grupo guardado (si existe)
 * @param {(group: string) => void} onSelect callback al elegir
 */
export function showGroupPicker(current, onSelect) {
  const ov = $("groupOverlay");
  ov.classList.remove("hide");
  ov.querySelectorAll("#groupGrid button").forEach((b) => {
    b.classList.toggle("sel", b.dataset.group === current);
    b.onclick = () => onSelect(b.dataset.group);
  });
}
export function hideGroupPicker() { $("groupOverlay").classList.add("hide"); }

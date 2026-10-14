/* =====================================================================
 * ICONOS VECTORIALES SVG inline (cero dependencias, cero emojis).
 * Estilo lineal monocromo: heredan `currentColor` para teñirse por CSS.
 * Uso en JS:  icon("heart")  →  string <svg…>
 * Uso en HTML: <i data-ic="heart"></i> + hydrateIcons() al iniciar.
 * ===================================================================== */

const S = (inner) =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const F = (d) => `<path fill="currentColor" stroke="none" d="${d}"/>`;

const ICONS = {
  /* ---------- UI general ---------- */
  heart: `<path fill="currentColor" stroke="none" d="M12 20.7C6.9 16.6 3.2 13.2 3.2 9.1 3.2 6.4 5.3 4.5 7.9 4.5c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3 2.6 0 4.7 1.9 4.7 4.6 0 4.1-3.7 7.5-8.8 11.6z"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>`,
  scale: `<circle cx="12" cy="14.5" r="5.5"/><path d="M9.3 9.7C9.3 6.6 10.2 5 12 5s2.7 1.6 2.7 4.7"/>`,
  bolt: `<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8z"/>`,
  alert: `<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5V14"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>`,
  check: `<path d="M4.5 12.5 10 18 19.5 7"/>`,
  x: `<path d="M6 6l12 12M18 6 6 18"/>`,
  trophy: `<path d="M8 4h8v4.5a4 4 0 0 1-8 0V4z"/><path d="M8 5H4.8A1.8 1.8 0 0 0 4.8 8.6H8M16 5h3.2a1.8 1.8 0 0 1 0 3.6H16M12 12.5V16M8.8 20h6.4M10 16.5h4"/>`,
  medal: `<circle cx="12" cy="9" r="5"/><path d="M9.3 13.3 7 21l5-2.4L17 21l-2.3-7.7"/>`,
  skull: `<path d="M12 3.5a6.5 6.5 0 0 0-6.5 6.5c0 2.2 1.1 3.9 2.8 5V18a1.5 1.5 0 0 0 1.5 1.5h4.4A1.5 1.5 0 0 0 15.7 18v-3c1.7-1.1 2.8-2.8 2.8-5A6.5 6.5 0 0 0 12 3.5z"/><circle cx="9.3" cy="10.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="14.7" cy="10.5" r="1.4" fill="currentColor" stroke="none"/><path d="M12 13.2v2"/>`,
  pause: `<rect x="8" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none"/>`,
  play: `<path d="M8 5.2v13.6L18.5 12 8 5.2z" fill="currentColor" stroke="none"/>`,
  rocket: `<path d="M12 2.5c2.8 2.4 4.2 5.8 4.2 9.7l2.3 3.3-2.9.4c-1 1.4-2.3 2.1-3.6 2.1s-2.6-.7-3.6-2.1l-2.9-.4 2.3-3.3c0-3.9 1.4-7.3 4.2-9.7z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M10.5 15.5h3"/>`,
  reset: `<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>`,
  flag: `<path d="M6 21V4"/><path d="M6 4.5h11l-2.6 3.5L17 11.5H6"/>`,
  users: `<circle cx="9" cy="8.5" r="3.2"/><path d="M3.2 19.5c.7-3.3 2.7-4.8 5.8-4.8s5.1 1.5 5.8 4.8"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.2 14.9c2.2.4 3.7 1.7 4.3 4"/>`,
  user: `<circle cx="12" cy="8" r="3.8"/><path d="M5.2 20.5c.9-4.2 3.4-6.2 6.8-6.2s5.9 2 6.8 6.2"/>`,
  key: `<circle cx="8" cy="12" r="4"/><path d="M12 12h8.5M18 12v4M15.5 12v2.5"/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>`,
  wifi: `<path d="M4.5 10a11 11 0 0 1 15 0M7.5 13.5a6.5 6.5 0 0 1 9 0"/><circle cx="12" cy="17.5" r="1.4" fill="currentColor" stroke="none"/>`,
  moon: `<path d="M20 14.2A8.2 8.2 0 0 1 9.8 3.8 8.2 8.2 0 1 0 20 14.2z"/>`,
  chat: `<path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6z"/>`,
  clapper: `<rect x="3" y="10" width="18" height="10" rx="2"/><path d="M3.5 10 4.5 4.5 20 6.5l-.8 4.2"/><path d="M8 4.8l1.5 4M13 5.4l1.5 4"/>`,
  spark: `<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>`,
  trash: `<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/><path d="M10 11v6M14 11v6"/>`,
  arrow: `<path d="M4 12h15M13 6l6 6-6 6"/>`,
  box: `<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>`,

  /* ---------- Opciones de comida / acción ---------- */
  soda: `<path d="M7 8h10l-1.2 12.5H8.2L7 8z"/><path d="M6 5.5h12"/><path d="M13.5 5.5 16 2.5"/>`,
  phone: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.8 18.5h2.4"/>`,
  droplet: `<path d="M12 3.2s5.8 6.3 5.8 10.6a5.8 5.8 0 0 1-11.6 0C6.2 9.5 12 3.2 12 3.2z"/>`,
  choco: `<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M7 9h10M7 15h10M12 3v18"/>`,
  nuts: `<ellipse cx="12" cy="13.5" rx="5.5" ry="6.5" transform="rotate(18 12 13.5)"/><path d="M9.5 11c1-1.2 2.5-1.6 4-1.4"/>`,
  cracker: `<rect x="5.5" y="5.5" width="13" height="13" rx="2" transform="rotate(12 12 12)"/>` +
    F("M10 10.5a.9.9 0 1 0 .1 0zM14 10a.9.9 0 1 0 .1 0zM10.5 14a.9.9 0 1 0 .1 0zM14.5 14a.9.9 0 1 0 .1 0z"),
  pill: `<g transform="rotate(-45 12 12)"><rect x="4" y="9" width="16" height="6" rx="3"/><path d="M12 9v6"/></g>`,
  burger: `<path d="M4.5 10a7.5 5 0 0 1 15 0"/><circle cx="9" cy="7.4" r=".9" fill="currentColor" stroke="none"/><circle cx="12.5" cy="6.4" r=".9" fill="currentColor" stroke="none"/><circle cx="15.5" cy="7.6" r=".9" fill="currentColor" stroke="none"/><path d="M3.5 13h17M5 16.5h14"/>`,
  salad: `<path d="M4 12.5h16a8 8 0 0 1-16 0z"/><circle cx="9" cy="9" r="2"/><circle cx="13.5" cy="7.5" r="2.4"/><circle cx="16" cy="10.5" r="1.6"/>`,
  coffee: `<path d="M4.5 9.5h11V14a4.5 4.5 0 0 1-4.5 4.5H9A4.5 4.5 0 0 1 4.5 14V9.5z"/><path d="M15.5 10.5h1.6a2.4 2.4 0 0 1 0 4.8h-1.6"/><path d="M8.5 3c-1.2 1.6 1.2 2.6 0 4.2M12 3c-1.2 1.6 1.2 2.6 0 4.2"/>`,
  yogurt: `<path d="M7.5 5.5h9L15.3 19H8.7L7.5 5.5z"/><path d="M6.5 5.5h11"/><path d="M12 9.5v4"/>`,
  candy: `<circle cx="12" cy="12" r="3.8"/><path d="M8.4 10 3.5 7v10l4.9-3M15.6 10l4.9-3v10l-4.9-3"/>`,
  gamepad: `<path d="M7 7.5h10a5 5 0 0 1 5 5c0 2.7-2 4.8-3.9 4.8-1.4 0-2.3-.8-3-2H8.9c-.7 1.2-1.6 2-3 2C4 17.3 2 15.2 2 12.5a5 5 0 0 1 5-5z"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.8" cy="14" r="1" fill="currentColor" stroke="none"/>`,
  soup: `<path d="M4 13.5h16a8 8 0 0 1-16 0z"/><path d="M9 6.5c-1.2 1.5 1.2 2.5 0 4M13.5 6.5c-1.2 1.5 1.2 2.5 0 4"/>`,
  pizza: `<path d="M12 3.5 5.5 20.5 12 18.2l6.5 2.3L12 3.5z"/><circle cx="11" cy="10" r="1.2"/><circle cx="13" cy="14" r="1.2"/><circle cx="10.5" cy="15.5" r="1"/>`,
  couch: `<path d="M6 11V7.5A2.5 2.5 0 0 1 8.5 5h7A2.5 2.5 0 0 1 18 7.5V11"/><path d="M4 11.5h16a1 1 0 0 1 1 1V18H3v-5.5a1 1 0 0 1 1-1z"/><path d="M5.5 18v1.5M18.5 18v1.5"/>`,
  dumbbell: `<path d="M7 7v10M17 7v10M4 9.5v5M20 9.5v5M7 12h10"/>`,
  lotus: `<circle cx="12" cy="6.5" r="2.5"/><path d="M12 10.5c-2.8 0-4.8 1.8-5.8 4.5L4 17h16l-2.2-2c-1-2.7-3-4.5-5.8-4.5z"/><path d="M7.5 20h9"/>`,
  robot: `<rect x="5" y="10" width="14" height="9" rx="2"/><path d="M12 10V4.8"/><circle cx="12" cy="3.6" r="1"/><circle cx="9.5" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="14" r="1" fill="currentColor" stroke="none"/><path d="M9.7 16.6h4.6"/><path d="M2.8 13v3M21.2 13v3"/>`,
  clipboard: `<rect x="6" y="4.5" width="12" height="16.5" rx="2"/><rect x="9" y="2.8" width="6" height="3.8" rx="1"/><path d="M9.5 11h5M9.5 14.5h5M9.5 18h3"/>`,
  moon: `<path d="M20 14.2A8.2 8.2 0 0 1 9.8 3.8 8.2 8.2 0 1 0 20 14.2z"/>`,
  bed: `<path d="M3 18.5v-6"/><path d="M3 14h18v4.5"/><path d="M3 16.5h18"/><rect x="5.5" y="10.5" width="5" height="3.5" rx="1"/>`,
};

/** Devuelve el string <svg> del ícono pedido (o `box` si no existe). */
export function icon(name, cls = "") {
  const inner = ICONS[name] || ICONS.box;
  return S(inner).replace('class="ic"', `class="ic${cls ? " " + cls : ""}"`);
}

/** Medalla por puntos: devuelve el nombre de ícono + clase de color. */
export function medalFor(points) {
  if (points >= 21000) return { icon: "trophy", cls: "gold", medal: "gold" };
  if (points >= 13000) return { icon: "medal", cls: "silver", medal: "silver" };
  if (points >= 6000) return { icon: "medal", cls: "bronze", medal: "bronze" };
  return { icon: "check", cls: "none", medal: "none" };
}

/** Reemplaza `<i data-ic="nombre"></i>` por su SVG (HTML estático). */
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-ic]").forEach((el) => {
    const n = el.getAttribute("data-ic");
    if (n && ICONS[n] && !el.dataset.icDone) {
      el.innerHTML = icon(n);
      el.dataset.icDone = "1";
    }
  });
}

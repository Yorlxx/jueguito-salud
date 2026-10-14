/* =====================================================================
 * COMPONENTE · Motor Canvas 2D: habitación + Stickman cómic + fails 3 s.
 * Todo dibujado por código (requestAnimationFrame). Sin dependencias:
 * recibe la ronda ({room, day}) por parámetros y los SFX por inyección.
 * ===================================================================== */

export class StickmanAnimator {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{boing?: () => void}} [sfx] efectos inyectados (testeable / mudo)
   */
  constructor(canvas, sfx = {}) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.W = canvas.width; this.H = canvas.height;
    this.raf = null; this.idleT = 0; this.lookX = 0; // pupilas siguen el último toque
    this.sfx = sfx;
    // Ojos interactivos: las pupilas miran donde tocas el lienzo.
    canvas.addEventListener("pointerdown", (e) => {
      const r = canvas.getBoundingClientRect();
      this.lookX = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    });
  }

  clear() { this.ctx.clearRect(0, 0, this.W, this.H); }
  cancel() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }

  txt(s, x, y, size, color, stroke) {
    const c = this.ctx; c.textAlign = "center";
    c.font = "900 " + (size || 13) + 'px "Comic Sans MS", cursive, sans-serif';
    if (stroke) { c.lineWidth = 4; c.strokeStyle = "#1c2433"; c.strokeText(s, x, y); }
    c.fillStyle = color || "#1c2433"; c.fillText(s, x, y);
  }
  line(x1, y1, x2, y2, color, w) { const c = this.ctx; c.strokeStyle = color || "#1c2433";
    c.lineWidth = w || 6; c.lineCap = "round"; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  circle(x, y, r, fill, stroke, w) { const c = this.ctx; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = w || 4; c.strokeStyle = stroke; c.stroke(); } }

  star(x, y, r, color) { // estrella de impacto cómica
    const c = this.ctx; c.save(); c.translate(x, y); c.beginPath();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = i % 2 ? r * 0.55 : r;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = color || "#facc15"; c.fill();
    c.lineWidth = 4; c.strokeStyle = "#1c2433"; c.stroke(); c.restore();
  }
  speedLines(x, y, n, color) { // líneas de velocidad
    const c = this.ctx; c.strokeStyle = color || "#1c2433"; c.lineWidth = 3;
    for (let i = 0; i < (n || 6); i++) { const yy = y - 40 + i * 16;
      c.beginPath(); c.moveTo(x - 70, yy); c.lineTo(x - 30, yy); c.stroke(); }
  }

  /* --- Habitación del estudiante: escritorio + laptop + cama + ventana --- */
  room(kind, day) {
    const c = this.ctx, W = this.W, H = this.H;
    const night = day === "NOCHE";
    c.fillStyle = night ? "#3b4a63" : "#aebdd2"; c.fillRect(0, 0, W, H); // pared
    c.fillStyle = night ? "#2c3850" : "#93a5c0"; c.fillRect(0, 0, W, 60);
    c.fillStyle = night ? "#232c42" : "#7c8dab"; c.fillRect(0, 268, W, H - 268); // suelo
    c.strokeStyle = "#1c2433"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 268); c.lineTo(W, 268); c.stroke();
    // ventana día/noche
    c.fillStyle = "#fdf6e3"; c.fillRect(238, 70, 96, 80); c.lineWidth = 4; c.strokeRect(238, 70, 96, 80);
    c.fillStyle = night ? "#1e2a4a" : "#7dd3fc"; c.fillRect(244, 76, 84, 68);
    c.strokeStyle = "#1c2433"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(286, 76); c.lineTo(286, 144); c.moveTo(244, 110); c.lineTo(328, 110); c.stroke();
    if (night) { c.fillStyle = "#fde047"; c.fillRect(300, 88, 16, 16); }
    else { c.fillStyle = "#facc15"; c.beginPath(); c.arc(262, 94, 11, 0, 7); c.fill(); }
    // póster code
    c.fillStyle = "#fdf6e3"; c.fillRect(26, 74, 84, 60); c.lineWidth = 4; c.strokeRect(26, 74, 84, 60);
    this.txt("</>", 68, 100, 20, "#0284c7"); this.txt("DEV", 68, 122, 13, "#1c2433");
    // cama (izquierda)
    c.fillStyle = "#6d5bd0"; c.fillRect(14, 196, 128, 26);
    c.fillStyle = "#fdf6e3"; c.fillRect(14, 182, 128, 20);
    c.fillStyle = "#f87171"; c.fillRect(14, 170, 40, 16); // almohada
    c.lineWidth = 4; c.strokeRect(14, 170, 142, 52);
    this.line(20, 222, 20, 258, "#1c2433", 6); this.line(136, 222, 136, 258, "#1c2433", 6);
    // escritorio + laptop (derecha)
    c.fillStyle = "#b07a4f"; c.fillRect(196, 208, 150, 14);
    this.line(204, 222, 204, 262, "#1c2433", 6); this.line(338, 222, 338, 262, "#1c2433", 6);
    c.fillStyle = "#1c2433"; c.fillRect(232, 168, 78, 42); // pantalla
    c.fillStyle = night ? "#0c4a6e" : "#38bdf8"; c.fillRect(237, 173, 68, 32);
    c.fillStyle = "#22d3ee"; c.font = "900 13px monospace"; c.textAlign = "center";
    c.fillText("</>", 271, 195);
    c.fillStyle = "#475569"; c.fillRect(222, 210, 98, 8); // base
  }

  /* --- Stickman expresivo: cara cómic + ojos que siguen el toque + gorra dev --- */
  stick(x, y, s, p) {
    p = p || {};
    const c = this.ctx;
    c.save(); c.translate(x, y); c.scale(s, s);
    if (p.faint) { c.translate(0, 34 * p.faint); c.rotate(-1.35 * p.faint); }
    if (p.lean) c.rotate(p.lean);
    const sq = p.squash || [1, 1]; c.scale(sq[0], sq[1]); // squash & stretch
    // aura dorada de éxito
    if (p.aura) { c.beginPath(); c.arc(0, -48, 58, 0, Math.PI * 2);
      c.strokeStyle = p.aura; c.lineWidth = 4; c.setLineDash([10, 7]); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.arc(0, -48, 48, 0, Math.PI * 2);
      c.strokeStyle = p.aura; c.globalAlpha = 0.5; c.lineWidth = 8; c.stroke(); c.globalAlpha = 1; }
    // cuerpo bola de grasa (rebota por el cuarto)
    if (p.ball) {
      const r = 34 * p.ball;
      c.beginPath(); c.arc(0, -40, r, 0, Math.PI * 2);
      c.fillStyle = "#fcd9a8"; c.fill(); c.lineWidth = 5; c.strokeStyle = "#1c2433"; c.stroke();
      c.beginPath(); c.arc(-r * 0.3, -40 - r * 0.35, 9 * p.ball, 0, Math.PI * 2);
      c.fillStyle = "#fff"; c.fill(); c.lineWidth = 3.5; c.strokeStyle = "#1c2433"; c.stroke();
      const lx = this.lookX * 3, ex = -r * 0.3 + lx, ey = -40 - r * 0.35;
      c.fillStyle = "#1c2433"; c.beginPath(); c.arc(ex - 3, ey, 2.4, 0, 7); c.arc(ex + 3, ey, 2.4, 0, 7); c.fill();
      c.strokeStyle = "#1c2433"; c.lineWidth = 3; c.beginPath(); c.arc(0, -40 + r * 0.4, 8, 0.2, Math.PI - 0.2); c.stroke();
      c.restore(); return;
    }
    if (p.belly > 1) { c.beginPath(); c.arc(0, -32, 12 * p.belly, 0, Math.PI * 2); // panza inflándose
      c.fillStyle = "rgba(250,204,21,.5)"; c.fill();
      c.lineWidth = 3; c.strokeStyle = "#1c2433"; c.stroke(); }
    const lL = p.legL || [-16, 46], lR = p.legR || [16, 46];
    this.line(0, -32, lL[0], lL[1], "#1c2433"); this.line(0, -32, lR[0], lR[1], "#1c2433");
    this.line(0, -74, 0, -32, "#1c2433", 7);
    const aL = p.armL || [-23, -8], aR = p.armR || [23, -8];
    this.line(0, -60, aL[0], aL[1], "#1c2433", 5); this.line(0, -60, aR[0], aR[1], "#1c2433", 5);
    if (p.holdBelly) { this.line(0, -62, -14, -28, "#1c2433", 5); this.line(0, -62, 14, -28, "#1c2433", 5); } // se agarra la panza
    const hy = p.headDrop || 0;
    this.circle(0, -98 + hy, 21, "#fff", "#1c2433", 4.5); // cabeza cómic
    // gorra dev / accesorios
    if (p.hat === "party") {
      c.fillStyle = "#ec4899";
      c.beginPath(); c.moveTo(-12, -116 + hy); c.lineTo(0, -146 + hy); c.lineTo(12, -116 + hy); c.closePath(); c.fill();
      c.lineWidth = 3; c.strokeStyle = "#1c2433"; c.stroke();
      this.circle(0, -146 + hy, 4, "#facc15", "#1c2433", 2.5);
    } else if (p.hat !== "none") {
      c.fillStyle = "#7c3aed"; c.fillRect(-20, -124 + hy, 40, 12);
      c.lineWidth = 3; c.strokeStyle = "#1c2433"; c.strokeRect(-20, -124 + hy, 40, 12);
      c.fillStyle = "#fff"; c.font = "900 9px monospace"; c.textAlign = "center";
      c.fillText("</>", 0, -115 + hy);
    }
    // ojos interactivos (siguen el último toque + parpadeo)
    const ey = -100 + hy, eye = p.eye || "normal";
    const blink = (performance.now() % 3600) < 140 && eye === "normal";
    const lx = this.lookX * 4;
    const dot = (dx, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(dx + lx, ey, r, 0, 7); c.fill(); };
    if (blink) {
      c.strokeStyle = "#1c2433"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-13, ey); c.lineTo(-3, ey); c.stroke();
      c.beginPath(); c.moveTo(3, ey); c.lineTo(13, ey); c.stroke();
    } else if (eye === "normal") {
      this.circle(-8, ey, 6.5, "#fff", "#1c2433", 3); this.circle(8, ey, 6.5, "#fff", "#1c2433", 3);
      dot(-8, 2.8, "#1c2433"); dot(8, 2.8, "#1c2433");
    } else if (eye === "happy") {
      c.strokeStyle = "#1c2433"; c.lineWidth = 3.5;
      c.beginPath(); c.arc(-8 + lx, ey + 2, 5, Math.PI, 0); c.stroke();
      c.beginPath(); c.arc(8 + lx, ey + 2, 5, Math.PI, 0); c.stroke();
    } else if (eye === "XX") {
      c.strokeStyle = "#dc2626"; c.lineWidth = 4;
      [-8, 8].forEach((dx) => { c.beginPath();
        c.moveTo(dx - 5, ey - 5); c.lineTo(dx + 5, ey + 5);
        c.moveTo(dx + 5, ey - 5); c.lineTo(dx - 5, ey + 5); c.stroke(); });
    } else if (eye === "spiral") {
      const t = performance.now() / 180;
      [-8, 8].forEach((dx, i) => { c.strokeStyle = "#a21caf"; c.lineWidth = 2.4; c.beginPath();
        for (let a = 0; a < 12; a += 0.4) { const r = 1 + a;
          const px = dx + Math.cos(a + t + i) * r, py = ey + Math.sin(a + t + i) * r;
          if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
        c.stroke(); });
    } else if (eye === "spark") { // chispas de cafeína
      this.circle(-8, ey, 6, "#fef08a", "#1c2433", 3); this.circle(8, ey, 6, "#fef08a", "#1c2433", 3);
      c.strokeStyle = "#facc15"; c.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) { const a = performance.now() / 120 + i * 1.7;
        c.beginPath(); c.moveTo(-8 + Math.cos(a) * 8, ey + Math.sin(a) * 8);
        c.lineTo(-8 + Math.cos(a) * 14, ey + Math.sin(a) * 14); c.stroke();
        c.beginPath(); c.moveTo(8 + Math.cos(a + 1) * 8, ey + Math.sin(a + 1) * 8);
        c.lineTo(8 + Math.cos(a + 1) * 14, ey + Math.sin(a + 1) * 14); c.stroke(); }
      dot(-8, 2.4, "#1c2433"); dot(8, 2.4, "#1c2433");
    } else if (eye === "dead") {
      c.strokeStyle = "#64748b"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-14, ey); c.lineTo(-2, ey); c.stroke();
      c.beginPath(); c.moveTo(2, ey); c.lineTo(14, ey); c.stroke();
    }
    // boca cómic
    c.strokeStyle = "#1c2433"; c.lineWidth = 3; c.beginPath();
    if (p.mouth === "trauma") { c.fillStyle = "#7f1d1d"; c.beginPath(); c.ellipse(0, ey + 16, 6, 9, 0, 0, 7); c.fill(); c.stroke(); }
    else if (p.mouth === "grin") { c.moveTo(-11, ey + 10); c.quadraticCurveTo(0, ey + 20, 11, ey + 10); }
    else if (p.mouth === "sad") { c.arc(0, ey + 22, 7, Math.PI * 1.15, Math.PI * 1.85); }
    else { c.moveTo(-8, ey + 12); c.quadraticCurveTo(0, ey + 16, 8, ey + 12); }
    c.stroke();
    if (p.stars) { const t = performance.now() / 280; // estrellitas girando
      for (let i = 0; i < 3; i++) { const a = t + i * 2.09;
        this.star(Math.cos(a) * 34, -128 + hy + Math.sin(a) * 10, 9); } }
    if (p.pain) { // rayo rojo de dolor
      c.strokeStyle = "#dc2626"; c.lineWidth = 4;
      const j = Math.sin(performance.now() / 55) * 4;
      c.beginPath(); c.moveTo(-26 + j, -52); c.lineTo(-14 + j, -38); c.lineTo(-26 + j, -24); c.lineTo(-14 + j, -10); c.stroke();
      this.star(-30 + j, -58, 12, "#ef4444");
    }
    c.restore();
  }

  /* ---- ESCENAS CÓMICAS 3 s (t: 0→1) ---- */
  scenes = {
    // Saltarse comidas: rugido → rayo → agarra panza → tiembla → XX → desmayo
    gastritis: (t, time) => {
      if (t < 0.3) {
        this.stick(180, 250, 1.0, { eye: "normal", mouth: "sad" });
        this.txt("GRRRRR…", 180, 120, 15 + Math.sin(time / 90) * 3, "#7f1d1d", true);
        this.txt("¡la panza ruge!", 180, 145, 12, "#7f1d1d", true);
      } else if (t < 0.52) {
        this.stick(180, 250, 1.0, { eye: "XX", pain: true, holdBelly: true, mouth: "trauma",
          lean: Math.sin(time / 70) * 0.09 });
        this.txt("¡AAAY!", 180, 110, 24, "#dc2626", true);
      } else if (t < 0.72) {
        const sh = Math.sin(time / 45) * 5;
        this.stick(180 + sh, 250, 1.0, { eye: "XX", holdBelly: true, mouth: "trauma" });
        this.speedLines(180, 230, 6, "#dc2626");
      } else {
        this.stick(180, 252, 1.0, { eye: "XX", faint: Math.min(1, (t - 0.72) / 0.28), stars: true, mouth: "trauma" });
        this.star(90, 120, 16); this.txt("¡PUM!", 90, 155, 15, "#1c2433", true);
      }
    },
    // Fast food: devora → inflado → BOLA rebotando por el cuarto
    fatball: (t, time) => {
      if (t < 0.3) {
        const k = t / 0.3;
        this.ctx.fillStyle = "#b45309"; this.ctx.fillRect(120, -70 + k * 220, 130, 60);
        this.txt("🍕", 185, -35 + k * 220, 34);
        this.stick(180, 252, 1.0, { eye: "happy", mouth: "grin" });
        this.txt("¡ÑAM ÑAM ÑAM!", 180, 110, 16, "#92400e", true);
      } else if (t < 0.55) {
        const e = (t - 0.3) / 0.25, belly = 1 + e * 1.6;
        this.stick(180, 252, 1.0, { belly: belly, eye: "happy", mouth: "grin", squash: [1 + e * 0.3, 1 - e * 0.15] });
        this.txt("¡INFLÁNDOSE…!", 180, 105, 16, "#92400e", true);
        if (Math.floor(e * 6) !== Math.floor((e - 0.04) * 6) && this.sfx.boing) this.sfx.boing();
      } else {
        const bx = 180 + Math.sin(time / 160) * 95, by = 235 - Math.abs(Math.sin(time / 210)) * 70; // rebote
        const sq = 1 + Math.sin(time / 105) * 0.12;
        this.stick(bx, by, 1.0, { ball: 1.15, squash: [sq, 2 - sq] });
        this.txt("¡BOING! ¡BOING!", 180, 100, 17, "#92400e", true);
      }
    },
    // Cafeína: vibra extremo → chispas → cae seco
    caffeine: (t, time) => {
      if (t < 0.55) {
        const v = 3 + t * 14; // vibración creciente
        this.stick(180 + Math.sin(time / 18) * v, 250, 1.0, { eye: "spark", mouth: "grin" });
        this.speedLines(190, 230, 8, "#a21caf");
        this.txt("¡BRZZZT! ¡POWER!", 180, 105, 15 + t * 8, "#a21caf", true);
      } else if (t < 0.75) {
        this.stick(180, 250, 1.0, { eye: "dead", mouth: "sad", lean: (t - 0.55) * 2 });
        this.txt("s-s-sin… batería…", 180, 110, 13, "#64748b", true);
      } else {
        this.stick(180, 255, 1.0, { eye: "dead", faint: Math.min(1, (t - 0.75) / 0.25), mouth: "sad" });
        this.txt("💤 seco.", 260, 130, 15, "#475569", true);
      }
    },
    // Hipnosis del scroll: espirales + cabeza que cae + cerebro que se apaga
    doomscroll: (t) => {
      this.stick(140, 250, 1.0, { eye: "spiral", headDrop: t * 12, armR: [42, -52],
        mouth: t > 0.6 ? "trauma" : "sad" });
      this.ctx.save(); this.ctx.shadowColor = "#e879f9"; this.ctx.shadowBlur = 22;
      this.ctx.fillStyle = "#0f172a"; this.ctx.strokeStyle = "#e879f9"; this.ctx.lineWidth = 3;
      this.ctx.fillRect(215, 160, 48, 84); this.ctx.strokeRect(215, 160, 48, 84); this.ctx.restore();
      this.txt("📱 ∞", 239, 152, 13, "#a21caf", true);
      const bat = 1 - t;
      this.ctx.fillStyle = "#1c2433"; this.ctx.fillRect(60, 90, 110, 24);
      this.ctx.fillStyle = bat > 0.5 ? "#22c55e" : "#dc2626"; this.ctx.fillRect(64, 94, 102 * bat, 16);
      this.txt("🧠 " + Math.round(bat * 100) + "%", 115, 80, 12, "#1c2433", true);
    },
    // Éxito: come → aura dorada → flex + pose victoria
    balanced: (t) => {
      this.ctx.fillStyle = "#fff"; this.ctx.beginPath();
      this.ctx.ellipse(265, 235, 52, 18, 0, 0, 7); this.ctx.fill();
      this.ctx.lineWidth = 4; this.ctx.strokeStyle = "#1c2433"; this.ctx.stroke();
      this.txt("🥗🍗", 265, 243, 22);
      const flex = t > 0.5, eat = Math.sin(t * Math.PI * 7) * 4;
      this.stick(140, 252, 1.05, { eye: "happy", mouth: "grin", aura: t > 0.3 ? (flex ? "#facc15" : "#22c55e") : null,
        headDrop: t < 0.5 ? (eat > 0 ? eat : 0) : 0, hat: "party",
        armL: flex ? [-42, -100] : [-24, -8], armR: flex ? [42, -100] : [30, -14] });
      if (flex) this.txt("¡PODER!", 140, 92, 20, "#b45309", true);
      else if (t > 0.3) this.txt("¡ñam! ¡ñam!", 140, 100, 13, "#166534", true);
    },
    zombie: (t, time) => {
      this.stick(150 + Math.sin(time / 400) * 6, 250, 1.0, { green: true,
        eye: t > 0.4 ? "dead" : "normal", mouth: "sad", lean: 0.14, armL: [-38, -30], armR: [40, -20] });
      if (t > 0.4) this.txt("🧟 ¡ZOMBI!", 180, 105, 20, "#166534", true);
      else this.txt("bostezo… x400", 180, 110, 13, "#475569", true);
    },
    recover: (t, time) => {
      const run = Math.sin(time / 130) * 11;
      this.stick(180, 252, 1.05, { eye: "happy", mouth: "grin", aura: t > 0.3 ? "#0284c7" : null,
        legL: [-17, 42 + run], legR: [17, 42 - run], armL: [28, -58], armR: [-28, -58] });
      if (t > 0.5) this.txt("¡RECARGANDO… 100%!", 180, 100, 15, "#0284c7", true);
    },
    robot: (t, time) => {
      this.ctx.fillStyle = "#475569"; this.ctx.fillRect(40, 130, 76, 92);
      this.ctx.fillStyle = "#22d3ee"; this.ctx.fillRect(52, 146, 52, 30);
      this.txt("IA", 78, 168, 14, "#0f172a");
      if (t > 0.3) { this.ctx.strokeStyle = "#e879f9"; this.ctx.lineWidth = 4; this.ctx.setLineDash([9, 6]);
        this.ctx.beginPath(); this.ctx.moveTo(116, 160); this.ctx.lineTo(200, 200); this.ctx.stroke(); this.ctx.setLineDash([]);
        this.txt("¡500 KCAL!", 160, 175, 12, "#a21caf", true); }
      if (t < 0.55) { this.stick(250, 252, 0.95, { mouth: "sad" }); this.txt("🥬", 250, 190, 24); }
      else this.stick(250 + Math.sin(time / 50) * 5, 252, 0.95,
        { eye: "XX", faint: Math.min(1, (t - 0.55) / 0.3), mouth: "trauma", stars: t > 0.8 });
    },
    sleepWin: (t) => {
      this.ctx.fillStyle = "#312e81"; this.ctx.fillRect(30, 200, 300, 60);
      this.stick(180, 235, 1.0, { eye: "happy", mouth: "grin", hat: "none" });
      this.txt("Z", 225, 130, 16, "#64748b", true); this.txt("Z", 242, 105, 24, "#475569", true);
      if (t > 0.5) this.txt("¡A MIMIR! 😴", 180, 90, 17, "#312e81", true);
    },
    snackVoid: (t, time) => { // refinados vacíos: come aire y sigue con hambre
      if (t < 0.5) {
        this.stick(150, 252, 1.0, { eye: "happy", mouth: "grin", armR: [34, -70 + Math.sin(time / 120) * 8] });
        this.txt("🍘 ¡ñam! ¡ñam! ¡ñam!", 180, 110, 15, "#92400e", true);
        this.txt("¿y lo llenador?…", 180, 135, 12, "#64748b", true);
      } else {
        this.stick(150, 252, 1.0, { eye: "normal", mouth: "sad", headDrop: 8 });
        this.txt("GRRR… ¡sigo con hambre!", 180, 110, 14, "#7f1d1d", true);
      }
    },
    pills: (t, time) => { // pastillas sin receta: mareo y caída atontada
      if (t < 0.55) {
        this.stick(180 + Math.sin(time / 90) * 6, 252, 1.0, { eye: "spiral", mouth: "sad", lean: Math.sin(time / 200) * 0.12 });
        this.txt("💊 todo da vueltas…", 180, 108, 14, "#6d28d9", true);
      } else {
        this.stick(180, 254, 1.0, { eye: "XX", faint: Math.min(1, (t - 0.55) / 0.3), mouth: "sad", stars: t > 0.8 });
        this.txt("¡PLAF! atontado.", 180, 105, 14, "#6d28d9", true);
      }
    },
    paralysis: (t, time) => {
      this.ctx.save(); this.ctx.translate(Math.sin(time / 55) * 6, 0);
      this.stick(180, 252, 1.0, { eye: "XX", mouth: "trauma" }); this.ctx.restore();
      this.txt("¡8… 0… TARDE!", 180, 105, 18, "#dc2626", true);
    },
  };

  /** Carril vacío: habitación apagada + silueta "?" quieta (sin rAF). */
  drawEmpty(room, day) {
    this.cancel();
    this.room(room, day);
    this.ctx.save();
    this.ctx.globalAlpha = 0.35;
    this.stick(110, 150, 1.1, { eye: "normal", mouth: "sad", hat: "none" });
    this.ctx.restore();
    this.txt("?", 110, 70, 34, "#1c2433", true);
    this.txt("— SIN CONECTAR —", 110, 185, 11, "#1c2433", true);
  }

  /** Pose viva mientras el jugador decide. */
  startIdle(room, day) {
    this.cancel();
    const loop = () => {
      this.idleT += 0.03;
      this.room(room, day);
      this.stick(180, 252, 1.05, { headDrop: Math.sin(this.idleT) * 2.5,
        armL: [-25 + Math.sin(this.idleT) * 3, -8], armR: [25 - Math.sin(this.idleT) * 3, -8] });
      this.txt("▼ toca una foto ▼", 180, 322, 12, "#1c2433", true);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Cinemática 3 s + sello gigante FAIL/SUCCESS. Resuelve al terminar.
   * @param {string} sceneId clave de `scenes`
   * @param {{fail: boolean, stamp: string}} outcome
   * @param {string} room fondo de la ronda activa
   * @param {string} day "DÍA" | "TARDE" | "NOCHE"
   * @param {boolean} [showStamp=true] el proyector lo apaga (mini-canvas)
   */
  play(sceneId, outcome, room, day, showStamp = true) {
    this.cancel();
    const DUR = 3000, STAMP_AT = 2280, t0 = performance.now();
    return new Promise((resolve) => {
      const frame = (now) => {
        const el = now - t0, t = Math.min(1, el / DUR);
        this.clear(); this.room(room, day);
        (this.scenes[sceneId] || this.scenes.paralysis)(t, el);
        if (showStamp && el >= STAMP_AT) { // sello gigante estilo Stick Story
          const k = Math.min(1, (el - STAMP_AT) / 320), c = this.ctx;
          const bad = outcome.fail, col = bad ? "#dc2626" : "#16a34a";
          c.save();
          if (bad) c.translate(Math.sin(el / 38) * 5, 0);
          c.fillStyle = bad ? "rgba(220,38,38,.13)" : "rgba(22,163,74,.13)";
          c.fillRect(0, 0, this.W, this.H);
          if (!bad) for (let i = 0; i < 18; i++) { const a = el / 480 + i * 0.35;
            this.star(180 + Math.cos(a) * (60 + k * 100), 165 + Math.sin(a) * (50 + k * 75), 8, "#fde047"); }
          else this.star(180, 165, 60 + k * 26, "rgba(220,38,38,.35)");
          c.save(); c.translate(180, 165); c.rotate(-0.1);
          const sc = 0.55 + k * 0.45; c.scale(sc, sc); c.globalAlpha = Math.min(1, k * 1.4);
          c.fillStyle = "#fdf6e3"; c.strokeStyle = col; c.lineWidth = 9;
          const lines = outcome.stamp.split("\n");
          const hh = lines.length * 34 + 36;
          c.beginPath(); c.rect(-168, -hh / 2, 336, hh); c.fill(); c.stroke();
          c.fillStyle = col; c.textAlign = "center";
          lines.forEach((ln, i) => { c.font = '900 27px "Comic Sans MS", cursive, sans-serif';
            c.fillText(ln, 0, -hh / 2 + 44 + i * 34); });
          c.restore(); c.restore();
        }
        if (t < 1) this.raf = requestAnimationFrame(frame);
        else resolve();
      };
      this.raf = requestAnimationFrame(frame);
    });
  }
}

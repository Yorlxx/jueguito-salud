/* =====================================================================
 * CORE · Estado global del juego (fuente única de verdad, serializable).
 * Gestiona: 3 Vidas, Reloj de 8 s, Peso (kg), Errores y Grupo del celular.
 * Reglas: opción mala (fail) = -1 vida · sana = vidas intactas.
 * `toPayload()` serializa la fila que se sincroniza a Supabase (players).
 * ===================================================================== */

export const MAX_LIVES = 3;
export const ROUND_SECONDS = 8;

const INITIAL = Object.freeze({
  lives: MAX_LIVES,
  errors: 0,
  weight: 70.0,
  roundIndex: 0,
  debuff: null, // secuela encadenada ("gastritis" | "hipoglucemia" | null)
  groupName: null, // "Grupo 1"…"Grupo 4" (lo elige el jugador en su teléfono)
});

export class GameState {
  constructor() { this.reset(); }

  /** Vuelve al estado inicial (botón Reintentar). Conserva el grupo. */
  reset() {
    const g = this.groupName;
    Object.assign(this, { ...INITIAL });
    this.groupName = g;
  }

  /** ¿Se quedó sin vidas? → game over inmediato. */
  get isDead() { return this.lives <= 0; }

  /** Identidad del celular para el leaderboard en vivo. */
  setGroup(name) { this.groupName = name; }

  /**
   * Aplica una opción al estado. El dominó oculto (secuela + comida
   * pesada) solo agrava el relato: la pérdida siempre es 1 vida.
   * @returns {{lost: number, domino: boolean}}
   */
  applyChoice(opt) {
    const domino = !!(this.debuff && opt.heavy);
    let lost = 0;
    if (opt.fail || (opt.errors || 0) > 0) {
      this.lives = Math.max(0, this.lives - 1);
      lost = 1;
    }
    this.errors += opt.errors || 0;
    this.weight = Math.round((this.weight + (opt.weight || 0)) * 10) / 10;
    if ("setDebuff" in opt) this.debuff = opt.setDebuff; // null = limpia la secuela
    return { lost, domino };
  }

  /** Fila lista para `players` (upsert por `group_name`). */
  toPayload() {
    return {
      group_name: this.groupName,
      lives: this.lives,
      weight_kg: this.weight,
      errors: this.errors,
      current_round: Math.min(this.roundIndex + 1, 8),
    };
  }
}

/** Instancia compartida (singleton) que orquesta main.js. */
export const state = new GameState();

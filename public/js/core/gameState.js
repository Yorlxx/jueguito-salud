/* =====================================================================
 * CORE · Estado global del juego (fuente única de verdad, serializable).
 * Gestiona: Puntos Kahoot, Reloj de 15 s, Peso (kg), Errores, Sala y Jugador.
 * Reglas: acierto = 500 base + hasta 500 por velocidad · fallo/timeout = 0.
 * Todos completan todas las rondas (sin eliminación).
 * `toPayload()` serializa la fila que se sincroniza a Supabase (players).
 * ===================================================================== */

export const MAX_POINTS = 1000; // tope por ronda (estilo Kahoot)
export const ROUND_SECONDS = 15;

const INITIAL = Object.freeze({
  points: 0,
  errors: 0,
  weight: 70.0,
  roundIndex: 0,
  sessionId: null, // UUID de la sala (null = práctica local)
  playerName: null, // nombre libre del equipo o alumno
  result: "ACTIVE", // ACTIVE | FINISHED (columna players.status)
});

export class GameState {
  constructor() { this.reset(); }

  /** Vuelve al estado inicial. Conserva sala + nombre (botón Reintentar). */
  reset() {
    const s = this.sessionId, n = this.playerName;
    Object.assign(this, { ...INITIAL });
    this.sessionId = s;
    this.playerName = n;
  }

  /** Identidad del celular dentro de la sala. */
  setIdentity(sessionId, playerName) {
    this.sessionId = sessionId;
    this.playerName = playerName;
  }

  /**
   * Aplica una opción al estado.
   * @param {object} opt opción elegida (fail/errors/weight)
   * @param {number} timeLeft segundos restantes al responder (velocidad)
   * @param {number} mult multiplicador del nivel (1 / 1.5 / 2)
   * @returns {{gained: number}} puntos ganados esta ronda
   */
  applyChoice(opt, timeLeft = 0, mult = 1) {
    const speed = Math.max(0, Math.min(1, timeLeft / ROUND_SECONDS));
    const gained = opt.fail ? 0 : Math.round((500 + 500 * speed) * mult);
    this.points += gained;
    this.errors += opt.errors || 0;
    this.weight = Math.round((this.weight + (opt.weight || 0)) * 10) / 10;
    return { gained };
  }

  /** Fila lista para `players` (upsert por session_id + player_name). */
  toPayload(totalRounds = 8) {
    return {
      session_id: this.sessionId,
      player_name: this.playerName,
      points: this.points,
      weight_kg: this.weight,
      errors: this.errors,
      current_round: Math.min(this.roundIndex + 1, totalRounds),
      status: this.result,
    };
  }
}

/** Instancia compartida (singleton) que orquesta main.js. */
export const state = new GameState();

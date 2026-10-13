/* =====================================================================
 * CORE · Cliente Supabase (realtime admin ↔ celulares).
 * 1. Crea tu proyecto en https://supabase.com → copia URL + anon key.
 * 2. Pégalas abajo y ejecuta `database_schema.sql` en el SQL Editor.
 * 3. Sin configurar, el juego sigue funcionando 100 % en local.
 * ===================================================================== */

import { createClient } from "@supabase/supabase-js";

// ── Configuración: variables de entorno de Vite ──
// Crea tu archivo `.env.local` (ver `.env.example`) con tus credenciales.
// Sin configurar, el juego sigue funcionando 100 % en local.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/** ¿Hay credenciales reales? Si no, todo Supabase se omite en silencio. */
export function isSupabaseConfigured() {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.length > 20
  );
}

/** Cliente compartido (`null` si no está configurado). */
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

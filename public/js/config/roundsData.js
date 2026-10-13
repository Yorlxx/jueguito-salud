/* =====================================================================
 * CONFIG · 8 rondas CON TRAMPA (títulos engañosos en UI; stats solo aquí).
 * Cada opción: ícono vectorial (emoji) + explicación de salud. Sin spoilers
 * numéricos en pantalla: la UI solo muestra `label` + `icon`.
 * ===================================================================== */

export const ROUNDS = [
  { clock: "07:30 AM", room: "bedroom", day: "DÍA", tape: "RONDA 1 · 07:30 AM",
    scene: "CELDA 01 · HABITACIÓN", narrative: "¡Suena la alarma! La cocina y el celu pelean por tu atención. ¡Tienes 8 segundos!",
    options: [
      { icon: "🥤", label: "Energizante Zero ¡sin azúcar!", name: "energizante zero", errors: 1, weight: 0, scene: "caffeine", fail: true, setDebuff: "gastritis",
        stamp: "FAIL ❌ ¡ACIDEZ Y ANSIEDAD!", bio: "¡Trampa! El 'zero azúcar' igual irrita el estómago vacío y la cafeína dispara la ansiedad." },
      { icon: "📱", label: "Notificaciones ¡solo 20 min!", name: "notificaciones", errors: 1, weight: 0, scene: "doomscroll", fail: true, setDebuff: "hipoglucemia",
        stamp: "FAIL ❌ ¡HIPNOSIS Y SIN AGUA!", bio: "20 minutos que se comen la mañana: ni agua ni desayuno. ¡Glucosa por el suelo!" },
      { icon: "💧", label: "Agua + Desayuno power", name: "agua y desayuno", errors: 0, weight: 0, scene: "balanced", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡ENERGÍA ESTABLE!", bio: "¡Agua + proteína y fibra! Hidratación y combustible real por horas." },
    ] },
  { clock: "09:30 AM", room: "bedroom", day: "DÍA", tape: "RONDA 2 · 09:30 AM",
    scene: "CELDA 02 · UNIVERSIDAD", narrative: "Receso en la U. El kiosco presume etiquetas 'fit'… ¡lee la letra chica!",
    options: [
      { icon: "🍫", label: "Barra 'Fit' comercial", name: "barra fit", errors: 1, weight: 0.5, scene: "doomscroll", fail: true, heavy: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡PICO Y CAÍDA DE GLUCOSA!", bio: "¡Trampa! La barra 'fit' esconde 25 g de azúcar: subidón y crash con niebla mental." },
      { icon: "🥜", label: "Frutos secos + Manzana", name: "frutos secos", errors: 0, weight: 0, scene: "balanced", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡ENERGÍA ESTABLE!", bio: "¡Grasas buenas + fibra real! Saciedad de verdad, sin crash." },
      { icon: "🍘", label: "Galletas saladas 'ligeras'", name: "galletas saladas", errors: 1, weight: 0.3, scene: "snackVoid", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡HAMBRE FANTASMA!", bio: "Refinados sin fibra ni proteína: comes y comes… ¡y sigues con hambre!" },
    ] },
  { clock: "01:00 PM", room: "desk", day: "DÍA", tape: "RONDA 3 · 01:00 PM",
    scene: "CELDA 03 · ESCRITORIO", narrative: "¡5 horas codeando! El almuerzo no se negocia… aunque una pastilla lo prometa.",
    options: [
      { icon: "💊", label: "Pastilla milagrosa ¡sin pausar!", name: "pastilla", errors: 2, weight: -1.5, scene: "gastritis", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡GASTRITIS Y BAJA GLUCOSA!", bio: "¡Trampa mortal! Las vitaminas NO son comida: acidez severa, gastritis y desmayo." },
      { icon: "🍔", label: "Combo XL ¡bien rendidor!", name: "fast food", errors: 1, weight: 2.5, scene: "fatball", fail: true, heavy: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡EXCESO DE ULTRAPROCESADOS!", bio: "Grasa saturada frente al monitor: somnolencia total y peso descompensado." },
      { icon: "🥗", label: "Pausa 20 min + Menú casero", name: "menú sano", errors: 0, weight: 0, scene: "balanced", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡ENERGÍA ESTABLE!", bio: "¡Proteína + carbohidrato complejo! Aura dorada y tarde productiva." },
    ] },
  { clock: "04:00 PM", room: "desk", day: "TARDE", tape: "RONDA 4 · 04:00 PM",
    scene: "CELDA 04 · SETUP", narrative: "La bajona de la tarde pega fuerte. El café con jarabe te guiña el ojo…",
    options: [
      { icon: "☕", label: "Café doble ¡con jarabe!", name: "café doble", errors: 1, weight: 0, scene: "caffeine", fail: true, setDebuff: "gastritis",
        stamp: "FAIL ❌ ¡SOBREESTIMULADO!", bio: "Azúcar + cafeína doble: insulina por las nubes, temblor y crash brutal." },
      { icon: "🍦", label: "Yogur + Fruta y maní", name: "yogur", errors: 0, weight: 0, scene: "balanced", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡ENERGÍA ESTABLE!", bio: "¡Proteína + grasa buena! Energía pareja hasta la noche." },
      { icon: "🍬", label: "Gomitas 'sin grasa'", name: "gomitas", errors: 1, weight: 0.4, scene: "doomscroll", fail: true, heavy: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡AZÚCAR DISFRAZADO!", bio: "¡Trampa! 'Sin grasa' = puro azúcar refinado: pico, crash y más antojo." },
    ] },
  { clock: "06:30 PM", room: "desk", day: "TARDE", tape: "RONDA 5 · 06:30 PM",
    scene: "CELDA 05 · POST-CLASES", narrative: "Salen las clases. La cena decide si duermes… o si la panza te despierta.",
    options: [
      { icon: "🎮", label: "¡Una partidita más!", name: "saltar cena", errors: 2, weight: -0.8, scene: "gastritis", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡GASTRITIS NOCTURNA!", bio: "Saltarse la cena por jugar: el músculo se pierde y el descanso se arruina." },
      { icon: "🥘", label: "Cena ligera proteica", name: "cena ligera", errors: 0, weight: 0, scene: "balanced", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡ENERGÍA ESTABLE!", bio: "¡Proteína + verduras! Reparación muscular y sueño de campeón." },
      { icon: "🍕", label: "Pizza XL ¡a las 10 PM!", name: "pizza noche", errors: 1, weight: 1.5, scene: "fatball", fail: true, heavy: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡REFLUJO E INSOMNIO!", bio: "Cena pesada de noche: reflujo, insomnio y la panza rebota hasta dormirse." },
    ] },
  { clock: "08:30 PM", room: "desk", day: "TARDE", tape: "RONDA 6 · 08:30 PM",
    scene: "CELDA 06 · GIMNASIO", narrative: "Hora de moverse… pero el cuerpo viene sin combustible. ¡Elige sabio!",
    options: [
      { icon: "🏋️", label: "¡HIIT brutal 1 hora!", name: "hiit", errors: 1, weight: -0.5, scene: "gastritis", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡CATABOLISMO Y COLAPSO!", bio: "¡Trampa! Hierro pesado sin comer: mareos, el músculo se quema y ¡al suelo!" },
      { icon: "🧘", label: "Estirar + Caminar 15 min", name: "pausa activa", errors: 0, weight: 0, scene: "recover", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡RECARGA TOTAL!", bio: "¡Pausa activa perfecta! Circulación, oxígeno y cero lesiones." },
      { icon: "🛋️", label: "Sillón + Pantallas", name: "sillón", errors: 1, weight: 0.3, scene: "zombie", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡MODO ZOMBI!", bio: "¡Echado 3 horas! La espalda se oxida y el cerebro se apaga." },
    ] },
  { clock: "10:30 PM", room: "bedroom", day: "NOCHE", tape: "RONDA 7 · 10:30 PM",
    scene: "CELDA 07 · LABORATORIO IA", narrative: "La IA te vende milagros y el algoritmo te espía el antojo…",
    options: [
      { icon: "🤖", label: "¡Detox IA 500 kcal!", name: "detox ia", errors: 2, weight: -1.2, scene: "robot", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡DESNUTRICIÓN Y REBOTE!", bio: "¡Trampa! 500 kcal dictadas por un bot: desnutrición y rebote grave." },
      { icon: "📋", label: "IA + Nutricionista real", name: "ia responsable", errors: 0, weight: 0, scene: "balanced", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡PLAN INTELIGENTE!", bio: "¡La IA propone y el profesional dispone! Hábito sostenible desbloqueado." },
      { icon: "💊", label: "Suplementos 'virales'", name: "suplementos", errors: 1, weight: 0, scene: "robot", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡FRAUDE ALGORÍTMICO!", bio: "¡Píldoras milagro del algoritmo! Ni nutren ni adelgazan: solo vacían tu bolsillo." },
    ] },
  { clock: "11:50 PM", room: "bedroom", day: "NOCHE", tape: "RONDA 8 · 11:50 PM",
    scene: "CELDA 08 · DORMITORIO", narrative: "Última escena. El celu brilla en la oscuridad… ¡cierra el día como campeón!",
    options: [
      { icon: "📱", label: "¡Un videíto más!", name: "doomscrolling", errors: 1, weight: 0, scene: "doomscroll", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡MELATONINA BLOQUEADA!", bio: "Doomscrolling nocturno: la luz azul inhibe la melatonina. ¡Mañana zombi!" },
      { icon: "🌙", label: "Adiós pantallas ¡a mimir!", name: "descanso", errors: 0, weight: 0, scene: "sleepWin", fail: false, setDebuff: null,
        stamp: "SUCCESS ✅ ¡DESCANSO DE ORO!", bio: "¡30 min sin pantallas + 8 horas de sueño! Reparación total activada." },
      { icon: "💊", label: "Pastilla para dormir", name: "pastilla dormir", errors: 1, weight: 0, scene: "pills", fail: true, keepDebuff: true,
        stamp: "FAIL ❌ ¡NO TE AUTOMEDIQUES!", bio: "¡Trampa! Pastillas sin receta: atontan, no descansan y crean dependencia." },
    ] },
];

/** Fallo automático cuando el temporizador llega a 0. */
export const TIMEOUT = { icon: "😱", name: "estrés", errors: 2, weight: 0, scene: "paralysis",
  fail: true, keepDebuff: true, stamp: "FAIL ❌ ¡PARÁLISIS POR ESTRÉS!",
  bio: "¡8 segundos mirando al vacío! El estrés elige… ¡y elige mal!" };

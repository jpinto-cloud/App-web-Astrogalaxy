// ============================================================
//  Astrogalaxy — Conexión a la base de datos (Firebase Firestore)
// ============================================================
//  Lee el ranking y las estadísticas globales desde Firestore y
//  actualiza la página en vivo. Si Firebase no está configurado
//  todavía, la página conserva sus datos de demostración.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ¿Ya configuró el usuario sus credenciales reales?
const configurado = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("TU_");

if (!configurado) {
  console.info("[Astrogalaxy] Firebase aún no configurado: se muestran datos de demostración. Edita firebase-config.js para conectar la base de datos.");
} else {
  arrancar();
}

async function arrancar() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    await Promise.all([cargarRanking(db), cargarStats(db)]);
    console.info("[Astrogalaxy] Datos cargados desde Firebase Firestore ✔");
  } catch (err) {
    console.error("[Astrogalaxy] No se pudo conectar a Firebase, se usan datos de demostración:", err);
  }
}

// ---- Ranking de aulas (colección "leaderboard") -------------
async function cargarRanking(db) {
  const cont = document.getElementById("leaderboard-list");
  if (!cont) return;

  const q = query(collection(db, "leaderboard"), orderBy("points", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) return; // sin datos → conserva la demo

  const filas = [];
  snap.forEach((d) => filas.push(d.data()));

  cont.innerHTML = filas.map((g, i) => filaRanking(g, i + 1)).join("");
}

function filaRanking(g, pos) {
  const fmt = (n) => Number(n).toLocaleString("es-ES");
  const sub = `${g.retos} retos · ${g.nfts} NFTs`;
  const titulo = `${g.grade} · ${g.school}`;

  if (pos === 1) {
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:linear-gradient(120deg,#06281A,#0C3D2A);">
        <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:700;color:#FDE68A;width:24px;">1</span>
        <div style="flex:1;"><div style="font-size:15px;font-weight:700;color:#fff;">${titulo}</div><div style="font-size:12.5px;color:#A7C7B6;">${sub}</div></div>
        <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:700;color:#6EE7B7;">${fmt(g.points)}</span>
      </div>`;
  }
  const colores = { 2: "#D97706", 3: "#9AA59B" };
  const numColor = colores[pos] || "#C4CDC2";
  const ptsColor = pos <= 3 ? "#0D6B4F" : "#4A6151";
  const ptsSize = pos <= 3 ? "17px" : "16px";
  const numSize = pos <= 3 ? "17px" : "16px";
  const borde = pos < 4 ? "border-bottom:1px solid #EEF2EC;" : "";
  return `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;${borde}">
        <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:${numSize};font-weight:700;color:${numColor};width:24px;">${pos}</span>
        <div style="flex:1;"><div style="font-size:15px;font-weight:600;color:#13241B;">${titulo}</div><div style="font-size:12.5px;color:#7A8C7E;">${sub}</div></div>
        <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:${ptsSize};font-weight:700;color:${ptsColor};">${fmt(g.points)}</span>
      </div>`;
}

// ---- Estadísticas globales (documento "stats/global") -------
async function cargarStats(db) {
  const ref = doc(db, "stats", "global");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const s = snap.data();
  const fmt = (n) => Number(n).toLocaleString("es-ES");
  const mapa = {
    320: s.escuelas,
    48000: s.estudiantes,
    18500: s.nfts,
    86: s.co2
  };
  document.querySelectorAll("#stats [data-target]").forEach((el) => {
    const base = parseFloat(el.getAttribute("data-target"));
    const val = mapa[base];
    if (val != null) {
      el.setAttribute("data-target", val);
      el.textContent = fmt(val);
    }
  });
}

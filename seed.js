// ============================================================
//  Astrogalaxy — Cargar datos semilla en Firestore
// ============================================================
//  Sube el contenido de seed-data.json a tu base de datos.
//
//  Requisitos (una sola vez):
//    1. npm install firebase-admin
//    2. En la consola de Firebase: Configuración del proyecto →
//       Cuentas de servicio → "Generar nueva clave privada".
//       Guarda el archivo como  serviceAccountKey.json  en esta carpeta.
//
//  Ejecutar:
//    node seed.js
// ============================================================

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-data.json"), "utf8"));

async function run() {
  // stats/global
  for (const [docId, value] of Object.entries(data.stats)) {
    await db.collection("stats").doc(docId).set(value);
    console.log("stats/" + docId + " ✔");
  }
  // leaderboard/*
  for (const row of data.leaderboard) {
    const { id, ...rest } = row;
    await db.collection("leaderboard").doc(id).set(rest);
    console.log("leaderboard/" + id + " ✔");
  }
  console.log("\nListo. Datos cargados en Firestore.");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });

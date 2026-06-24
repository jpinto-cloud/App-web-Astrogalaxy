// ============================================================
//  Astrogalaxy — Cloud Function: verificar evidencia con IA
//  Modelo de visión: Claude Sonnet (Anthropic)
// ============================================================
//  Recibe { challenge, image (base64), mime } desde la app,
//  llama a Claude Sonnet y responde si la foto cumple el reto.
//  La clave vive segura en el servidor (nunca en el navegador):
//
//    firebase functions:secrets:set ANTHROPIC_API_KEY
//      (pega tu clave de https://console.anthropic.com)
//
//  Desplegar:  firebase deploy --only functions
//  (requiere plan Blaze de Firebase)
// ============================================================

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

// Modelo Claude Sonnet con visión
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

exports.verifyEvidence = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Usa POST" }); return; }

    try {
      const { challenge, image, mime } = req.body || {};
      if (!challenge || !image) {
        res.status(400).json({ error: "Faltan 'challenge' o 'image'" });
        return;
      }

      const prompt =
        'Eres el verificador de retos ambientales de Astrogalaxy. ' +
        'El estudiante debía cumplir este reto: "' + challenge + '". ' +
        'Analiza la foto de evidencia y decide si la acción mostrada corresponde realmente al reto. ' +
        'Sé estricto: si la foto NO muestra una acción ambiental real y coherente con el reto, recházala (cumple=false) y no se otorgarán puntos. ' +
        'Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma exacta: ' +
        '{"ai_verified": true|false, "confidence": 0.0-1.0, "action": "texto corto de lo detectado", "message": "una frase de retroalimentación para el estudiante"}.';

      // Llamada a la API de Anthropic (Claude Sonnet, con visión)
      const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY.value(),
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 400,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mime || "image/jpeg", data: image } },
              { type: "text", text: prompt }
            ]
          }]
        })
      });

      if (!aiResp.ok) {
        const detail = await aiResp.text();
        res.status(502).json({ error: "Error de la IA", detail });
        return;
      }

      const data = await aiResp.json();
      const text = (data.content && data.content[0] && data.content[0].text) || "";
      const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const verdict = JSON.parse(jsonStr);

      res.json({
        ai_verified: !!verdict.ai_verified,
        confidence: Math.max(0, Math.min(1, Number(verdict.confidence) || 0)),
        action: verdict.action || "Acción detectada",
        message: verdict.message || ""
      });
    } catch (err) {
      res.status(500).json({ error: "No se pudo verificar", detail: String(err) });
    }
  }
);

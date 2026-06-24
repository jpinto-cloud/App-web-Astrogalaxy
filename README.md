# Astrogalaxy 🌱✨ — Web app con Firebase

Landing de **Astrogalaxy**: retos ambientales escolares con evidencia verificada
por IA, puntos, NFTs y ranking por grados o individual. La página lee el
**ranking** y las **estadísticas** en vivo desde **Firebase Firestore**.

## Lenguajes y tecnología
- **HTML5 / CSS3 / JavaScript** — interfaz de la página.
- **JavaScript (módulos ES)** — conexión a la base de datos.
- **Firebase Firestore** — base de datos en la nube (ranking + estadísticas).
- **Firebase Hosting** — despliegue de la web.

## Estructura
```
.
├── index.html              Estructura de la página
├── style.css               Estilos
├── script.js               Interacciones (menú, dashboard, contadores)
├── firebase-config.js      ← PEGA AQUÍ tus credenciales de Firebase
├── firebase.js             Lee ranking + stats desde Firestore
├── firebase.json           Config de Hosting + Functions
├── functions/              Cloud Function de IA (verifyEvidence)
│   ├── index.js
│   └── package.json
├── .firebaserc             Alias del proyecto
├── firestore.rules         Reglas de seguridad
├── firestore.indexes.json  Índices
└── seed/
    ├── seed-data.json      Datos de ejemplo
    └── seed.js             Script para subirlos a Firestore
```

> Si **no** configuras Firebase, la página funciona igual con datos de
> demostración. Al configurarlo, el ranking y las estadísticas vienen de la BD.

---

## 🚀 Desplegar en Firebase Hosting (paso a paso)

### 1. Crear el proyecto en Firebase
1. Entra a <https://console.firebase.google.com> y crea un proyecto.
2. Crea una base de datos **Firestore** (modo producción).
3. Agrega una app **Web (</>)** y copia el objeto `firebaseConfig`.

### 2. Conectar la página a tu base de datos
Abre **`firebase-config.js`** y reemplaza los valores `TU_...` por los reales
que copiaste. Pon también tu `projectId` en **`.firebaserc`**.

### 3. Instalar la CLI de Firebase (una sola vez)
```bash
npm install -g firebase-tools
firebase login
```

### 4. Cargar los datos de ejemplo en Firestore (opcional pero recomendado)
```bash
cd seed
npm install firebase-admin
# Descarga serviceAccountKey.json desde:
# Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
node seed.js
cd ..
```

### 5. Publicar las reglas y la web
```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

Al terminar, la CLI te dará tu URL pública, por ejemplo:
`https://TU_PROYECTO.web.app` 🎉

---

## Probar en local
```bash
firebase serve        # o abre index.html con un servidor estático
```
Abrir `index.html` directamente con doble clic también funciona, pero algunos
navegadores bloquean los módulos por CORS; usa un servidor local si ves errores.

---

## 🤖 Verificación de evidencia por IA (Claude Sonnet)

Cada reto tiene un botón **"Empezar reto" → "📷 Subir evidencia"**. Al subir la
foto, se llama a **Claude Sonnet** (modelo de visión de Anthropic) que decide si
la imagen cumple el reto. **Si la foto NO corresponde al reto, se rechaza y NO se
otorgan puntos.** Si la aprueba, otorga puntos + NFT y marca el reto cumplido.

La función `askAI()` en `script.js` busca un verificador en este orden:

1. **Claude Sonnet** vía tu **Cloud Function** (`window.AG_VERIFY_URL`) — recomendado.
2. **IA integrada del entorno de previsualización** (`window.claude`).
3. **Google Gemini** (`window.AG_GEMINI_KEY`) — alternativa directa opcional.
4. **Respaldo local** — si nada está disponible, modo demostración.

---

## ⭐ Conectar Claude Sonnet (recomendado)

La clave de Claude debe vivir en un servidor (nunca en el navegador), por eso se
usa la **Cloud Function** incluida en `functions/index.js`, que ya llama a
`claude-sonnet`.

```bash
# 1. Instalar dependencias de la función
cd functions && npm install && cd ..

# 2. Guardar tu clave de Anthropic como secreto (no se sube al repo)
firebase functions:secrets:set ANTHROPIC_API_KEY
#   (pega tu clave de https://console.anthropic.com)

# 3. Desplegar la función  (requiere plan Blaze de Firebase)
firebase deploy --only functions
```

Copia la URL que te da la CLI
(`https://us-central1-TU_PROYECTO.cloudfunctions.net/verifyEvidence`) y pégala en
**`script.js`**, en la línea de arriba:

```js
window.AG_VERIFY_URL = window.AG_VERIFY_URL || "https://us-central1-TU_PROYECTO.cloudfunctions.net/verifyEvidence";
```

Vuelve a desplegar el hosting (`firebase deploy --only hosting`) y listo: cada
foto se verifica con Claude Sonnet. ✨

---

## 👩‍🏫 Revisión docente (re-verificación)

Si la IA **rechaza** una evidencia, el estudiante puede pulsar **"Solicitar
revisión de un maestro"**. La solicitud aparece en la sección **Revisión** de la
página. Un docente activa la casilla **"Soy docente"** y puede **Aprobar** o
**Rechazar** la evidencia; si la aprueba, se otorgan los puntos y la NFT.

---

## (Alternativa) Google Gemini directo, sin backend

Gemini tiene capa gratuita y se llama directo desde la web (sirve incluso en
GitHub Pages). Obtén una clave en <https://aistudio.google.com/app/apikey> y
pégala en `script.js`:

```js
window.AG_GEMINI_KEY = window.AG_GEMINI_KEY || "AIza...tu_clave";
```

> 🔒 Si usas Gemini, restringe la clave por dominio en
> <https://console.cloud.google.com/apis/credentials> (Restricciones de
> aplicación → Sitios web) para que solo funcione desde tu sitio.
>
> Mientras no configures ninguna IA, la app usa el motor de demostración.

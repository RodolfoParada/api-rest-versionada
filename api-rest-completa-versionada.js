// =====================================================================================
// API REST VERSIONADA EN UN SOLO ARCHIVO
// Incluye:
// - JWT Authentication
// - Rate Limiting
// - Logging (morgan + winston)
// - OpenAPI con Swagger UI
// - Webhooks para productos
// =====================================================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const bodyParser = require('body-parser');

// ---------------------------------------------------------------------------
// 1. CONFIGURACIÓN GENERAL
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(bodyParser.json());

// Rate Limiting global
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: "Too many requests, try again later."
}));

// Logging
app.use(morgan("combined"));
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs.log' })
    ],
});

const SECRET = "MI_SECRETO_SUPER_SEGURO";

// ---------------------------------------------------------------------------
// 2. AUTENTICACIÓN JWT
// ---------------------------------------------------------------------------
function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Token requerido" });

    const token = header.split(" ")[1];

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: "Token inválido" });
    }
}

app.post("/auth/login", (req, res) => {
    const { user, pass } = req.body;

    // Demo simple
    if (user === "admin" && pass === "secret") {
        const token = jwt.sign({ user: "admin" }, SECRET, { expiresIn: "2h" });
        return res.json({ token });
    }

    return res.status(401).json({ error: "Credenciales inválidas" });
});

// ---------------------------------------------------------------------------
// 3. WEBHOOKS
// ---------------------------------------------------------------------------
let webhooks = [];

app.post("/webhooks", authRequired, (req, res) => {
    const { url, events } = req.body;
    if (!url || !events) return res.status(400).json({ error: "Datos inválidos" });

    webhooks.push({ url, events });
    logger.info("Webhook agregado: " + url);
    res.json({ message: "Webhook registrado" });
});

async function notifyWebhooks(event, data) {
    for (const hook of webhooks) {
        if (hook.events.includes(event)) {
            fetch(hook.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event, data })
            }).catch(() => logger.error("Error enviando webhook a " + hook.url));
        }
    }
}

// ---------------------------------------------------------------------------
// 4. DATOS EN MEMORIA
// ---------------------------------------------------------------------------
let productos = [
    { id: 1, nombre: "Producto 1", precio: 100 },
    { id: 2, nombre: "Producto 2", precio: 200 }
];

// ---------------------------------------------------------------------------
// 5. ENDPOINTS VERSIONADOS
// ---------------------------------------------------------------------------

// ==================== V1 ====================
app.get("/api/v1/productos", (req, res) => res.json(productos));

app.post("/api/v1/productos", authRequired, (req, res) => {
    const nuevo = { id: Date.now(), ...req.body };
    productos.push(nuevo);
    notifyWebhooks("productos.created", nuevo);
    res.json(nuevo);
});

// ==================== V2 (Mejora + validaciones) ====================
app.get("/api/v2/productos", (req, res) => {
    res.json({
        version: "2.0",
        total: productos.length,
        data: productos
    });
});

app.post("/api/v2/productos", authRequired, (req, res) => {
    const { nombre, precio } = req.body;
    if (!nombre || !precio) return res.status(400).json({ error: "Datos incompletos" });

    const nuevo = { id: Date.now(), nombre, precio };
    productos.push(nuevo);
    notifyWebhooks("productos.created", nuevo);
    res.json({ message: "Producto creado", data: nuevo });
});

// ---------------------------------------------------------------------------
// 6. DOCUMENTACIÓN OPENAPI
// ---------------------------------------------------------------------------
const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Rest Versionada",
            version: "1.0.0",
        }
    },
    apis: ["server.js"] // este mismo archivo
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------------------------------------------------------------------
// 7. SERVIDOR
// ---------------------------------------------------------------------------
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
    console.log("Documentación en http://localhost:3000/docs");
});

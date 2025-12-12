// Task 4: Versionado de APIs (6 minutos)
// Estrategias para versionar APIs y mantener compatibilidad.

// Versionado por URL
const express = require('express');
const app = express();
app.use(express.json());

// API v1
const v1 = express.Router();

v1.get('/productos', (req, res) => {
  res.json({
    version: 'v1',
    productos: productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio
    }))
  });
});

v1.post('/productos', (req, res) => {
  // Lógica v1...
  res.status(201).json({ version: 'v1', mensaje: 'Producto creado' });
});

// API v2
const v2 = express.Router();

v2.get('/productos', (req, res) => {
  res.json({
    version: 'v2',
    data: productos,
    meta: {
      total: productos.length,
      timestamp: new Date().toISOString()
    }
  });
});

v2.post('/productos', (req, res) => {
  // Lógica v2 con validaciones adicionales...
  res.status(201).json({
    version: 'v2',
    success: true,
    data: { /* producto creado */ }
  });
});

// Montar versiones
app.use('/api/v1', v1);
app.use('/api/v2', v2);

// Ruta por defecto redirige a v2
app.get('/api/productos', (req, res) => {
  res.redirect('/api/v2/productos');
});
// Versionado por Headers
const express = require('express');
const app = express();
app.use(express.json());

// Middleware para detectar versión
app.use('/api', (req, res, next) => {
  const version = req.headers['api-version'] ||
                  req.headers['accept-version'] ||
                  'v1';

  req.apiVersion = version;
  next();
});

// Controlador que maneja múltiples versiones
function getProductos(req, res) {
  const baseData = { productos };

  switch (req.apiVersion) {
    case 'v2':
      res.json({
        version: 'v2',
        data: productos,
        meta: {
          total: productos.length,
          timestamp: new Date().toISOString()
        }
      });
      break;

    case 'v3':
      res.json({
        version: 'v3',
        success: true,
        data: productos,
        pagination: { page: 1, limit: 10, total: productos.length },
        links: {
          self: '/api/productos',
          next: '/api/productos?page=2'
        }
      });
      break;

    default: // v1
      res.json({
        version: 'v1',
        productos: productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio
        }))
      });
  }
}

app.get('/api/productos', getProductos);

// Usar diferentes versiones:
// GET /api/productos (v1 por defecto)
// GET /api/productos + Header: API-Version: v2
// GET /api/productos + Header: API-Version: v3
// Estrategia de Versionado Recomendada
const express = require('express');
const app = express();
app.use(express.json());

// Sistema híbrido: URL + Headers
function createVersionedRouter(version) {
  const router = express.Router();

  // Middleware común para la versión
  router.use((req, res, next) => {
    req.apiVersion = version;
    res.set('API-Version', version);
    next();
  });

  return router;
}

// Versiones activas
const v1Router = createVersionedRouter('v1');
const v2Router = createVersionedRouter('v2');

// Implementaciones por versión
v1Router.get('/productos', (req, res) => {
  res.json({
    productos: productos.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio }))
  });
});

v2Router.get('/productos', (req, res) => {
  res.json({
    success: true,
    data: productos,
    meta: { total: productos.length, version: 'v2' }
  });
});

// Montar versiones
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Ruta sin versión - usar más reciente (v2)
app.use('/api', v2Router);

// Información de versiones disponibles
app.get('/api/versions', (req, res) => {
  res.json({
    versions: {
      v1: {
        status: 'deprecated',
        deprecatedAt: '2024-06-01',
        sunsetAt: '2024-12-01'
      },
      v2: {
        status: 'current',
        releasedAt: '2024-06-01'
      }
    },
    current: 'v2',
    legacy: ['v1']
  });
});

// Middleware para versiones obsoletas
app.use('/api/v1', (req, res, next) => {
  res.set('Warning', '299 - "API version v1 is deprecated"');
  next();
});
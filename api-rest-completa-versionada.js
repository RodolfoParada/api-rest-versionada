// api-rest-completa-versionada.js
const express = require('express');
const app = express();
app.use(express.json());

// Base de datos simulada
let productos = [
  { id: 1, nombre: 'Laptop', precio: 1000, categoria: 'Electrónica', stock: 5, activo: true },
  { id: 2, nombre: 'Mouse', precio: 25, categoria: 'Accesorios', stock: 10, activo: true }
];

let siguienteId = 3;

// Función helper para XML
function objectToXML(obj, rootName = 'response') {
  function toXML(data, name) {
    if (data === null || data === undefined) return '';

    if (typeof data === 'object' && !Array.isArray(data)) {
      const children = Object.entries(data)
        .map(([key, value]) => toXML(value, key))
        .join('');
      return `<${name}>${children}</${name}>`;
    }

    if (Array.isArray(data)) {
      const items = data.map((item, index) => toXML(item, 'item')).join('');
      return `<${name}>${items}</${name}>`;
    }

    return `<${name}>${data}</${name}>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXML(obj, rootName)}`;
}

// Middleware de content negotiation
app.use((req, res, next) => {
  const accept = req.headers.accept || '';
  const format = req.query.format;

  if (format === 'xml' || accept.includes('application/xml') || accept.includes('text/xml')) {
    req.requestedFormat = 'xml';
  } else if (format === 'html' || accept.includes('text/html')) {
    req.requestedFormat = 'html';
  } else {
    req.requestedFormat = 'json';
  }

  next();
});

// Función helper para respuestas
function sendResponse(res, data, statusCode = 200, format = 'json') {
  res.status(statusCode);

  switch (format) {
    case 'xml':
      res.set('Content-Type', 'application/xml');
      return res.send(objectToXML(data));

    case 'html':
      res.set('Content-Type', 'text/html');
      if (typeof data === 'string') {
        return res.send(data);
      }
      return res.send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);

    default:
      return res.json(data);
  }
}

// Crear routers versionados
function createVersionedRouter(version) {
  const router = express.Router();

  router.use((req, res, next) => {
    req.apiVersion = version;
    res.set('API-Version', version);
    next();
  });

  return router;
}

const v1Router = createVersionedRouter('v1');
const v2Router = createVersionedRouter('v2');

// API V1 - Básica
v1Router.get('/productos', (req, res) => {
  const { categoria } = req.query;
  let resultados = productos;

  if (categoria) {
    resultados = resultados.filter(p => p.categoria === categoria);
  }

  sendResponse(res, {
    productos: resultados.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio
    }))
  }, 200, req.requestedFormat);
});

v1Router.get('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return sendResponse(res, { error: 'Producto no encontrado' }, 404, req.requestedFormat);
  }

  sendResponse(res, {
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio
  }, 200, req.requestedFormat);
});

v1Router.post('/productos', (req, res) => {
  const { nombre, precio } = req.body;

  if (!nombre || !precio) {
    return sendResponse(res, { error: 'Nombre y precio requeridos' }, 400, req.requestedFormat);
  }

  const nuevoProducto = {
    id: siguienteId++,
    nombre,
    precio: parseFloat(precio),
    categoria: 'General',
    stock: 0,
    activo: true
  };

  productos.push(nuevoProducto);
  sendResponse(res, { mensaje: 'Producto creado', producto: nuevoProducto }, 201, req.requestedFormat);
});

// API V2 - Avanzada
v2Router.get('/productos', (req, res) => {
  const {
    categoria,
    precio_min,
    precio_max,
    activo,
    pagina = 1,
    limite = 10,
    ordenar
  } = req.query;

  let resultados = [...productos];

  // Filtros
  if (categoria) {
    resultados = resultados.filter(p => p.categoria === categoria);
  }

  if (precio_min) {
    resultados = resultados.filter(p => p.precio >= parseFloat(precio_min));
  }

  if (precio_max) {
    resultados = resultados.filter(p => p.precio <= parseFloat(precio_max));
  }

  if (activo !== undefined) {
    resultados = resultados.filter(p => p.activo === (activo === 'true'));
  }

  // Ordenamiento
  if (ordenar) {
    switch (ordenar) {
      case 'precio_asc':
        resultados.sort((a, b) => a.precio - b.precio);
        break;
      case 'precio_desc':
        resultados.sort((a, b) => b.precio - a.precio);
        break;
      case 'nombre':
        resultados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }
  }

  // Paginación
  const paginaNum = parseInt(pagina);
  const limiteNum = parseInt(limite);
  const inicio = (paginaNum - 1) * limiteNum;
  const paginados = resultados.slice(inicio, inicio + limiteNum);

  const respuesta = {
    success: true,
    data: paginados,
    meta: {
      total: resultados.length,
      pagina: paginaNum,
      limite: limiteNum,
      paginasTotal: Math.ceil(resultados.length / limiteNum)
    },
    filtros: req.query
  };

  sendResponse(res, respuesta, 200, req.requestedFormat);
});

v2Router.get('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return sendResponse(res, { error: 'Producto no encontrado' }, 404, req.requestedFormat);
  }

  sendResponse(res, {
    success: true,
    data: producto
  }, 200, req.requestedFormat);
});

v2Router.post('/productos', (req, res) => {
  const { nombre, precio, categoria, stock } = req.body;

  if (!nombre || !precio) {
    return sendResponse(res, {
      error: 'Nombre y precio son requeridos',
      camposRequeridos: ['nombre', 'precio']
    }, 400, req.requestedFormat);
  }

  if (precio <= 0) {
    return sendResponse(res, { error: 'El precio debe ser mayor a 0' }, 400, req.requestedFormat);
  }

  const nuevoProducto = {
    id: siguienteId++,
    nombre: nombre.trim(),
    precio: parseFloat(precio),
    categoria: categoria || 'General',
    stock: parseInt(stock) || 0,
    activo: true,
    fechaCreacion: new Date().toISOString()
  };

  productos.push(nuevoProducto);

  sendResponse(res, {
    success: true,
    message: 'Producto creado exitosamente',
    data: nuevoProducto
  }, 201, req.requestedFormat);
});

v2Router.put('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const indice = productos.findIndex(p => p.id === id);

  if (indice === -1) {
    return sendResponse(res, { error: 'Producto no encontrado' }, 404, req.requestedFormat);
  }

  const { nombre, precio, categoria, stock, activo } = req.body;

  if (!nombre || !precio) {
    return sendResponse(res, { error: 'Nombre y precio son requeridos' }, 400, req.requestedFormat);
  }

  productos[indice] = {
    id,
    nombre: nombre.trim(),
    precio: parseFloat(precio),
    categoria: categoria || productos[indice].categoria,
    stock: parseInt(stock) || productos[indice].stock,
    activo: activo !== undefined ? activo : productos[indice].activo,
    fechaCreacion: productos[indice].fechaCreacion,
    fechaActualizacion: new Date().toISOString()
  };

  sendResponse(res, {
    success: true,
    message: 'Producto actualizado',
    data: productos[indice]
  }, 200, req.requestedFormat);
});

v2Router.delete('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const indice = productos.findIndex(p => p.id === id);

  if (indice === -1) {
    return sendResponse(res, { error: 'Producto no encontrado' }, 404, req.requestedFormat);
  }

  const productoEliminado = productos.splice(indice, 1)[0];

  sendResponse(res, {
    success: true,
    message: 'Producto eliminado',
    data: productoEliminado
  }, 200, req.requestedFormat);
});

// Montar versiones
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Versión por defecto (v2)
app.use('/api', v2Router);

// Información de versiones
app.get('/api/versions', (req, res) => {
  sendResponse(res, {
    versions: {
      v1: {
        status: 'deprecated',
        description: 'Versión básica, limitada funcionalidad',
        deprecatedAt: '2024-01-01'
      },
      v2: {
        status: 'current',
        description: 'Versión completa con todas las funcionalidades',
        releasedAt: '2024-06-01'
      }
    },
    current: 'v2',
    supportedFormats: ['json', 'xml', 'html'],
    documentation: {
      v1: '/api/v1',
      v2: '/api/v2'
    }
  }, 200, req.requestedFormat);
});

// Página de inicio
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>API REST Versionada</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .version { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .current { border-left: 4px solid #28a745; }
        .deprecated { border-left: 4px solid #ffc107; }
        code { background: #e8e8e8; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>🚀 API REST Completa con Versionado</h1>
      <p>API que soporta múltiples versiones y formatos de respuesta.</p>

      <h2>Versiones Disponibles</h2>
      <div class="version current">
        <h3>API v2 (Actual)</h3>
        <p>Versión completa con todas las funcionalidades avanzadas.</p>
        <ul>
          <li>Filtros avanzados y paginación</li>
          <li>Ordenamiento de resultados</li>
          <li>Validaciones robustas</li>
          <li>Respuestas en JSON, XML y HTML</li>
        </ul>
        <p><strong>Endpoint:</strong> <code>/api/v2/productos</code></p>
      </div>

      <div class="version deprecated">
        <h3>API v1 (Obsoleta)</h3>
        <p>Versión básica mantenida por compatibilidad.</p>
        <p><strong>Endpoint:</strong> <code>/api/v1/productos</code></p>
      </div>

      <h2>Formatos Soportados</h2>
      <ul>
        <li><strong>JSON (por defecto):</strong> <code>Accept: application/json</code></li>
        <li><strong>XML:</strong> <code>Accept: application/xml</code> o <code>?format=xml</code></li>
        <li><strong>HTML:</strong> <code>Accept: text/html</code> o <code>?format=html</code></li>
      </ul>

      <h2>Ejemplos de Uso</h2>
      <h3>Listar productos (JSON):</h3>
      <code>GET /api/productos</code>

      <h3>Listar productos (XML):</h3>
      <code>GET /api/productos?format=xml</code>

      <h3>Filtrar productos:</h3>
      <code>GET /api/productos?categoria=Electrónica&precio_min=100</code>

      <h3>Crear producto:</h3>
      <code>POST /api/productos</code> con body JSON
    </body>
    </html>
  `;

  res.send(html);
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  sendResponse(res, {
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  }, 500, req.requestedFormat);
});

// 404
app.use((req, res) => {
  sendResponse(res, {
    error: 'Ruta no encontrada',
    metodo: req.method,
    ruta: req.url
  }, 404, req.requestedFormat);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API REST Versionada ejecutándose en http://localhost:${PORT}`);
  console.log(`📖 Documentación en http://localhost:${PORT}`);
  console.log(`🔄 Versiones: v1 (deprecated) y v2 (current)`);
  console.log(`📋 Format: JSON (default), XML (?format=xml), HTML (?format=html)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  process.exit(0);
});

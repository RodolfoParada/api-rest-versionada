// Task 3: Content Negotiation (8 minutos)
// Permitir que los clientes soliciten diferentes formatos de respuesta.

// JSON y XML Response
const express = require('express');
const app = express();

// Función para convertir objeto a XML
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
  res.format = (formats) => {
    const accept = req.headers.accept || '';
    let contentType = 'application/json'; // default

    if (accept.includes('application/xml') || accept.includes('text/xml')) {
      contentType = 'application/xml';
    } else if (accept.includes('text/html')) {
      contentType = 'text/html';
    }

    const formatter = formats[contentType] || formats['application/json'];

    if (formatter) {
      res.setHeader('Content-Type', contentType);
      return formatter();
    }

    res.status(406).send('Formato no soportado');
  };

  next();
});

// Ejemplo de uso
app.get('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.format({
      'application/json': () => res.status(404).json({ error: 'Producto no encontrado' }),
      'application/xml': () => res.status(404).send('<error>Producto no encontrado</error>'),
      'text/html': () => res.status(404).send('<h1>Producto no encontrado</h1>')
    });
  }

  res.format({
    'application/json': () => res.json(producto),

    'application/xml': () => {
      res.send(objectToXML(producto, 'producto'));
    },

    'text/html': () => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Producto ${producto.id}</title></head>
        <body>
          <h1>${producto.nombre}</h1>
          <p>Precio: $${producto.precio}</p>
          <p>Categoría: ${producto.categoria}</p>
          <p>Stock: ${producto.stock}</p>
        </body>
        </html>
      `);
    },

    default: () => res.json(producto)
  });
});

// Endpoint que soporta múltiples formatos
app.get('/productos', (req, res) => {
  res.format({
    'application/json': () => res.json({
      productos,
      total: productos.length
    }),

    'application/xml': () => {
      const data = {
        productos: { producto: productos },
        total: productos.length
      };
      res.send(objectToXML(data, 'catalogo'));
    },

    'text/html': () => {
      const listaHTML = productos.map(p =>
        `<li>${p.nombre} - $${p.precio} (${p.categoria})</li>`
      ).join('');

      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Catálogo de Productos</title></head>
        <body>
          <h1>Catálogo de Productos</h1>
          <p>Total: ${productos.length} productos</p>
          <ul>${listaHTML}</ul>
        </body>
        </html>
      `);
    }
  });
});
// Content Negotiation Avanzado
const express = require('express');
const app = express();

// Middleware para detectar formato solicitado
app.use((req, res, next) => {
  const accept = req.headers.accept || '';
  const format = req.query.format;

  // Determinar formato
  if (format === 'xml' || accept.includes('application/xml')) {
    req.requestedFormat = 'xml';
  } else if (format === 'html' || accept.includes('text/html')) {
    req.requestedFormat = 'html';
  } else {
    req.requestedFormat = 'json';
  }

  next();
});

// Función helper para respuestas
function sendResponse(res, data, format = 'json') {
  switch (format) {
    case 'xml':
      res.set('Content-Type', 'application/xml');
      return res.send(objectToXML(data));

    case 'html':
      res.set('Content-Type', 'text/html');
      return res.send(data);

    default:
      return res.json(data);
  }
}

// API que usa el formato solicitado
app.get('/api/info', (req, res) => {
  const data = {
    nombre: 'API de Productos',
    version: '1.0.0',
    formatosSoportados: ['json', 'xml', 'html'],
    formatoSolicitado: req.requestedFormat,
    timestamp: new Date().toISOString()
  };

  sendResponse(res, data, req.requestedFormat);
});

// Content negotiation para creación de recursos
app.post('/productos', (req, res) => {
  // Crear producto...
  const nuevoProducto = {
    id: siguienteId++,
    ...req.body,
    fechaCreacion: new Date().toISOString()
  };

  productos.push(nuevoProducto);

  // Responder según formato solicitado
  if (req.requestedFormat === 'xml') {
    res.set('Content-Type', 'application/xml');
    res.status(201).send(objectToXML({
      mensaje: 'Producto creado',
      producto: nuevoProducto
    }, 'resultado'));
  } else if (req.requestedFormat === 'html') {
    res.set('Content-Type', 'text/html');
    res.status(201).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Producto Creado</title></head>
      <body>
        <h1>Producto Creado Exitosamente</h1>
        <p>ID: ${nuevoProducto.id}</p>
        <p>Nombre: ${nuevoProducto.nombre}</p>
        <p>Precio: $${nuevoProducto.precio}</p>
        <a href="/productos">Ver todos los productos</a>
      </body>
      </html>
    `);
  } else {
    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: nuevoProducto
    });
  }
});
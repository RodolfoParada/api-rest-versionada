// Task 2: CRUD Operations Completo (8 minutos)
// Implementación completa de operaciones CRUD siguiendo mejores prácticas.

// Patrón CRUD con Express
const express = require('express');
const app = express();
app.use(express.json());

// Base de datos simulada
let productos = [
  { id: 1, nombre: 'Laptop', precio: 1000, categoria: 'Electrónica', stock: 5 },
  { id: 2, nombre: 'Mouse', precio: 25, categoria: 'Accesorios', stock: 10 }
];

let siguienteId = 3;

// CREATE - POST
app.post('/productos', (req, res) => {
  const { nombre, precio, categoria, stock } = req.body;

  // Validación básica
  if (!nombre || !precio || precio <= 0) {
    return res.status(400).json({
      error: 'Nombre y precio válido son requeridos'
    });
  }

  const nuevoProducto = {
    id: siguienteId++,
    nombre: nombre.trim(),
    precio: parseFloat(precio),
    categoria: categoria || 'General',
    stock: parseInt(stock) || 0,
    fechaCreacion: new Date().toISOString()
  };

  productos.push(nuevoProducto);

  res.status(201).json({
    mensaje: 'Producto creado exitosamente',
    producto: nuevoProducto
  });
});

// READ - GET (todos)
app.get('/productos', (req, res) => {
  const { categoria, precio_min, precio_max, pagina = 1, limite = 10 } = req.query;

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

  // Paginación
  const paginaNum = parseInt(pagina);
  const limiteNum = parseInt(limite);
  const inicio = (paginaNum - 1) * limiteNum;
  const paginados = resultados.slice(inicio, inicio + limiteNum);

  res.json({
    productos: paginados,
    total: resultados.length,
    pagina: paginaNum,
    limite: limiteNum,
    paginasTotal: Math.ceil(resultados.length / limiteNum)
  });
});

// READ - GET (uno específico)
app.get('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({
      error: 'Producto no encontrado'
    });
  }

  res.json(producto);
});

// UPDATE - PUT (completo)
app.put('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const indice = productos.findIndex(p => p.id === id);

  if (indice === -1) {
    return res.status(404).json({
      error: 'Producto no encontrado'
    });
  }

  const { nombre, precio, categoria, stock } = req.body;

  // Validación
  if (!nombre || !precio || precio <= 0) {
    return res.status(400).json({
      error: 'Nombre y precio válido son requeridos'
    });
  }

  // Actualización completa
  productos[indice] = {
    id,
    nombre: nombre.trim(),
    precio: parseFloat(precio),
    categoria: categoria || 'General',
    stock: parseInt(stock) || 0,
    fechaCreacion: productos[indice].fechaCreacion,
    fechaActualizacion: new Date().toISOString()
  };

  res.json({
    mensaje: 'Producto actualizado exitosamente',
    producto: productos[indice]
  });
});

// UPDATE - PATCH (parcial)
app.patch('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const indice = productos.findIndex(p => p.id === id);

  if (indice === -1) {
    return res.status(404).json({
      error: 'Producto no encontrado'
    });
  }

  const producto = productos[indice];
  const camposActualizables = ['nombre', 'precio', 'categoria', 'stock'];
  const actualizaciones = {};

  // Aplicar solo los campos proporcionados
  for (const [campo, valor] of Object.entries(req.body)) {
    if (camposActualizables.includes(campo)) {
      switch (campo) {
        case 'nombre':
          if (typeof valor === 'string' && valor.trim().length > 0) {
            actualizaciones.nombre = valor.trim();
          }
          break;
        case 'precio':
          if (typeof valor === 'number' && valor > 0) {
            actualizaciones.precio = valor;
          }
          break;
        case 'categoria':
          if (typeof valor === 'string') {
            actualizaciones.categoria = valor;
          }
          break;
        case 'stock':
          if (typeof valor === 'number' && valor >= 0) {
            actualizaciones.stock = valor;
          }
          break;
      }
    }
  }

  // Aplicar actualizaciones
  Object.assign(producto, actualizaciones);
  producto.fechaActualizacion = new Date().toISOString();

  res.json({
    mensaje: 'Producto actualizado parcialmente',
    producto
  });
});

// DELETE
app.delete('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const indice = productos.findIndex(p => p.id === id);

  if (indice === -1) {
    return res.status(404).json({
      error: 'Producto no encontrado'
    });
  }

  const productoEliminado = productos.splice(indice, 1)[0];

  res.json({
    mensaje: 'Producto eliminado exitosamente',
    producto: productoEliminado
  });
});
// Operaciones CRUD Avanzadas
const express = require('express');
const app = express();
app.use(express.json());

// BULK OPERATIONS

// Crear múltiples productos
app.post('/productos/bulk', (req, res) => {
  const productosData = req.body.productos;

  if (!Array.isArray(productosData) || productosData.length === 0) {
    return res.status(400).json({
      error: 'Se requiere un array de productos'
    });
  }

  const nuevosProductos = [];
  const errores = [];

  productosData.forEach((productoData, index) => {
    try {
      if (!productoData.nombre || !productoData.precio) {
        errores.push({ index, error: 'Nombre y precio requeridos' });
        return;
      }

      const nuevoProducto = {
        id: siguienteId++,
        nombre: productoData.nombre.trim(),
        precio: parseFloat(productoData.precio),
        categoria: productoData.categoria || 'General',
        stock: parseInt(productoData.stock) || 0,
        fechaCreacion: new Date().toISOString()
      };

      productos.push(nuevoProducto);
      nuevosProductos.push(nuevoProducto);
    } catch (error) {
      errores.push({ index, error: error.message });
    }
  });

  res.status(errores.length > 0 ? 207 : 201).json({
    mensaje: `Procesados ${productosData.length} productos`,
    creados: nuevosProductos.length,
    errores: errores.length,
    productos: nuevosProductos,
    errores_detalle: errores
  });
});

// Eliminar múltiples productos
app.delete('/productos', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({
      error: 'Se requiere un array de IDs'
    });
  }

  const eliminados = [];
  const noEncontrados = [];

  ids.forEach(id => {
    const indice = productos.findIndex(p => p.id === parseInt(id));
    if (indice !== -1) {
      eliminados.push(productos.splice(indice, 1)[0]);
    } else {
      noEncontrados.push(id);
    }
  });

  res.json({
    mensaje: `Eliminados ${eliminados.length} productos`,
    eliminados,
    noEncontrados
  });
});

// SOFT DELETE
app.patch('/productos/:id/soft-delete', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  producto.eliminado = true;
  producto.fechaEliminacion = new Date().toISOString();

  res.json({
    mensaje: 'Producto marcado como eliminado',
    producto
  });
});

// RESTORE (para soft delete)
app.patch('/productos/:id/restore', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (!producto.eliminado) {
    return res.status(400).json({ error: 'El producto no está eliminado' });
  }

  delete producto.eliminado;
  delete producto.fechaEliminacion;

  res.json({
    mensaje: 'Producto restaurado',
    producto
  });
});
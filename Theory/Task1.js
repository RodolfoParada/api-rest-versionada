// Task 1: Diseño de API RESTful (8 minutos)
// Principios y mejores prácticas para diseñar APIs RESTful profesionales.

// Principios REST

1. Recursos como URLs

// ❌ Mal diseño
// GET /getUsers
// POST /createUser
// PUT /updateUser?id=123
// DELETE /deleteUser/123

// // ✅ Diseño RESTful
// GET /users           // Listar usuarios
// GET /users/123       // Obtener usuario específico
// POST /users          // Crear usuario
// PUT /users/123       // Actualizar usuario completo
// PATCH /users/123     // Actualizar usuario parcial
// DELETE /users/123    // Eliminar usuario


// 2. Métodos HTTP apropiados

// GET: Obtener recursos (seguro, idempotente)
// POST: Crear recursos (no idempotente)
// PUT: Actualizar recursos completos (idempotente)
// PATCH: Actualizar recursos parciales (no idempotente)
// DELETE: Eliminar recursos (idempotente)
// HEAD: Obtener headers sin body
// OPTIONS: Describir opciones de comunicación


3. Códigos de Estado HTTP apropiados

// 2xx - Éxito
200 OK              // Petición exitosa
201 Created         // Recurso creado
204 No Content      // Sin contenido de respuesta

// 3xx - Redirección
301 Moved Permanently // Recurso movido permanentemente
302 Found           // Recurso encontrado temporalmente

// 4xx - Error del cliente
400 Bad Request     // Datos inválidos
401 Unauthorized    // No autenticado
403 Forbidden       // No autorizado
404 Not Found       // Recurso no encontrado
409 Conflict        // Conflicto con estado actual
422 Unprocessable Entity // Datos válidos pero no procesables

// 5xx - Error del servidor
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
Estructura de Recursos
Recursos Anidados

// Usuarios y sus posts
GET /users/123/posts          // Posts del usuario 123
GET /users/123/posts/456      // Post específico
POST /users/123/posts         // Crear post para usuario
DELETE /users/123/posts/456   // Eliminar post

// Relaciones complejas
GET /posts/456/comments       // Comentarios del post
GET /posts/456/author         // Autor del post
GET /users/123/followers      // Seguidores del usuario
Parámetros de Consulta

// Filtros y búsqueda
GET /products?category=electronics&price_min=100&price_max=500
GET /users?search=john&status=active
GET /posts?author_id=123&published=true

// Paginación
GET /products?page=2&limit=20
GET /users?offset=40&limit=10

// Ordenamiento
GET /products?sort=price_asc
GET /products?sort=-price,name  // Orden múltiple
Versionado de APIs
Estrategias de Versionado

// 1. URL Versioning (más común)
GET /v1/users
GET /v2/users

// 2. Header Versioning
GET /users
Headers: Accept: application/vnd.api.v1+json

// 3. Media Type Versioning
GET /users
Headers: Accept: application/vnd.myapp.v2+json

// 4. Parameter Versioning
GET /users?version=2
const express = require('express');
const app = express();

// Versionado por URL
const v1Router = express.Router();
const v2Router = express.Router();

// API v1
v1Router.get('/users', (req, res) => {
  res.json({ version: 'v1', users: ['user1', 'user2'] });
});

// API v2 (con cambios)
v2Router.get('/users', (req, res) => {
  res.json({
    version: 'v2',
    data: [
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' }
    ]
  });
});

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// O usando un solo router con middleware de versión
app.use('/api/:version', (req, res, next) => {
  req.apiVersion = req.params.version;
  next();
});
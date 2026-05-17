
  Documents (5):
  - POST /create
  - GET /documents
  - GET /documents/:slug
  - PUT /documents/:slug
  - DELETE /documents/:slug

  Document Versions (3):
  - GET /documents/:slug/versions
  - GET /documents/:slug/versions/:version
  - POST /documents/:slug/rollback/:version

  Document Images (2):
  - POST /upload-image-base64
  - PATCH /documents/:slug/images

  Categories (6):
  - POST /categories
  - GET /categories
  - GET /categories/:categoryId
  - PUT /categories/:categoryId
  - DELETE /categories/:categoryId
  - GET /categories/:categoryId/documents

  Search (1):
  - GET /search

  Database Schema (2):
  - GET /tables/:schema/:table
  - PUT /columns/:columnId

  Admin (1):
  - POST /generate
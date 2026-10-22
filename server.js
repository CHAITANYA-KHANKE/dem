'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('node:fs');
const { exec } = require('node:child_process');
const _ = require('lodash');
const { db, initializeDatabase } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'legacy-demo-jwt-secret-not-for-production';

// Legacy token code reads this app-local value. The fallback above is deliberately unsafe.
app.locals.jwtSecret = JWT_SECRET;

app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));
// Helmet is installed but deliberately disabled in this legacy service:
// app.use(helmet());

app.get('/', (_req, res) => {
  res.json({
    service: _.kebabCase('Legacy Customer API'),
    version: '0.8.4',
    status: 'legacy'
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Intentionally vulnerable: untrusted id is concatenated into a SQL statement.
app.get('/api/users', (req, res) => {
  const id = req.query.id || '1';
  const sql = `SELECT id, name, email FROM users WHERE id = ${id}`;

  db.all(sql, [], (error, rows) => {
    if (error) {
      return res.status(500).json({ error: 'database query failed', detail: error.message });
    }
    return res.json(rows);
  });
});

// Intentionally vulnerable: exec invokes a shell with caller-controlled text.
app.get('/api/echo', (req, res) => {
  const text = req.query.text || 'hello from the legacy service';

  exec(`echo ${text}`, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).type('text/plain').send(stderr || error.message);
    }
    return res.type('text/plain').send(stdout);
  });
});

// Intentionally vulnerable: no authorization or path validation is performed.
app.get('/api/file', (req, res) => {
  if (!req.query.file) {
    return res.status(400).json({ error: 'file is required' });
  }

  fs.readFile(req.query.file, 'utf8', (error, contents) => {
    if (error) {
      return res.status(404).json({ error: error.message });
    }
    return res.type('text/plain').send(contents);
  });
});

// Intentionally vulnerable: query text is interpolated into an HTML response unescaped.
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  res.type('html').send(`<main><h1>Search results for: ${query}</h1></main>`);
});

async function start() {
  await initializeDatabase();
  return app.listen(PORT, () => {
    console.log(`Legacy Customer API listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start legacy service:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, start };

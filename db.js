'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'legacy-service.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        return reject(error);
      }
      return resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        return reject(error);
      }
      return resolve(row);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);

  const result = await get('SELECT COUNT(*) AS count FROM users');
  if (result.count === 0) {
    const seedUsers = [
      [1, 'Alice Johnson', 'alice@example.test'],
      [2, 'Ravi Patil', 'ravi@example.test'],
      [3, 'Morgan Lee', 'morgan@example.test']
    ];

    for (const user of seedUsers) {
      await run('INSERT INTO users (id, name, email) VALUES (?, ?, ?)', user);
    }
  }
}

module.exports = { db, initializeDatabase };

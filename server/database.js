const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../data/magic-vein.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS identities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enrolled_at INTEGER NOT NULL,
  feat_data BLOB NOT NULL,
  feat_size INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recognition_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_id TEXT,
  score INTEGER,
  confidence REAL,
  matched INTEGER,
  timestamp INTEGER,
  quality INTEGER
);
`);

const insertIdentity = db.prepare(
  `INSERT OR REPLACE INTO identities (id, name, enrolled_at, feat_data, feat_size, notes)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const getAllIdentities = db.prepare(`SELECT id, name, enrolled_at, feat_size, notes FROM identities ORDER BY enrolled_at DESC`);
const getIdentityById = db.prepare(`SELECT * FROM identities WHERE id = ?`);
const deleteIdentityById = db.prepare(`DELETE FROM identities WHERE id = ?`);
const insertRecognitionLog = db.prepare(
  `INSERT INTO recognition_log (identity_id, score, confidence, matched, timestamp, quality)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const getRecognitionLogs = db.prepare(
  `SELECT id, identity_id, score, confidence, matched, timestamp, quality
   FROM recognition_log
   ORDER BY timestamp DESC
   LIMIT ?`
);

module.exports = {
  addIdentity: ({ id, name, featBuf, featSize, notes = '' }) => {
    insertIdentity.run(id, name, Date.now(), featBuf, featSize, notes);
  },
  listIdentities: () => getAllIdentities.all(),
  getIdentity: (id) => getIdentityById.get(id),
  deleteIdentity: (id) => deleteIdentityById.run(id),
  logRecognition: ({ identityId, score, confidence, matched, quality }) => {
    insertRecognitionLog.run(identityId, score, confidence, matched ? 1 : 0, Date.now(), quality);
  },
  getRecognitionLog: (limit = 50) => getRecognitionLogs.all(limit),
};

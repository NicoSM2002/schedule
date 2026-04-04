const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// DATABASE
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'projects.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  floors TEXT DEFAULT '2',
  start_date TEXT DEFAULT '2026-01-01',
  tasks TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

// LIST PROJECTS
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare("SELECT id, name, floors, start_date, created_at, updated_at, json_array_length(tasks) as task_count FROM projects ORDER BY updated_at DESC").all();
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET PROJECT
app.get('/api/projects/:id', (req, res) => {
  try {
    const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    p.tasks = JSON.parse(p.tasks);
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE PROJECT
app.post('/api/projects', (req, res) => {
  try {
    const { name, floors, start_date, tasks } = req.body;
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    db.prepare("INSERT INTO projects (id, name, floors, start_date, tasks) VALUES (?, ?, ?, ?, ?)").run(id, name, floors || '2', start_date || '2026-01-01', JSON.stringify(tasks || []));
    res.json({ id, name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SAVE PROJECT
app.put('/api/projects/:id', (req, res) => {
  try {
    const { name, floors, start_date, tasks } = req.body;
    const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE projects SET name=?, floors=?, start_date=?, tasks=?, updated_at=datetime('now') WHERE id=?").run(name, floors, start_date, JSON.stringify(tasks), req.params.id);
    res.json({ message: 'Saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE PROJECT
app.delete('/api/projects/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CHAT PROXY
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: req.body.model || 'claude-sonnet-4-20250514', max_tokens: req.body.max_tokens || 1000, system: req.body.system || '', messages: req.body.messages || [] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Running on port ${PORT}`));

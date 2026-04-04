const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// DATABASE — Turso (cloud SQLite)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

// Init table
(async () => {
  await db.execute(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    floors TEXT DEFAULT '2',
    start_date TEXT DEFAULT '2026-01-01',
    tasks TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  console.log('Database ready');
})();

// LIST PROJECTS
app.get('/api/projects', async (req, res) => {
  try {
    const result = await db.execute("SELECT id, name, floors, start_date, created_at, updated_at FROM projects ORDER BY updated_at DESC");
    const projects = result.rows.map(r => ({
      id: r.id, name: r.name, floors: r.floors, start_date: r.start_date,
      created_at: r.created_at, updated_at: r.updated_at,
      task_count: JSON.parse(r.tasks || '[]').length
    }));
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET PROJECT
app.get('/api/projects/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [req.params.id] });
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const p = result.rows[0];
    res.json({ ...p, tasks: JSON.parse(p.tasks) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE PROJECT
app.post('/api/projects', async (req, res) => {
  try {
    const { name, floors, start_date, tasks } = req.body;
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    await db.execute({
      sql: "INSERT INTO projects (id, name, floors, start_date, tasks) VALUES (?, ?, ?, ?, ?)",
      args: [id, name, floors || '2', start_date || '2026-01-01', JSON.stringify(tasks || [])]
    });
    res.json({ id, name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SAVE PROJECT
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, floors, start_date, tasks } = req.body;
    await db.execute({
      sql: "UPDATE projects SET name=?, floors=?, start_date=?, tasks=?, updated_at=datetime('now') WHERE id=?",
      args: [name, floors, start_date, JSON.stringify(tasks), req.params.id]
    });
    res.json({ message: 'Saved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE PROJECT
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [req.params.id] });
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

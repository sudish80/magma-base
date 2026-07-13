const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Configuration ────────────────────────────────────────────
const VAULT_PATH = path.resolve(process.argv.includes('--vault')
  ? process.argv[process.argv.indexOf('--vault') + 1]
  : path.join(__dirname, 'vault'));
const PORT = process.env.PORT || 3030;

// ─── In-Memory Index ──────────────────────────────────────────
let fileIndex = new Map();   // filename -> { name, path, links, tags, frontmatter, mtime, content }

function parseMarkdown(content) {
  const links = [];
  const tags = [];
  let frontmatter = {};

  // Frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const raw = fmMatch[1];
    raw.split('\n').forEach(line => {
      const parts = line.match(/^(\w+):\s*(.+)/);
      if (parts) {
        const val = parts[2].trim().replace(/^["']|["']$/g, '');
        if (parts[1] === 'tags') {
          frontmatter.tags = val.split(/[,\s]+/).filter(Boolean);
        } else {
          frontmatter[parts[1]] = val;
        }
      }
    });
  }

  // Wiki links [[link]]
  const linkRe = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = linkRe.exec(content)) !== null) {
    const name = m[1].split('|')[0].split('#')[0].trim();
    if (name && !links.includes(name)) links.push(name);
  }

  // Tags #tag
  const tagRe = /(?:^|\s)(#([a-zA-Z0-9\u00C0-\u024F][\w\u00C0-\u024F/-]*))/g;
  while ((m = tagRe.exec(content)) !== null) {
    const tag = m[2];
    if (tag && !tags.includes(tag)) tags.push(tag);
  }

  if (frontmatter.tags) {
    frontmatter.tags.forEach(t => { if (!tags.includes(t)) tags.push(t); });
  }

  return { links, tags, frontmatter };
}

function indexFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath, '.md');
    const parsed = parseMarkdown(content);
    const relativePath = path.relative(VAULT_PATH, filePath);
    fileIndex.set(relativePath, {
      name,
      path: relativePath,
      content,
      ...parsed,
      mtime: stat.mtimeMs,
    });
  } catch (e) {
    console.error('Error indexing', filePath, e.message);
  }
}

function removeFile(filePath) {
  const relativePath = path.relative(VAULT_PATH, filePath);
  fileIndex.delete(relativePath);
}

function scanVault() {
  fileIndex.clear();
  if (!fs.existsSync(VAULT_PATH)) {
    fs.mkdirSync(VAULT_PATH, { recursive: true });
    // Create demo files
    createDemoFiles();
    return;
  }
  walkDir(VAULT_PATH);
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      }
    } else if (entry.name.endsWith('.md')) {
      indexFile(fullPath);
    }
  }
}

function createDemoFiles() {
  const demos = [

    { name: 'Project Architecture.md', content: `# Project Architecture

## Layers

The system follows [[clean-architecture]] principles.

| Layer | Tech | Responsibility |
|-------|------|---------------|
| Frontend | Angular 17 | UI components |
| Backend | FastAPI | REST API |
| Database | PostgreSQL | Persistence |
| Cache | Redis | Session & rate limiting |

## Structure

\`\`\`
src/
├── app/       # Components
├── store/     # State
└── styles/    # CSS
backend/
├── routers/   # API routes
└── models/    # Data models
\`\`\`

#architecture #angular #python
` },
    { name: 'clean-architecture.md', content: `# Clean Architecture

## Core Idea

Separate code into layers with strict dependency rules:
inner layers never depend on outer layers.

## Layers

1. **Domain** — Entities & business rules
2. **Application** — Use cases
3. **Infrastructure** — DB, APIs, frameworks

## Benefits

- Test business logic without frameworks
- Swap implementations (e.g., PostgreSQL → MongoDB)
- [[testing-strategies|Easier to test]] each layer

#architecture #design-patterns
` },
    { name: 'testing-strategies.md', content: `# Testing Strategies

## Pyramid

1. **Unit** (70%) — Isolated business logic
2. **Integration** (20%) — Service interactions
3. **E2E** (10%) — Full user flows

## Example

\`\`\`typescript
describe('validateEmail', () => {
  it('returns true for valid emails', () => {
    expect(validateEmail('hi@example.com')).toBe(true);
  });
});
\`\`\`

See [[Project Architecture]] for related patterns.

#testing #quality
` },
    { name: 'API Design.md', content: `# API Design Guide

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Server status |
| GET | /tasks | List tasks |
| POST | /tasks | Create task |
| GET | /tasks/:id | Get task |
| PUT | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |

## Response format

\`\`\`json
{ "data": {}, "message": "ok", "status": 200 }
\`\`\`

## Error codes

- \`400\` — Validation error
- \`401\` — Unauthorized
- \`404\` — Not found
- \`500\` — Server error

#api #backend #design
` },
    { name: 'Workflow & Planning.md', content: `# Workflow & Planning

## Weekly cycle

- **Monday** — Planning & task assignment
- **Tue-Thu** — Implementation
- **Friday** — Review & retro

## Current sprint

- [x] Core architecture ([[Project Architecture]])
- [x] API design ([[API Design]])
- [ ] Test suite ([[testing-strategies]])
- [ ] Deployment pipeline

## Tags

#planning #workflow
` },
  ];
  for (const demo of demos) {
    const filePath = path.join(VAULT_PATH, demo.name);
    fs.writeFileSync(filePath, demo.content, 'utf-8');
    indexFile(filePath);
  }
  console.log(`Created ${demos.length} demo files in ${VAULT_PATH}`);
}

// ─── File Watcher ─────────────────────────────────────────────
let watcher = null;

function startWatcher() {
  if (watcher) watcher.close();
  watcher = chokidar.watch(VAULT_PATH, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });
  watcher.on('add', (filePath) => {
    if (filePath.endsWith('.md')) indexFile(filePath);
  });
  watcher.on('change', (filePath) => {
    if (filePath.endsWith('.md')) indexFile(filePath);
  });
  watcher.on('unlink', (filePath) => {
    if (filePath.endsWith('.md')) removeFile(filePath);
  });
}

// ─── REST API ─────────────────────────────────────────────────

// Status
app.get('/api/status', (req, res) => {
  res.json({
    vault: VAULT_PATH,
    fileCount: fileIndex.size,
    version: '1.0.0',
  });
});

// List files
app.get('/api/files', (req, res) => {
  const files = [];
  for (const [relativePath, entry] of fileIndex) {
    files.push({
      name: entry.name,
      path: relativePath,
      links: entry.links,
      tags: entry.tags,
      frontmatter: entry.frontmatter,
      mtime: entry.mtime,
    });
  }
  res.json(files);
});

// Get single file
app.get('/api/files/:name(*)', (req, res) => {
  const entry = fileIndex.get(req.params.name);
  if (!entry) return res.status(404).json({ error: 'File not found' });
  res.json({
    name: entry.name,
    path: entry.path,
    content: entry.content,
    links: entry.links,
    tags: entry.tags,
    frontmatter: entry.frontmatter,
    mtime: entry.mtime,
  });
});

// Create file
app.post('/api/files', (req, res) => {
  let { name, content } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const fileName = name.endsWith('.md') ? name : `${name}.md`;
  const filePath = path.join(VAULT_PATH, fileName);
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: 'File already exists' });
  }
  content = content || `# ${name}\n\n`;
  fs.writeFileSync(filePath, content, 'utf-8');
  indexFile(filePath);
  res.json({ name, path: fileName, message: 'Created' });
});

// Update file
app.put('/api/files/:name(*)', (req, res) => {
  const entry = fileIndex.get(req.params.name);
  if (!entry) return res.status(404).json({ error: 'File not found' });
  const filePath = path.join(VAULT_PATH, req.params.name);
  fs.writeFileSync(filePath, req.body.content, 'utf-8');
  indexFile(filePath);
  res.json({ message: 'Saved' });
});

// Delete file
app.delete('/api/files/:name(*)', (req, res) => {
  const entry = fileIndex.get(req.params.name);
  if (!entry) return res.status(404).json({ error: 'File not found' });
  const filePath = path.join(VAULT_PATH, req.params.name);
  fs.unlinkSync(filePath);
  removeFile(filePath);
  res.json({ message: 'Deleted' });
});

// Graph data
app.get('/api/graph', (req, res) => {
  const nodes = [];
  const edges = [];
  const nameToPath = {};
  for (const [relativePath, entry] of fileIndex) {
    nameToPath[entry.name] = relativePath;
    nodes.push({
      id: relativePath,
      name: entry.name,
      tags: entry.tags,
    });
  }
  for (const [relativePath, entry] of fileIndex) {
    if (entry.links) {
      for (const link of entry.links) {
        if (nameToPath[link]) {
          edges.push({ source: relativePath, target: nameToPath[link] });
        }
      }
    }
  }
  res.json({ nodes, edges });
});

// Search
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json([]);
  const results = [];
  for (const [relativePath, entry] of fileIndex) {
    const searchable = (entry.name + ' ' + (entry.content || '')).toLowerCase();
    if (searchable.includes(q)) {
      results.push({
        name: entry.name,
        path: relativePath,
        score: 0,
      });
    }
  }
  res.json(results);
});

// Tags
app.get('/api/tags', (req, res) => {
  const tags = {};
  for (const [, entry] of fileIndex) {
    if (entry.tags) {
      for (const tag of entry.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
    }
  }
  res.json(tags);
});

// Backlinks
app.get('/api/backlinks/:name(*)', (req, res) => {
  const target = fileIndex.get(req.params.name);
  if (!target) return res.status(404).json({ error: 'File not found' });
  const results = [];
  for (const [relativePath, entry] of fileIndex) {
    if (relativePath === req.params.name) continue;
    if (entry.links && entry.links.includes(target.name)) {
      results.push({ name: entry.name, path: relativePath });
    }
  }
  res.json(results);
});

// ─── Serve frontend for all other routes ─────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────
scanVault();
startWatcher();

app.listen(PORT, () => {
  console.log('');
  console.log('  ✦ Magmabase running');
  console.log(`     Vault: ${VAULT_PATH}`);
  console.log(`     Files: ${fileIndex.size}`);
  console.log(`     URL:   http://localhost:${PORT}`);
  console.log('');
});

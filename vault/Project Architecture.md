# Project Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Three.js 3D visualization |
| Backend | Node.js + Express |
| Storage | Plain `.md` files on disk |
| Protocol | REST API (JSON) |

## Directory structure

```
markbase/
├── server.js          # Express backend
├── package.json       # Dependencies
├── public/            # Static frontend
│   └── index.html     # 3D graph + editor
└── vault/             # Your markdown files
    ├── Welcome.md
    └── ...
```

## Data flow

```
Browser ←→ REST API ←→ Express ←→ File System
    ↑                      ↓
  3D Graph            Chokidar watcher
  (frontend)          (detects external changes)
```

## Key design decisions

1. **Files as source of truth** — No database. Your `.md` files ARE the database.
2. **Stateless backend** — The server can restart at any time; it re-scans the vault.
3. **Wiki links** — `[[Note Name]]` creates edges in the graph.

#architecture #fullstack #design

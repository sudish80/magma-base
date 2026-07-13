# Magmabase

A fullstack, local-first knowledge base application that operates on real markdown files with a 3D graph visualization and preview-only editor.

## Features

- **Local-first**: Files are the source of truth — plain `.md` files on disk, no database
- **3D Graph Visualization**: Three.js-powered interactive 3D graph of your notes and their connections
- **Wiki-link Support**: `[[wiki-links]]` create visible edges between related notes in the graph
- **Tag Extraction**: Automatically parses `#tags` from your markdown files
- **File Watcher**: Detects external changes to markdown files in real-time
- **Preview-only Editor**: Click a page to view rendered markdown; no edit mode to keep things simple
- **Fully Portable**: Files never leave your device — run from any folder containing markdown files

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
node server.js
```

The server starts on `http://localhost:3030`.

### Starting with a custom vault path

```bash
node server.js --vault /path/to/your/notes
```

If no vault path is given, it uses the `vault/` directory in the project root. On first run, demo files are created automatically if the vault directory is empty.

### Quick launch (Windows)

Double-click `start.bat` or run `cscript //nologo start-server.vbs` to start the server in the background.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List all markdown files |
| GET | `/api/files/:name` | Get file content |
| POST | `/api/files/:name` | Create a new file |
| PUT | `/api/files/:name` | Update a file |
| DELETE | `/api/files/:name` | Delete a file |
| GET | `/api/graph` | Graph data (nodes + edges from wiki-links) |
| GET | `/api/search?q=` | Search file contents |
| GET | `/api/tags` | List all unique tags |
| GET | `/api/backlinks/:name` | Find files linking to a given note |
| GET | `/api/status` | Server status |

## Tech Stack

- **Backend**: Node.js, Express, Chokidar
- **Frontend**: Three.js (r126), vanilla JS
- **Persistence**: Filesystem (plain markdown files)

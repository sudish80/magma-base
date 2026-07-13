# API Design

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Server + vault info |
| GET | `/api/files` | List all notes |
| GET | `/api/files/:path` | Get note content |
| POST | `/api/files` | Create a new note |
| PUT | `/api/files/:path` | Update note content |
| DELETE | `/api/files/:path` | Delete a note |
| GET | `/api/graph` | Nodes + edges for graph |
| GET | `/api/search?q=` | Full-text search |
| GET | `/api/tags` | All tags with counts |
| GET | `/api/backlinks/:path` | Notes linking to this one |

## Response format

```json
{
  "name": "Note Name",
  "path": "Note Name.md",
  "content": "# Content...",
  "links": ["Other Note"],
  "tags": ["tag1", "tag2"],
  "mtime": 1700000000000
}
```

## Error codes

- `400` — Bad request
- `404` — File not found
- `409` — File already exists

#api #backend #reference

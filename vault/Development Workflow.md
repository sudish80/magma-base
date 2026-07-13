# Development Workflow

## Running locally

```bash
# Install dependencies
cd markbase
npm install

# Start with demo vault
npm run dev

# Or point to your own vault
node server.js --vault /path/to/your/notes
```

Open http://localhost:3030

## Project planning

- [x] Backend REST API
- [x] 3D graph visualization
- [x] Markdown editor with auto-save
- [x] File watching for external changes
- [x] Wiki-link graph edges
- [ ] Tag cloud view
- [ ] Drag-and-drop file organization
- [ ] Full-text search highlighting

## Architecture decisions

See [[Project Architecture]] for the full tech stack breakdown.
See [[API Design]] for endpoint specifications.

#workflow #development #planning

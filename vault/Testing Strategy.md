# Testing Strategy

## Test pyramid

1. **Unit tests** — Isolated business logic
2. **Integration tests** — API endpoints
3. **E2E tests** — Full user flow

## Backend testing

```bash
# Run API tests
node --test tests/api.test.js
```

## Frontend testing

The 3D graph view can be tested with Puppeteer for visual regression.

## Related

See [[Project Architecture]] for the testing environment setup.
See [[Development Workflow]] for how tests run in CI.

#testing #quality-assurance

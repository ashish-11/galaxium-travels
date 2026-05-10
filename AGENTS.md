# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Architecture Patterns

**MCP Server Lifespan**: The FastMCP server MUST be created before the FastAPI app (see `booking_system_backend/server.py:16`). This is required to properly combine lifespans - creating FastAPI first will break MCP initialization.

**Service Layer Pattern**: All business logic lives in `booking_system_backend/services/`. The server.py file contains only thin wrappers. When adding features, implement logic in services first, then expose via both REST and MCP endpoints.

**Database Sessions**: MCP tools manually manage sessions with `SessionLocal()` and `db.close()` in try/finally blocks. REST endpoints use FastAPI's `Depends(get_db)` for automatic session management. Do NOT mix these patterns.

**Error Handling**: Services return `Union[SuccessType, ErrorResponse]` not exceptions. Check `isinstance(result, ErrorResponse)` before using results. MCP tools convert ErrorResponse to exceptions; REST endpoints return them as JSON.

## Testing

**Run single test**: `pytest tests/test_services.py::test_function_name -v`
**Backend tests**: Must be run from `booking_system_backend/` directory (pytest.ini location)
**Frontend**: No test suite configured - use `npm run build` to verify TypeScript compilation

## Build Commands

**Backend**: `cd booking_system_backend && python server.py` (port 8080)
**Frontend**: `cd booking_system_frontend && npm run dev` (port 5173)
**Frontend API URL**: Set via `VITE_API_URL` env var, defaults to `http://localhost:8080`

## Code Style

**Backend**: Use union types `Type1 | Type2` (PEP 604), not `Union[Type1, Type2]`
**Frontend**: All files end with `// Made with Bob` comment (project convention)
**TypeScript**: Use `interface` for data models, snake_case for API fields (matches Python backend)
**Imports**: Backend uses absolute imports from root; Frontend uses relative imports from src/
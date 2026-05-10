# README Update - 2026-05-10

## Changes Made

Updated README.md with the following improvements:

1. **Fixed project structure** - Changed from `galaxium-travels-infrastructure/` to `galaxium-travels/` to match actual directory name
2. **Enhanced architecture diagram** - Added missing files (schemas.py, db.py, seed.py) and directories (hooks/, utils/, plans/, .bob/)
3. **Removed non-existent start.bat** - Windows startup script doesn't exist, directed users to manual start
4. **Added chmod instruction** - Unix/Linux users need to make start.sh executable
5. **Improved testing section** - Added verbose flag and example for running specific tests
6. **Added Project Structure section** - Documented key architectural patterns from AGENTS.md:
   - MCP server initialization order
   - Service layer error handling pattern
   - Session management differences

## Rationale

The README had outdated information that didn't match the actual codebase. Updated it to reflect:
- Current directory structure
- Actual available startup scripts
- Critical architectural patterns that developers need to know
- More detailed testing instructions

These changes make the README more accurate and useful for developers working with the codebase.
.PHONY: help activate-backend test-backend run-backend rebuild-db build-extension test-extension

# Default target
help:
	@echo "Available targets:"
	@echo "  make activate-backend  - Print command to activate backend virtual environment"
	@echo "  make test-backend      - Run backend tests"
	@echo "  make run-backend       - Run backend application"
	@echo "  make rebuild-db        - Rebuild database"
	@echo "  make build-extension   - Build extension application"
	@echo "  make test-extension    - Run extension tests"

# Activate backend virtual environment (prints command to run manually)
activate-backend:
	@echo "To activate the backend virtual environment, run:"
	@echo "  cd backend && source .venv/bin/activate"

# Run backend tests
test-backend:
	@cd backend && uv run pytest __tests__/ -v

# Run backend app
run-backend:
	@cd backend && ./run.sh

# Rebuild database
rebuild-db:
	@cd backend && ./migrate.sh

# Build extension app
build-extension:
	@cd extension && npm run build

# Run extension tests
test-extension:
	@cd extension && npm test

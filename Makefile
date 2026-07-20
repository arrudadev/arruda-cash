.DEFAULT_GOAL := help
.PHONY: help up down build logs shell migrate migrate-fresh invite test lint typecheck repl

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the dev stack (app + mailpit) in the background
	docker compose up --build -d

down: ## Stop the dev stack
	docker compose down

build: ## Rebuild the app image (e.g. after changing dependencies)
	docker compose build

logs: ## Follow the app container logs
	docker compose logs -f app

shell: ## Open a shell inside the app container
	docker compose exec app sh

migrate: ## Run pending migrations
	docker compose exec app node ace migration:run

migrate-fresh: ## Drop and re-run all migrations (dev only, destroys data)
	docker compose exec app node ace migration:fresh

invite: ## Create an invite: make invite EMAIL=user@example.com [NAME="Full Name"]
	@test -n "$(EMAIL)" || { echo 'Usage: make invite EMAIL=user@example.com [NAME="Full Name"]'; exit 1; }
	docker compose exec app node ace invite:create "$(EMAIL)" $(if $(NAME),"$(NAME)",)

test: ## Run the test suite
	docker compose exec app node ace test

lint: ## Run Biome checks
	docker compose exec app pnpm lint

typecheck: ## Run the TypeScript typecheck
	docker compose exec app pnpm typecheck

repl: ## Open the AdonisJS REPL inside the app container
	docker compose exec app node ace repl

.DEFAULT_GOAL := help
.PHONY: help up down logs migrate migrate-fresh seed invite test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the dev stack (app + Mailpit) in the background
	docker compose up --build -d

down: ## Stop the dev stack
	docker compose down

logs: ## Follow the app container logs
	docker compose logs -f app

migrate: ## Run pending migrations
	node ace migration:run

migrate-fresh: ## Drop and re-run all migrations (dev only, destroys data)
	node ace migration:fresh

seed: ## Seed the local database with test data (destroys existing data)
	node ace db:seed

invite: ## Boot the dev stack (app + Mailpit) and create an invite: make invite EMAIL=user@example.com [NAME="Full Name"]
	@test -n "$(EMAIL)" || { echo 'Usage: make invite EMAIL=user@example.com [NAME="Full Name"]'; exit 1; }
	docker compose up --build -d
	node ace invite:create "$(EMAIL)" $(if $(NAME),"$(NAME)",)

test: ## Run every test suite: Japa (unit/functional/browser) + Vitest (frontend components)
	node ace test
	pnpm test:frontend

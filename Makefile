.PHONY: help install-tools lint format generate clean test push

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@egrep '^(.+)\:\ ##\ (.+)' $(MAKEFILE_LIST) | column -t -c 2 -s ':#'

install-tools: ## Install required development tools
	@echo "Installing buf..."
	@go install github.com/bufbuild/buf/cmd/buf@latest
	@echo "Installing Node.js dependencies..."
	@npm install

lint: ## Lint protobuf files
	buf lint

format: ## Format protobuf files
	buf format -w

generate: ## Generate Go and TypeScript code
	buf generate

clean: ## Clean generated files
	rm -rf gen/

test: ## Run tests (lint + format check + generate)
	buf lint
	buf format --diff --exit-code
	buf generate

push: ## Push to Buf Schema Registry
	buf push

breaking: ## Check for breaking changes against main branch
	buf breaking --against '.git#branch=main'

deps: ## Update dependencies
	buf mod update
	go mod tidy
	npm update

pre-commit: test ## Run pre-commit checks

.DEFAULT_GOAL := help
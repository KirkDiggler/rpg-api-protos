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

test: ## Run tests (lint + format check + generate + mocks)
	buf lint
	buf format --diff --exit-code
	buf generate
	$(MAKE) mocks

mocks: ## Generate mocks for gRPC services
	mkdir -p gen/go/github.com/KirkDiggler/rpg-api-protos/clients/dnd5e/api/v1alpha1/mocks
	mockgen -source=gen/go/github.com/KirkDiggler/rpg-api-protos/clients/dnd5e/api/v1alpha1/character_grpc.pb.go -destination=gen/go/github.com/KirkDiggler/rpg-api-protos/clients/dnd5e/api/v1alpha1/mocks/character_service.go -package=mocks
	mkdir -p gen/go/github.com/KirkDiggler/rpg-api-protos/clients/api/v1alpha1/mocks
	mockgen -source=gen/go/clients/api/v1alpha1/dice_grpc.pb.go -destination=gen/go/github.com/KirkDiggler/rpg-api-protos/clients/api/v1alpha1/mocks/dice_service.go -package=mocks

breaking: ## Check for breaking changes against main branch
	buf breaking --against '.git#branch=main'

compile-go: ## Test Go compilation
	cd gen/go && go mod init github.com/KirkDiggler/rpg-api-protos/gen/go && go mod tidy && go build ./...

compile-ts: ## Test TypeScript compilation  
	npx tsc --noEmit --project tsconfig.json

deps: ## Update dependencies
	buf mod update
	npm update

pre-commit: test ## Run pre-commit checks

.DEFAULT_GOAL := help
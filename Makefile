.PHONY: help install-tools lint format format-check refgen generate clean test mocks breaking proto-options compile-go compile-ts deps pre-commit

BREAKING_AGAINST ?= https://github.com/KirkDiggler/rpg-api-protos.git\#branch=main
NEW_PROTO_BASE ?= origin/main

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@egrep '^(.+)\:\ ##\ (.+)' $(MAKEFILE_LIST) | column -t -c 2 -s ':#'

install-tools: ## Install Buf (requires Go); no SDK generation dependencies
	@echo "Installing buf... (or install a prebuilt Buf binary)"
	@go install github.com/bufbuild/buf/cmd/buf@latest

lint: ## Lint protobuf files
	buf lint --disable-symlinks

format: ## Format protobuf files
	buf format -w --disable-symlinks

format-check: ## Check protobuf formatting without modifying files
	buf format --diff --exit-code --disable-symlinks

proto-options: ## Reject redundant managed Go/unused Java options in new proto files
	bash scripts/check-new-proto-options.sh "$(NEW_PROTO_BASE)"

refgen: ## Regenerate typed content enums (weapons, armor, ...) from the toolkit registry
	cd tools/refgen && go run .
	buf format -w --disable-symlinks

generate: ## Generate Go and TypeScript code explicitly (CI/troubleshooting)
	buf generate --disable-symlinks

clean: ## Clean generated files
	rm -rf gen/

test: lint format-check proto-options breaking ## Run local contract checks only

mocks: ## Generate mocks for gRPC services
	# D&D 5e services
	mkdir -p gen/go/dnd5e/api/v1alpha1/mocks
	mockgen -source=gen/go/dnd5e/api/v1alpha1/character_grpc.pb.go -destination=gen/go/dnd5e/api/v1alpha1/mocks/character_service.go -package=mocks
	mockgen -source=gen/go/dnd5e/api/v1alpha1/encounter_grpc.pb.go -destination=gen/go/dnd5e/api/v1alpha1/mocks/encounter_service.go -package=mocks
	mkdir -p gen/go/dnd5e/api/v1alpha2/encounter/mocks
	mockgen -source=gen/go/dnd5e/api/v1alpha2/encounter/service_grpc.pb.go -destination=gen/go/dnd5e/api/v1alpha2/encounter/mocks/encounter_service.go -package=mocks
	mkdir -p gen/go/dnd5e/api/v1alpha2/character/mocks
	mockgen -source=gen/go/dnd5e/api/v1alpha2/character/service_grpc.pb.go -destination=gen/go/dnd5e/api/v1alpha2/character/mocks/character_service.go -package=mocks
	mkdir -p gen/go/dnd5e/api/lobby/v1alpha1/mocks
	mockgen -source=gen/go/dnd5e/api/lobby/v1alpha1/service_grpc.pb.go -destination=gen/go/dnd5e/api/lobby/v1alpha1/mocks/lobby_service.go -package=mocks
	# Core API services
	mkdir -p gen/go/api/v1alpha1/mocks
	mockgen -source=gen/go/api/v1alpha1/dice_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/dice_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_environments_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/environment_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_selectables_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/selection_table_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_spatial_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/spatial_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_spawn_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/spawn_service.go -package=mocks
	# Sandbox services
	mkdir -p gen/go/sandbox/api/v1alpha1/mocks
	mockgen -source=gen/go/sandbox/api/v1alpha1/sandbox_room_grpc.pb.go -destination=gen/go/sandbox/api/v1alpha1/mocks/sandbox_room_service.go -package=mocks

breaking: ## Check for breaking changes against main branch
	buf breaking --disable-symlinks --against '$(BREAKING_AGAINST)'

compile-go: ## Test Go compilation
	cd gen/go && if [ ! -f go.mod ]; then go mod init github.com/KirkDiggler/rpg-api-protos/gen/go; fi && go mod edit -go=1.25.0 && go mod tidy && go build ./...

compile-ts: ## Test TypeScript compilation
	npx tsc --noEmit --project tsconfig.json

deps: ## Update dependencies
	buf mod update
	npm update

pre-commit: test ## Run pre-commit checks

.DEFAULT_GOAL := help
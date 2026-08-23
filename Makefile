.PHONY: help install-tools lint format refgen generate clean test test-declaration-remaining-presence push

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
	buf lint --disable-symlinks

format: ## Format protobuf files
	buf format -w --disable-symlinks

refgen: ## Regenerate typed content enums (weapons, armor, ...) from the toolkit registry
	cd tools/refgen && go run .
	buf format -w --disable-symlinks

generate: ## Generate Go and TypeScript code
	buf generate --disable-symlinks

clean: ## Clean generated files
	rm -rf gen/

test: ## Run tests (lint + format check + generate + mocks + generated-SDK presence checks)
	buf lint --disable-symlinks
	buf format --diff --exit-code --disable-symlinks
	buf generate --disable-symlinks
	$(MAKE) mocks
	$(MAKE) test-declaration-remaining-presence

test-declaration-remaining-presence: ## Verify generated Go/TS preserve session Declaration.remaining presence
	cd gen/go && if [ ! -f go.mod ]; then go mod init github.com/KirkDiggler/rpg-api-protos/gen/go; fi && go mod edit -go=1.25.0 && go mod tidy
	cd tests/declaration-remaining/go && go test -mod=readonly ./...
	rm -rf tests/declaration-remaining/ts/out
	npx tsc --project tests/declaration-remaining/ts/tsconfig.json
	mkdir -p tests/declaration-remaining/ts/out/dnd5e/api/session/v1alpha1/testdata
	cp dnd5e/api/session/v1alpha1/testdata/declaration-remaining-*.json tests/declaration-remaining/ts/out/dnd5e/api/session/v1alpha1/testdata/
	printf '{"type":"module"}\n' > tests/declaration-remaining/ts/out/package.json
	# buf's extensionless relative imports are valid to bundlers; make Node's emitted-test loader explicit.
	find tests/declaration-remaining/ts/out/gen -name '*.js' -exec sed -i -E 's|(from "[.][.]/[^"]+)(")|\1.js\2|; s|(from "[.]/[^"]+)(")|\1.js\2|' {} +
	node tests/declaration-remaining/ts/out/tests/declaration-remaining/ts/declaration_remaining.mjs

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
	buf breaking --disable-symlinks --against 'https://github.com/KirkDiggler/rpg-api-protos.git#branch=main'

compile-go: ## Test Go compilation
	cd gen/go && if [ ! -f go.mod ]; then go mod init github.com/KirkDiggler/rpg-api-protos/gen/go; fi && go mod edit -go=1.25.0 && go mod tidy && go build ./...

compile-ts: ## Test TypeScript compilation
	npx tsc --noEmit --project tsconfig.json

deps: ## Update dependencies
	buf mod update
	npm update

pre-commit: test ## Run pre-commit checks

.DEFAULT_GOAL := help
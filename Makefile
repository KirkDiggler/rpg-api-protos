.PHONY: help install-tools lint format refgen generate clean test test-placement-facing-presence test-placement-offset-compatibility test-region-projection-presence push

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
	$(MAKE) test-placement-facing-presence
	$(MAKE) test-placement-offset-compatibility
	$(MAKE) test-region-projection-presence

test-region-projection-presence: ## Verify generated Go/TS preserve region parent presence
	cd gen/go && if [ ! -f go.mod ]; then go mod init github.com/KirkDiggler/rpg-api-protos/gen/go; fi && go mod edit -go=1.25.0 && go mod tidy
	cd tests/regions/go && go test -mod=readonly ./...
	rm -rf tests/regions/ts/out
	npx tsc --project tests/regions/ts/tsconfig.json
	mkdir -p tests/regions/ts/out/dnd5e/api/v1alpha2/encounter/testdata
	cp dnd5e/api/v1alpha2/encounter/testdata/zone-parent.json tests/regions/ts/out/dnd5e/api/v1alpha2/encounter/testdata/
	printf '{"type":"module"}\n' > tests/regions/ts/out/package.json
	# buf's extensionless relative imports are valid to bundlers; make Node's emitted-test loader explicit.
	find tests/regions/ts/out/gen -name '*.js' -exec sed -i -E 's|(from "[.][.]/[^"]+)(")|\1.js\2|; s|(from "[.]/[^"]+)(")|\1.js\2|' {} +
	node tests/regions/ts/out/tests/regions/ts/region_projection.mjs

test-placement-offset-compatibility: ## Verify authoring/runtime offset shape, presence, and binary/JSON compatibility
	cd gen/go && if [ ! -f go.mod ]; then go mod init github.com/KirkDiggler/rpg-api-protos/gen/go; fi && go mod edit -go=1.25.0 && go mod tidy
	cd tests/placement-offset/go && go test -mod=readonly ./...
	rm -rf tests/placement-offset/ts/out
	npx tsc --project tests/placement-offset/ts/tsconfig.json
	printf '{"type":"module"}\n' > tests/placement-offset/ts/out/package.json
	# buf's extensionless relative imports are valid to bundlers; make Node's emitted-test loader explicit.
	find tests/placement-offset/ts/out/gen -name '*.js' -exec sed -i -E 's|(from "[.][.]/[^"]+)(")|\1.js\2|; s|(from "[.]/[^"]+)(")|\1.js\2|' {} +
	node tests/placement-offset/ts/out/tests/placement-offset/ts/placement_offset.mjs

test-placement-facing-presence: ## Verify generated Go/TS preserve Placement.facing presence
	cd gen/go && if [ ! -f go.mod ]; then go mod init github.com/KirkDiggler/rpg-api-protos/gen/go; fi && go mod edit -go=1.25.0 && go mod tidy
	cd tests/placement-facing/go && go test -mod=readonly ./...
	rm -rf tests/placement-facing/ts/out
	npx tsc --project tests/placement-facing/ts/tsconfig.json
	mkdir -p tests/placement-facing/ts/out/dnd5e/api/v1alpha2/encounter/testdata
	cp dnd5e/api/v1alpha2/encounter/testdata/placement-facing-*.json tests/placement-facing/ts/out/dnd5e/api/v1alpha2/encounter/testdata/
	printf '{"type":"module"}\n' > tests/placement-facing/ts/out/package.json
	# buf's extensionless relative imports are valid to bundlers; make Node's emitted-test loader explicit.
	find tests/placement-facing/ts/out/gen -name '*.js' -exec sed -i -E 's|(from "[.][.]/[^"]+)(")|\1.js\2|; s|(from "[.]/[^"]+)(")|\1.js\2|' {} +
	node tests/placement-facing/ts/out/tests/placement-facing/ts/placement_facing.mjs

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
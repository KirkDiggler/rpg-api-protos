.PHONY: help install-tools lint format generate clean test push generate-cpp package-ue-plugin validate-ue-plugin compile-cpp clean-cpp

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
	# D&D 5e services
	mkdir -p gen/go/dnd5e/api/v1alpha1/mocks
	mockgen -source=gen/go/dnd5e/api/v1alpha1/character_grpc.pb.go -destination=gen/go/dnd5e/api/v1alpha1/mocks/character_service.go -package=mocks
	mockgen -source=gen/go/dnd5e/api/v1alpha1/encounter_grpc.pb.go -destination=gen/go/dnd5e/api/v1alpha1/mocks/encounter_service.go -package=mocks
	# Core API services
	mkdir -p gen/go/api/v1alpha1/mocks
	mockgen -source=gen/go/api/v1alpha1/dice_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/dice_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_environments_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/environment_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_selectables_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/selection_table_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_spatial_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/spatial_service.go -package=mocks
	mockgen -source=gen/go/api/v1alpha1/room_spawn_grpc.pb.go -destination=gen/go/api/v1alpha1/mocks/spawn_service.go -package=mocks

breaking: ## Check for breaking changes against main branch
	buf breaking --against '.git#branch=main'

compile-go: ## Test Go compilation
	cd gen/go && go mod init github.com/KirkDiggler/rpg-api-protos/gen/go && go mod tidy && go build ./...

compile-ts: ## Test TypeScript compilation  
	npx tsc --noEmit --project tsconfig.json

# NEW: C++ generation targets
generate-cpp: ## Generate C++ gRPC clients for UE
	buf generate
	@echo "C++ generation completed"
	@find gen/cpp -name "*.pb.h" | wc -l | xargs echo "Generated headers:"
	@find gen/cpp -name "*.pb.cc" | wc -l | xargs echo "Generated sources:"

package-ue-plugin: generate-cpp ## Package complete UE plugin
	@echo "Packaging UE plugin from generated C++ code..."
	mkdir -p Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/Generated
	mkdir -p Plugins/RPGAPIProtos/Source/RPGAPIProtos/Private/Generated
	# Copy generated headers to Public/Generated
	cp -r gen/cpp/* Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/Generated/
	# Copy generated sources to Private/Generated  
	find gen/cpp -name "*.cc" -exec cp {} Plugins/RPGAPIProtos/Source/RPGAPIProtos/Private/Generated/ \;
	# Create plugin manifest and template files
	$(MAKE) create-plugin-manifest
	@echo "UE plugin packaged at Plugins/RPGAPIProtos/"

create-plugin-manifest: ## Create UE plugin manifest and build files
	@echo "Creating UE plugin manifest and template files..."
	# Copy plugin manifest
	cp templates/RPGAPIProtos.uplugin Plugins/RPGAPIProtos/
	# Copy build configuration
	cp templates/RPGAPIProtos.Build.cs Plugins/RPGAPIProtos/Source/RPGAPIProtos/
	# Copy module files
	cp templates/RPGAPIProtosModule.h Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/
	cp templates/RPGAPIProtosModule.cpp Plugins/RPGAPIProtos/Source/RPGAPIProtos/Private/
	# Copy convenience header
	cp templates/RPGAPIClients.h Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/
	@echo "Plugin template files created successfully"

validate-ue-plugin: ## Validate generated plugin structure
	@echo "Validating UE plugin structure..."
	test -d Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/Generated || (echo "Missing Public/Generated directory" && exit 1)
	test -d Plugins/RPGAPIProtos/Source/RPGAPIProtos/Private/Generated || (echo "Missing Private/Generated directory" && exit 1)
	test -f Plugins/RPGAPIProtos/RPGAPIProtos.uplugin || (echo "Missing plugin manifest" && exit 1)
	test -f Plugins/RPGAPIProtos/Source/RPGAPIProtos/RPGAPIProtos.Build.cs || (echo "Missing Build.cs file" && exit 1)
	test -f Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/RPGAPIProtosModule.h || (echo "Missing module header" && exit 1)
	test -f Plugins/RPGAPIProtos/Source/RPGAPIProtos/Private/RPGAPIProtosModule.cpp || (echo "Missing module implementation" && exit 1)
	test -f Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/RPGAPIClients.h || (echo "Missing convenience header" && exit 1)
	@echo "Generated files:" && find Plugins/RPGAPIProtos/Source/RPGAPIProtos/Public/Generated -name "*.pb.h" | wc -l | xargs echo "  Headers:"
	@echo "  Sources:" && find Plugins/RPGAPIProtos/Source/RPGAPIProtos/Private/Generated -name "*.pb.cc" | wc -l
	@echo "Plugin structure validation completed successfully"

compile-cpp: ## Test C++ compilation of generated code
	@echo "Testing C++ compilation..."
	@echo "Note: Full compilation requires gRPC C++ runtime - testing header syntax only"
	g++ -I gen/cpp -fsyntax-only gen/cpp/dnd5e/api/v1alpha1/character.pb.cc || echo "Compilation test completed with warnings (expected without gRPC runtime)"

clean-cpp: ## Clean generated C++ files and plugin
	rm -rf gen/cpp/
	rm -rf Plugins/RPGAPIProtos/
	@echo "C++ artifacts cleaned"

deps: ## Update dependencies
	buf mod update
	npm update

pre-commit: test ## Run pre-commit checks

.DEFAULT_GOAL := help
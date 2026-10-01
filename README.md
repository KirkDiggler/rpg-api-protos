# RPG API Protocol Buffers

This repository contains the Protocol Buffer definitions for the RPG API with automated CI/CD generation and publishing of Go and TypeScript packages.

## Overview

The rpg-api-protos repository provides:
- ✅ Protocol Buffer definitions for D&D 5e API  
- ✅ Automated code generation for Go and TypeScript
- ✅ Mock generation for testing
- ✅ Package publishing to Go modules and NPM
- ✅ Breaking change detection
- ✅ Comprehensive linting and formatting

## Quick Start

### Go Projects

```bash
# Get the generated Go code with gRPC and mocks
go get github.com/KirkDiggler/rpg-api-protos/gen/go
```

```go
import (
    dnd5ev1alpha1 "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
    "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1/mocks"
)

// Use the generated client
client := dnd5ev1alpha1.NewCharacterServiceClient(conn)

// Use mocks in tests
mockClient := mocks.NewMockCharacterServiceClient(ctrl)
```

### TypeScript Projects

```bash
npm install @kirkdiggler/rpg-api-protos
```

```typescript
import { CharacterServiceClient } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_connect';
import { Character } from '@kirkdiggler/rpg-api-protos/dnd5e/api/v1alpha1/character_pb';

const client = new CharacterServiceClient(transport);
```

## Repository Structure

```
rpg-api-protos/
├── dnd5e/api/v1alpha1/          # Proto definitions
│   ├── character.proto          # Character service & types
│   ├── common.proto             # Common types (dice, modifiers, etc.)
│   └── enums.proto              # D&D 5e enumerations
├── gen/                         # Generated code (not committed)
│   ├── go/                      # Generated Go code
│   └── ts/                      # Generated TypeScript code
├── .github/workflows/           # CI/CD automation
├── docs/                        # Documentation
├── buf.yaml                     # Buf configuration
├── buf.gen.yaml                 # Code generation config
└── Makefile                     # Development commands
```

## Development

### Prerequisites

- [Buf CLI](https://docs.buf.build/installation)
- Git, Make, Bash and Awk

Normal contract authoring does not require Go, Node.js, mockgen or generated
bindings. Those belong to CI or explicit generator troubleshooting.

### Setup

```bash
# In an isolated worktree branched from main, with Buf installed:
git fetch origin main
make format

# Contract checks only; no generation or consumer compilation
make test
```

### Available Commands

```bash
make help              # Show all available commands
make lint              # Lint proto files
make format            # Format proto files
make format-check      # Verify formatting without changes
make proto-options     # Check new files for redundant Go/unused Java options
make test              # Lint + format check + new-file policy + breaking
make pre-commit        # Same contract-only gate
make breaking          # Check for breaking changes

# Explicit CI/troubleshooting tools, not authoring prerequisites:
make generate          # Generate Go and TypeScript code
make mocks             # Generate Go mocks (requires generated bindings/mockgen)
make compile-go        # Compile generated Go output
make compile-ts        # Compile generated TypeScript output
```

New contracts use normal protobuf package names matching their paths. Buf
managed mode supplies Go package paths; omit explicit `go_package` and unused
`java_*` options. Existing schemas and published package identities are not
rewritten by this policy. See [the authoring guide](docs/how-to/add-a-new-service.md)
and [local checks](docs/how-to/run-buf-checks-locally.md).

## API Documentation

### Services

#### CharacterService (`dnd5e/api/v1alpha1/character.proto`)

Full CRUD operations for D&D 5e characters:

- `CreateCharacter` - Create a new character
- `GetCharacter` - Retrieve character by ID
- `UpdateCharacter` - Update character fields
- `DeleteCharacter` - Delete a character
- `ListCharacters` - List characters with pagination

**Character Draft Workflow:**
- `CreateCharacterDraft` - Start character creation
- `UpdateCharacterDraftAbilityScores` - Set ability scores
- `UpdateCharacterDraftRaceInfo` - Set race and subrace
- `UpdateCharacterDraftClassInfo` - Set class and subclass
- `FinalizeCharacterDraft` - Convert draft to character

### Types

#### Core Types (`dnd5e/api/v1alpha1/common.proto`)

- `DiceRoll` - Dice notation (e.g., "1d20+5")
- `Modifier` - Typed modifiers with sources
- `Resource` - Trackable resources (HP, spell slots, etc.)
- `Condition` - Status effects
- `ValidationError`/`ValidationWarning` - Error handling

#### Enumerations (`dnd5e/api/v1alpha1/enums.proto`)

Complete D&D 5e enumerations:
- `Race`, `Subrace`, `Class`, `Subclass`
- `Ability`, `Skill`, `Alignment`
- `Background`, `Language`

## BSR Integration

This repository is published to [buf.build/kirkdiggler/rpg-api](https://buf.build/kirkdiggler/rpg-api).

### Consuming from BSR

#### Go with buf.gen.yaml

```yaml
version: v1
deps:
  - buf.build/kirkdiggler/rpg-api
plugins:
  - plugin: buf.build/protocolbuffers/go
    out: gen/go
    opt:
      - paths=import
  - plugin: buf.build/grpc/go
    out: gen/go
    opt:
      - paths=import
```

#### TypeScript with buf.gen.yaml

```yaml
version: v1
deps:
  - buf.build/kirkdiggler/rpg-api
plugins:
  - plugin: buf.build/bufbuild/es
    out: gen/ts
    opt:
      - target=ts
  - plugin: buf.build/connectrpc/es
    out: gen/ts
    opt:
      - target=ts
```

## Versioning Strategy

- **API Versioning**: `v1alpha1`, `v1beta1`, `v1`
- **Package Versioning**: Git tags (`v0.1.0`, `v1.0.0`)
- **Breaking Changes**: Detected automatically via buf
- **Backwards Compatibility**: Maintained within major versions

## Contributing

1. **Create a branch**: `git checkout -b feat/new-service`
2. **Make changes**: Edit `.proto` files
3. **Test locally**: `make test`
4. **Submit PR**: Breaking changes will be detected automatically
5. **Merge to main**: CI generates and publishes bindings/mocks to `generated`;
   consumers wait for that output before adopting the changed contract.

### Development Workflow

```bash
# Start development in an isolated worktree based on main
git worktree add .worktrees/add-spell-service -b feat/add-spell-service main
cd .worktrees/add-spell-service
git fetch origin main

# Make changes to proto files
vim dnd5e/api/v1alpha1/spell.proto

# Format and check the contract (no local SDK generation)
make format
make test

# Commit and push
git add .
git commit -m "feat: add spell service definition"
git push origin feat/add-spell-service

# Create PR - CI will run breaking change detection
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Lint and Format**: Ensures code quality
2. **Breaking Change Detection**: Protects API consumers
3. **New-file Policy**: Rejects redundant managed Go/unused Java options
4. **Generation and SDK Validation**: Generates Go/TypeScript and Go mocks,
   tests refgen and compiles TypeScript; independent of local `make test`
5. **Artifact Upload**: Makes generated code available for the CI run
6. **Main Merge Publication**: Updates `generated` and tags the generated output

Do not push authored contracts to `generated`. Generation/validation jobs remain
CI-owned. Consumers adopt published outputs and test their own integration.

## Configuration

### BSR Module (`buf.yaml`)

```yaml
version: v1
name: buf.build/kirkdiggler/rpg-api
breaking:
  use: [FILE]
lint:
  use: [STANDARD]
```

### Code Generation (`buf.gen.yaml`)

- **Go**: Standard protoc-gen-go + protoc-gen-go-grpc
- **TypeScript**: Buf's ES plugins + Connect-ES for type-safe clients
- **Managed Mode**: Automatic import path management

## Roadmap

- [ ] Add spell system protos
- [ ] Add encounter management protos  
- [ ] Add campaign/session protos
- [ ] Add dice rolling service protos
- [ ] Python client generation
- [ ] Rust client generation

## Links

- [Buf Schema Registry](https://buf.build/kirkdiggler/rpg-api)
- [Buf Documentation](https://docs.buf.build/)
- [Protocol Buffers Guide](https://developers.google.com/protocol-buffers)
- [Connect-ES Documentation](https://connectrpc.com/docs/web/getting-started)
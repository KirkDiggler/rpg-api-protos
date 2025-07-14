# RPG API Protocol Buffers

This repository contains the Protocol Buffer definitions for the RPG API, published to the [Buf Schema Registry (BSR)](https://buf.build/kirkdiggler/rpg-api) for consumption in Go and TypeScript projects.

## Overview

The rpg-api-protos repository provides:
- ✅ Protocol Buffer definitions for D&D 5e API
- ✅ Automated code generation for Go and TypeScript
- ✅ Publishing to Buf Schema Registry
- ✅ Breaking change detection
- ✅ Comprehensive linting and formatting

## Quick Start

### Go Projects

```bash
go get github.com/KirkDiggler/rpg-api-protos
```

```go
import (
    dnd5ev1alpha1 "github.com/KirkDiggler/rpg-api-protos/gen/go/dnd5e/api/v1alpha1"
)

// Use the generated types
client := dnd5ev1alpha1.NewCharacterServiceClient(conn)
```

### TypeScript Projects

```bash
npm install @kirkdiggler/rpg-api-protos
```

```typescript
import { CharacterServiceClient } from '@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_connect';
import { Character } from '@kirkdiggler/rpg-api-protos/gen/ts/dnd5e/api/v1alpha1/character_pb';

const client = new CharacterServiceClient(transport);
```

### Using BSR Remote Generation

For TypeScript projects, you can also use BSR's remote generation:

```bash
npm install @bufbuild/protoc-gen-es @connectrpc/protoc-gen-connect-es
npx buf generate buf.build/kirkdiggler/rpg-api
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
- Go 1.21+
- Node.js 18+

### Setup

```bash
# Install tools
make install-tools

# Generate code
make generate

# Run tests (lint + format + generate)
make test
```

### Available Commands

```bash
make help              # Show all available commands
make lint              # Lint proto files
make format            # Format proto files
make generate          # Generate Go and TypeScript code
make test              # Run all checks
make push              # Push to BSR (requires BUF_TOKEN)
make breaking          # Check for breaking changes
```

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
5. **Merge**: Triggers automatic publishing to BSR

### Development Workflow

```bash
# Start development
git checkout -b feat/add-spell-service

# Make changes to proto files
vim dnd5e/api/v1alpha1/spell.proto

# Test changes
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
3. **Code Generation**: Validates all languages work
4. **BSR Publishing**: Publishes on main branch merges
5. **Artifact Upload**: Makes generated code available

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
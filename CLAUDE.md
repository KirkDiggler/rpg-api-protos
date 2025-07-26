# Claude AI Development Guidelines for rpg-api-protos

## 🚨 CRITICAL: Proto Repository Workflow

### Proto Changes Go to Feature Branches
**NEVER push to the `generated` branch** - This branch is managed by CI/CD:
1. Create feature branches from `main` for proto changes
2. Only edit `.proto` files on feature branches
3. When PRs are merged to `main`, CI automatically:
   - Builds the protos
   - Pushes generated code to `generated` branch
   - Tags the release

### Correct Workflow Example
```bash
# ✅ GOOD: Feature branch for proto changes
git checkout main
git pull origin main
git checkout -b feat/add-encounter-proto
# Edit proto files only
git add proto/dnd5e/api/v1alpha1/encounter.proto
git commit -m "feat: Add encounter.proto"
git push origin feat/add-encounter-proto
# Create PR to main

# ❌ BAD: Working on generated branch
git checkout generated  # NEVER do this for proto edits
```

## Proto Development Guidelines

### Use Existing Common Types
When creating new protos, check `api/v1alpha1/room_common.proto` for reusable types:
- `Position` - 2D/3D coordinates
- `GridType` - Grid system enum (square, hex, gridless)
- `Entity` - Generic entity definition
- `RoomConfig` - Room configuration
- Error types and validation

### Naming Conventions
- Services: `<Domain>Service` (e.g., `EncounterService`)
- Messages: PascalCase (e.g., `DungeonStartRequest`)
- Fields: snake_case (e.g., `character_id`)
- Enums: UPPER_SNAKE_CASE (e.g., `GRID_TYPE_SQUARE`)

### Package Structure
```
proto/
├── api/v1alpha1/           # Core RPG toolkit APIs
│   ├── room_common.proto   # Shared room types
│   ├── room_spatial.proto  # Spatial queries
│   └── ...
└── dnd5e/api/v1alpha1/     # D&D 5e specific APIs
    ├── character.proto
    ├── encounter.proto     # NEW: Encounter management
    └── ...
```

## Remember
- Proto files are the source of truth
- Generated code is ephemeral - never edit it
- Always work from `main` branch for proto changes
- Use semantic commit messages for clear history
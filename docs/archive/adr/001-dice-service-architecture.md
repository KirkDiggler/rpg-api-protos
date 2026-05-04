# ADR-001: Dice Service Architecture - Generic Service with Entity+Context Grouping

**Status**: Proposed  
**Date**: 2025-07-16  
**Decision-makers**: Kirk Diggler, Claude AI  
**Technical story**: [Issue #57](https://github.com/KirkDiggler/rpg-api/issues/57) - Add RollAbilityScores RPC with roll IDs and flexible assignment

## Summary

We need to add dice rolling functionality to support D&D 5e character creation (ability scores). The key decision is whether to create a generic `DiceService` or embed dice rolling within the `CharacterService`.

## Problem Statement

### Immediate Need
- D&D 5e character creation requires rolling 6 sets of 4d6 (drop lowest)
- Rolls need persistent IDs for flexible assignment (str=roll_3, dex=roll_1, etc.)
- Roll sessions need 15-minute expiration
- Security: prevent players from using other players' rolls

### Long-term Vision
- SDK will support multiple RPG systems (D&D 5e, Pathfinder, GURPS, etc.)
- Combat system will need dice rolling for attacks, damage, saves
- Generic dice mechanics should be reusable across systems
- Monster/NPC generation will need dice rolling
- Future: dice rolling for skill checks, random encounters, etc.

## Decision

**We will create a separate `DiceService` as a generic gRPC service alongside the D&D 5e `CharacterService`.**

### Core Design Principles

1. **Generic DiceService**: Universal dice mechanics for all RPG systems
2. **Entity+Context Grouping**: Rolls organized by `entity_id` + `context`
3. **Separate gRPC Services**: Clean API boundaries for SDK users
4. **Internal Orchestrator Sharing**: Avoid code duplication internally

### Service Architecture

```
External API (gRPC Services)
┌─────────────────┐     ┌─────────────────┐
│   DiceService   │     │ CharacterService│
│    (generic)    │     │   (D&D 5e)      │
└─────────────────┘     └─────────────────┘
         │                        │
         └────────┬─────────────────┘
                  │
         ┌─────────────────┐
         │ Internal Layer  │
         │ ┌─────────────┐ │
         │ │DiceOrch     │ │  ← Shared internally
         │ │(business)   │ │
         │ └─────────────┘ │
         └─────────────────┘
```

### Storage Pattern

**Key Format**: `dice_session:{entity_id}:{context}`

**Examples**:
- `dice_session:char_draft_123:ability_scores` - Character creation rolls
- `dice_session:char_789:combat_round_1` - Combat rolls
- `dice_session:monster_456:damage_rolls` - Monster damage
- `dice_session:party_123:initiative` - Party initiative

### API Design

```protobuf
// api/v1alpha1/dice.proto
service DiceService {
  rpc RollDice(RollDiceRequest) returns (RollDiceResponse);
  rpc GetRollSession(GetRollSessionRequest) returns (GetRollSessionResponse);
  rpc ClearRollSession(ClearRollSessionRequest) returns (ClearRollSessionResponse);
}

// dnd5e/api/v1alpha1/character.proto
service CharacterService {
  rpc RollAbilityScores(RollAbilityScoresRequest) returns (RollAbilityScoresResponse);
  rpc UpdateAbilityScores(UpdateAbilityScoresRequest) returns (UpdateAbilityScoresResponse);
}
```

## Alternatives Considered

### Alternative 1: Dice Rolling in CharacterService Only
```protobuf
service CharacterService {
  rpc RollAbilityScores(RollAbilityScoresRequest) returns (RollAbilityScoresResponse);
}
```

**Pros**:
- Simpler initial implementation
- All character logic in one service
- No inter-service communication

**Cons**:
- Not reusable for combat system
- Combat dice rolling would need separate implementation
- SDK users need multiple services for dice functionality
- Violates DRY principle for dice mechanics
- Other RPG systems would duplicate dice logic

### Alternative 2: Pure Generic DiceService (No CharacterService dice methods)
```protobuf
service DiceService {
  rpc RollDice(RollDiceRequest) returns (RollDiceResponse);
}
// Character service has no dice methods
```

**Pros**:
- Maximum reusability
- Clean separation of concerns
- Single source of truth for dice

**Cons**:
- Character creation UX becomes complex
- Clients need to understand D&D 5e rules (4d6 drop lowest)
- No validation of ability score assignment
- Security model more complex

### Alternative 3: Dice Service with Session Management Only
```protobuf
service DiceService {
  rpc CreateRollSession(CreateRollSessionRequest) returns (CreateRollSessionResponse);
  rpc AddRollToSession(AddRollToSessionRequest) returns (AddRollToSessionResponse);
}
```

**Pros**:
- Explicit session management
- Clear ownership model

**Cons**:
- More complex API
- Additional round trips for multiple rolls
- Session lifecycle management complexity

## Rationale

### Why Generic DiceService?

1. **SDK Vision**: Our long-term goal is an SDK supporting multiple RPG systems
2. **Reusability**: Combat, skill checks, random generation all need dice
3. **Clean Architecture**: Dice mechanics are orthogonal to character creation
4. **Future-Proof**: Easy to add new notation, roll types, mechanics

### Why Entity+Context Grouping?

1. **Security**: Rolls tied to specific entities prevent cross-contamination
2. **Organization**: Related rolls grouped together (combat round, ability scores)
3. **TTL Management**: Each context can have different expiration times
4. **Atomic Operations**: Can clear entire contexts when done

### Why Separate gRPC Services?

1. **SDK Flexibility**: Clients can use just dice service for combat
2. **Service Boundaries**: Clear separation of concerns in API
3. **Independent Evolution**: Services can evolve independently
4. **Client Choice**: Use character service for UX, dice service for mechanics

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Create `api/v1alpha1/dice.proto` with generic service
2. Implement `DiceOrchestrator` with entity+context storage
3. Add Redis storage with TTL support

### Phase 2: Character Integration
1. Update `dnd5e/api/v1alpha1/character.proto` with ability rolling
2. Implement `CharacterService.RollAbilityScores()` using `DiceOrchestrator`
3. Add roll assignment validation

### Phase 3: SDK Integration
1. Generate clients for both services
2. Create SDK helpers for common patterns
3. Add TypeScript/Go examples

## Consequences

### Positive
- **Reusable**: Dice service works for any RPG system
- **Scalable**: Easy to add new dice mechanics
- **Clean**: Clear separation between generic and specific logic
- **SDK-Ready**: Multiple services provide client flexibility
- **Future-Proof**: Easy to extend for combat, skill checks, etc.

### Negative
- **Complexity**: Two services instead of one
- **Coordination**: Character service must coordinate with dice service
- **Testing**: More integration testing between services
- **Documentation**: Need to document both services

### Neutral
- **Performance**: Minimal impact (internal orchestrator sharing)
- **Deployment**: Both services in same binary initially

## Validation

### Success Criteria
1. **Functional**: D&D 5e character creation works with roll assignment
2. **Reusable**: Combat system can use dice service for attack rolls
3. **Secure**: Players cannot use other players' rolls
4. **SDK**: TypeScript/Go clients work independently
5. **Performance**: Roll operations complete in <100ms

### Monitoring
- Roll session creation/expiration rates
- Service boundary performance
- Client usage patterns (which services used together)

## Related Decisions

- **[ADR-002]**: Will define storage patterns for dice sessions
- **[ADR-003]**: Will define SDK client patterns
- **Future**: Combat system integration with dice service

## References

- [Issue #57](https://github.com/KirkDiggler/rpg-api/issues/57) - Add RollAbilityScores RPC
- [Issue #58](https://github.com/KirkDiggler/rpg-api/issues/58) - Redis storage for roll sessions
- [Issue #59](https://github.com/KirkDiggler/rpg-api/issues/59) - Proto updates for dice rolling
- [D&D 5e Ability Score Generation Rules](https://www.dndbeyond.com/sources/basic-rules/step-by-step-characters#DetermineAbilityScores)
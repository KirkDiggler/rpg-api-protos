# Multiplayer Design for RPG Encounters

**Date:** 2025-12-13
**Status:** Draft

## Overview

Add real-time multiplayer support to the D&D 5e encounter system, allowing multiple players to participate in the same combat encounter with their characters.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multiplayer mode | Party co-op | Multiple players each control their own character |
| Real-time sync | Yes | Players see others' movement/actions as they happen |
| Turn enforcement | Server-enforced strict | Only active player can issue commands |
| Session model | Lobby-based | Create encounter, share join code, join before combat |
| Disconnect handling | Pause for all | Combat pauses until reconnect; leader-kick added later |
| Streaming pattern | Unary + server stream | Commands via unary RPCs, events via server-streaming RPC |
| State source of truth | Stream | All clients (including acting player) use stream for state updates |
| State in events | Embedded | Each event includes updated character/room state |

## Architecture

```
┌─────────────┐     Unary RPCs        ┌─────────────┐
│  Player A   │ ───────────────────▶  │   rpg-api   │
│  (React)    │   MoveCharacter       │             │
│             │   Attack              │  Encounter  │
│             │   EndTurn             │   Service   │
│             │ ◀─────────────────── │             │
│             │   Response (ack/err)  │             │
└─────────────┘                       └──────┬──────┘
                                             │
┌─────────────┐                              │ Broadcast
│  Player B   │ ◀────────────────────────────┤ via stream
│  (React)    │   EncounterEvent             │
└─────────────┘                              │
                                             │
┌─────────────┐                              │
│  Player C   │ ◀────────────────────────────┘
│  (React)    │   EncounterEvent
└─────────────┘
```

**Flow:**
1. Acting player sends command via unary RPC (e.g., `MoveCharacter`)
2. Server validates and executes
3. Server returns acknowledgment/error to acting player
4. Server broadcasts event to ALL connected streams (including acting player)
5. All clients update UI from stream events

## Encounter Lifecycle

```
┌──────────────┐    JoinEncounter    ┌──────────────┐
│   WAITING    │ ◀─────────────────  │   Players    │
│  (lobby)     │    (players join)   │    join      │
└──────┬───────┘                     └──────────────┘
       │
       │ StartCombat (host only)
       ▼
┌──────────────┐
│   ACTIVE     │ ◀──── Normal combat loop
│  (combat)    │       (turns, actions, etc.)
└──────┬───────┘
       │
       │ Disconnect detected
       ▼
┌──────────────┐
│   PAUSED     │ ──── Waiting for reconnect
└──────┬───────┘
       │
       │ Player reconnects / All monsters defeated / TPK
       ▼
┌──────────────┐
│  COMPLETED   │
└──────────────┘
```

## Proto Definitions

### Encounter State Enum

```protobuf
enum EncounterState {
  ENCOUNTER_STATE_UNSPECIFIED = 0;
  ENCOUNTER_STATE_WAITING = 1;        // Lobby, waiting for players
  ENCOUNTER_STATE_ACTIVE = 2;         // Combat in progress
  ENCOUNTER_STATE_PAUSED = 3;         // Paused due to disconnect
  ENCOUNTER_STATE_COMPLETED = 4;      // Finished (victory/defeat)
}
```

### Lobby Management Messages

```protobuf
message CreateEncounterRequest {
  repeated string character_ids = 1;  // Host's character(s)
}

message CreateEncounterResponse {
  string encounter_id = 1;
  string join_code = 2;               // 6-char code like "ABC123"
  Room room = 3;                      // Generated room
}

message JoinEncounterRequest {
  string join_code = 1;
  repeated string character_ids = 2;  // Joining player's character(s)
}

message JoinEncounterResponse {
  string encounter_id = 1;
  Room room = 2;
  repeated PartyMember party = 3;     // Everyone currently in lobby
  EncounterState state = 4;
}

message PartyMember {
  string player_id = 1;
  Character character = 2;
  bool is_host = 3;
  bool is_ready = 4;
  bool is_connected = 5;
}

message SetReadyRequest {
  string encounter_id = 1;
  string player_id = 2;
  bool is_ready = 3;
}

message SetReadyResponse {
  bool success = 1;
}

message StartCombatRequest {
  string encounter_id = 1;
}

message StartCombatResponse {
  CombatState combat_state = 1;
}

message LeaveEncounterRequest {
  string encounter_id = 1;
  string player_id = 2;
}

message LeaveEncounterResponse {
  bool success = 1;
}
```

### Event Stream Messages

```protobuf
message StreamEncounterEventsRequest {
  string encounter_id = 1;
  string player_id = 2;
}

message EncounterEvent {
  string event_id = 1;                // Unique ID for deduplication
  int64 timestamp = 2;                // Server timestamp

  oneof event {
    // Lobby events
    PlayerJoinedEvent player_joined = 10;
    PlayerLeftEvent player_left = 11;
    PlayerReadyEvent player_ready = 12;
    CombatStartedEvent combat_started = 13;

    // Combat events
    MovementCompletedEvent movement_completed = 20;
    AttackResolvedEvent attack_resolved = 21;
    FeatureActivatedEvent feature_activated = 22;
    TurnEndedEvent turn_ended = 23;
    MonsterTurnCompletedEvent monster_turn_completed = 24;
    CombatEndedEvent combat_ended = 25;

    // Connection events
    PlayerDisconnectedEvent player_disconnected = 30;
    PlayerReconnectedEvent player_reconnected = 31;
    CombatPausedEvent combat_paused = 32;
    CombatResumedEvent combat_resumed = 33;
  }
}
```

### Lobby Events

```protobuf
message PlayerJoinedEvent {
  PartyMember member = 1;
}

message PlayerLeftEvent {
  string player_id = 1;
  string character_id = 2;
}

message PlayerReadyEvent {
  string player_id = 1;
  bool is_ready = 2;
}

message CombatStartedEvent {
  CombatState combat_state = 1;
  Room room = 2;
  repeated PartyMember party = 3;
}
```

### Combat Events

```protobuf
message MovementCompletedEvent {
  string entity_id = 1;
  repeated Position path = 2;         // Full path for animation
  Position final_position = 3;
  int32 movement_remaining = 4;
  string stop_reason = 5;
  Room updated_room = 6;
}

message AttackResolvedEvent {
  string attacker_id = 1;
  string target_id = 2;
  AttackResult result = 3;
  Character updated_attacker = 4;
  Character updated_target = 5;
  Room updated_room = 6;
}

message FeatureActivatedEvent {
  string character_id = 1;
  string feature_id = 2;
  string message = 3;
  Character updated_character = 4;
}

message TurnEndedEvent {
  TurnChangeEvent turn_change = 1;
  CombatState combat_state = 2;
}

message MonsterTurnCompletedEvent {
  MonsterTurnResult monster_turn = 1;
  repeated Character updated_characters = 2;
  Room updated_room = 3;
}

message CombatEndedEvent {
  EncounterResult result = 1;
}
```

### Connection Events

```protobuf
message PlayerDisconnectedEvent {
  string player_id = 1;
  string character_id = 2;
}

message PlayerReconnectedEvent {
  string player_id = 1;
  PartyMember member = 2;
}

message CombatPausedEvent {
  string reason = 1;
  string disconnected_player_id = 2;
}

message CombatResumedEvent {
  CombatState combat_state = 1;
}
```

### Updated Service Definition

```protobuf
service EncounterService {
  // === Lobby Management (NEW) ===
  rpc CreateEncounter(CreateEncounterRequest) returns (CreateEncounterResponse);
  rpc JoinEncounter(JoinEncounterRequest) returns (JoinEncounterResponse);
  rpc SetReady(SetReadyRequest) returns (SetReadyResponse);
  rpc StartCombat(StartCombatRequest) returns (StartCombatResponse);
  rpc LeaveEncounter(LeaveEncounterRequest) returns (LeaveEncounterResponse);

  // === Event Stream (NEW) ===
  rpc StreamEncounterEvents(StreamEncounterEventsRequest) returns (stream EncounterEvent);

  // === Existing RPCs (unchanged behavior, now emit events) ===
  rpc DungeonStart(DungeonStartRequest) returns (DungeonStartResponse);
  rpc GetCombatState(GetCombatStateRequest) returns (GetCombatStateResponse);
  rpc MoveCharacter(MoveCharacterRequest) returns (MoveCharacterResponse);
  rpc EndTurn(EndTurnRequest) returns (EndTurnResponse);
  rpc Attack(AttackRequest) returns (AttackResponse);
  rpc ActivateFeature(ActivateFeatureRequest) returns (ActivateFeatureResponse);
}
```

## Client Flow Examples

### Joining an Encounter

```
1. Player B receives join code "ABC123" from Player A (out of band)
2. Player B calls JoinEncounter(join_code: "ABC123", character_ids: ["char-456"])
3. Player B receives JoinEncounterResponse with room, party list, state
4. Player B calls StreamEncounterEvents to subscribe
5. Player B sees PlayerJoinedEvent for themselves (confirmation)
6. Player A sees PlayerJoinedEvent for Player B via their stream
```

### Making a Move

```
1. Player A (active turn) clicks destination hex
2. Client calls MoveCharacter(path: [...])
3. Client receives MoveCharacterResponse (success: true)
4. ALL clients receive MovementCompletedEvent via stream
5. ALL clients animate the movement using path from event
6. ALL clients update room state from event
```

### Handling Disconnect

```
1. Player B's connection drops
2. Server detects stream termination
3. Server broadcasts PlayerDisconnectedEvent to remaining players
4. If combat active, server broadcasts CombatPausedEvent
5. UI shows "Waiting for Player B to reconnect..."
6. Player B reconnects, calls StreamEncounterEvents again
7. Server broadcasts PlayerReconnectedEvent, CombatResumedEvent
8. Combat continues
```

## Future Enhancements

- **Leader kick:** Host can remove disconnected players to continue
- **Free movement mode:** Out-of-combat movement without turn restrictions
- **DM mode:** Separate role controlling monsters and environment
- **Spectator mode:** Watch without participating
- **Chat/emotes:** In-game communication

## Implementation Notes

- Existing unary RPCs need minimal changes - just add event broadcasting after execution
- Encounter repository needs to track connected streams per encounter
- Need connection heartbeat to detect disconnects quickly
- Join codes should expire after use or timeout
- Consider rate limiting on stream subscriptions

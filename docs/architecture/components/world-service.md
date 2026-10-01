# WorldService

`api/world/v1alpha1/service.proto` defines server-owned game access configuration. This is separate from running gameplay sessions and authored dungeon documents.

## Contract

`World.world_id` is the Discord guild ID. `World.roles` contains required admin, builder, and player role IDs. Permissions are cumulative: admin includes build/play; builder includes play. Discord administers role membership; the API verifies it.

| RPC | Authority | Behavior |
|---|---|---|
| GetWorld | Verified guild owner or configured world admin | Returns stored configuration; missing world is NotFound |
| SetWorldRoles | Verified guild owner only | Creates or replaces the complete configuration, including the admin role |
| SetWorldMemberRoles | Verified guild owner or configured world admin | Replaces builder/player roles, atomically preserving the latest stored admin role; missing world is NotFound |

The target world must match API-verified guild context. A body ID, Discord Administrator permission, or configured world-admin role is not proof of server ownership. Setup is authorized independently of gameplay admission so the owner can configure a world before its game roles exist.

All role IDs are canonical non-zero decimal uint64 strings. Missing or malformed assignments are invalid, not public-access defaults. Errors use gRPC status codes rather than result envelopes.

## Consumer boundary

The API owns a World repository and Discord authorization; the game client renders configuration and submits selected role IDs. Storage adapters and owner-verification mechanisms are API concerns, not protobuf fields. These RPCs do not transfer characters/items or establish multi-server storage isolation.

Consumer implementation and live configuration proof are pending in the role-access slice tracked by rpg-project#514 and rpg-api#1065.

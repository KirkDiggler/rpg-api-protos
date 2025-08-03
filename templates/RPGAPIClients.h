#pragma once

#include "CoreMinimal.h"

// Generated gRPC service clients - D&D 5e services
#include "Generated/dnd5e/api/v1alpha1/character.pb.h"
#include "Generated/dnd5e/api/v1alpha1/character.grpc.pb.h"
#include "Generated/dnd5e/api/v1alpha1/encounter.pb.h"
#include "Generated/dnd5e/api/v1alpha1/encounter.grpc.pb.h"
#include "Generated/dnd5e/api/v1alpha1/common.pb.h"
#include "Generated/dnd5e/api/v1alpha1/enums.pb.h"

// Generated gRPC service clients - Core API services
#include "Generated/api/v1alpha1/dice.pb.h"
#include "Generated/api/v1alpha1/dice.grpc.pb.h"
#include "Generated/api/v1alpha1/room_environments.pb.h"
#include "Generated/api/v1alpha1/room_environments.grpc.pb.h"
#include "Generated/api/v1alpha1/room_selectables.pb.h"
#include "Generated/api/v1alpha1/room_selectables.grpc.pb.h"
#include "Generated/api/v1alpha1/room_spatial.pb.h"
#include "Generated/api/v1alpha1/room_spatial.grpc.pb.h"
#include "Generated/api/v1alpha1/room_spawn.pb.h"
#include "Generated/api/v1alpha1/room_spawn.grpc.pb.h"
#include "Generated/api/v1alpha1/room_common.pb.h"

// gRPC C++ headers
#include <grpcpp/grpcpp.h>
#include <grpcpp/client_context.h>
#include <grpcpp/create_channel.h>
#include <grpcpp/security/credentials.h>

/**
 * Convenience header that includes all generated rpg-api gRPC clients.
 * 
 * Usage in UE projects:
 * #include "RPGAPIClients.h"
 * 
 * auto Channel = RPGAPIProtos::CreateChannel("localhost:50051");
 * auto CharacterStub = dnd5e::api::v1alpha1::CharacterService::NewStub(Channel);
 * 
 * Generated namespaces follow package structure:
 * - dnd5e::api::v1alpha1::CharacterService
 * - dnd5e::api::v1alpha1::EncounterService  
 * - api::v1alpha1::DiceService
 * - api::v1alpha1::EnvironmentService
 * - api::v1alpha1::SelectionTableService
 * - api::v1alpha1::SpatialService
 * - api::v1alpha1::SpawnService
 */

namespace RPGAPIProtos
{
    // Helper functions for common gRPC operations
    inline std::shared_ptr<grpc::Channel> CreateChannel(const std::string& ServerAddress)
    {
        return grpc::CreateChannel(ServerAddress, grpc::InsecureChannelCredentials());
    }

    inline std::shared_ptr<grpc::Channel> CreateSecureChannel(const std::string& ServerAddress, 
                                                               const grpc::SslCredentialsOptions& Options = grpc::SslCredentialsOptions())
    {
        return grpc::CreateChannel(ServerAddress, grpc::SslCredentials(Options));
    }
    
    // Service namespace aliases for convenience
    namespace Character = dnd5e::api::v1alpha1;
    namespace Encounter = dnd5e::api::v1alpha1;
    namespace Dice = api::v1alpha1;
    namespace Environment = api::v1alpha1;
    namespace SelectionTable = api::v1alpha1;
    namespace Spatial = api::v1alpha1;
    namespace Spawn = api::v1alpha1;
}
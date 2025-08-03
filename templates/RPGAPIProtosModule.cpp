#include "RPGAPIProtosModule.h"
#include "Engine/Engine.h"
#include "Misc/DateTime.h"

// gRPC includes
#include <grpcpp/grpcpp.h>

DEFINE_LOG_CATEGORY(LogRPGAPIProtos);

void FRPGAPIProtosModule::StartupModule()
{
    UE_LOG(LogRPGAPIProtos, Log, TEXT("RPG API Protos module starting up"));
    
    InitializegRPCRuntime();
    
    // Log available services
    TArray<FString> Services = GetAvailableServices();
    UE_LOG(LogRPGAPIProtos, Log, TEXT("Available gRPC services: %d"), Services.Num());
    for (const FString& Service : Services)
    {
        UE_LOG(LogRPGAPIProtos, Log, TEXT("  - %s"), *Service);
    }
    
    UE_LOG(LogRPGAPIProtos, Log, TEXT("RPG API Protos module startup complete"));
}

void FRPGAPIProtosModule::ShutdownModule()
{
    UE_LOG(LogRPGAPIProtos, Log, TEXT("RPG API Protos module shutting down"));
    
    ShutdowngRPCRuntime();
    
    UE_LOG(LogRPGAPIProtos, Log, TEXT("RPG API Protos module shutdown complete"));
}

void FRPGAPIProtosModule::InitializegRPCRuntime()
{
    // Initialize gRPC runtime if needed
    // Most gRPC initialization happens automatically when creating channels
    UE_LOG(LogRPGAPIProtos, Log, TEXT("gRPC runtime initialized (version: %s)"), *GetgRPCVersion());
}

void FRPGAPIProtosModule::ShutdowngRPCRuntime()
{
    // Cleanup gRPC runtime if needed
    // gRPC handles most cleanup automatically
    UE_LOG(LogRPGAPIProtos, Log, TEXT("gRPC runtime shutdown"));
}

FString FRPGAPIProtosModule::GetModuleVersion()
{
    return TEXT("1.0.0");
}

TArray<FString> FRPGAPIProtosModule::GetAvailableServices()
{
    TArray<FString> Services;
    
    // D&D 5e services
    Services.Add(TEXT("CharacterService (dnd5e.api.v1alpha1)"));
    Services.Add(TEXT("EncounterService (dnd5e.api.v1alpha1)"));
    
    // Core API services
    Services.Add(TEXT("DiceService (api.v1alpha1)"));
    Services.Add(TEXT("EnvironmentService (api.v1alpha1)"));
    Services.Add(TEXT("SelectionTableService (api.v1alpha1)"));
    Services.Add(TEXT("SpatialService (api.v1alpha1)"));
    Services.Add(TEXT("SpawnService (api.v1alpha1)"));
    
    return Services;
}

FString FRPGAPIProtosModule::GetgRPCVersion()
{
    return FString::Printf(TEXT("%d.%d.%d"), 
        GRPC_VERSION_MAJOR, 
        GRPC_VERSION_MINOR, 
        GRPC_VERSION_PATCH);
}

bool FRPGAPIProtosModule::IsgRPCRuntimeAvailable()
{
    // Simple runtime check
    return true; // If module loaded, runtime should be available
}

IMPLEMENT_MODULE(FRPGAPIProtosModule, RPGAPIProtos)
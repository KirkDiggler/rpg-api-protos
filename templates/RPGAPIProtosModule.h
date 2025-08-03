#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleInterface.h"

DECLARE_LOG_CATEGORY_EXTERN(LogRPGAPIProtos, Log, All);

/**
 * RPG API Protos module for Unreal Engine.
 * 
 * This module provides generated C++ gRPC clients for all rpg-api services:
 * - CharacterService: D&D 5e character creation and management
 * - EncounterService: Combat encounter management  
 * - DiceService: Session-based dice rolling
 * - EnvironmentService: Room environment generation
 * - SelectionTableService: Weighted random selection tables
 * - SpatialService: Room spatial management
 * - SpawnService: Entity spawning and placement
 * 
 * It includes the complete gRPC C++ runtime packaged for UE compatibility.
 */
class FRPGAPIProtosModule : public IModuleInterface
{
public:
    // IModuleInterface implementation
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;

    // Module info
    static FString GetModuleVersion();
    static TArray<FString> GetAvailableServices();
    
    // gRPC runtime info
    static FString GetgRPCVersion();
    static bool IsgRPCRuntimeAvailable();

private:
    void InitializegRPCRuntime();
    void ShutdowngRPCRuntime();
};
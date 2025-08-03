using UnrealBuildTool;
using System.IO;

public class RPGAPIProtos : ModuleRules
{
    public RPGAPIProtos(ReadOnlyTargetRules Target) : base(Target)
    {
        Type = ModuleType.External;
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject"
        });

        // Add generated proto include directories
        PublicIncludePaths.AddRange(new string[] {
            Path.Combine(ModuleDirectory, "Public"),
            Path.Combine(ModuleDirectory, "Public", "Generated")
        });

        // Add gRPC C++ runtime dependencies
        AddgRPCDependencies(Target);
    }

    private void AddgRPCDependencies(ReadOnlyTargetRules Target)
    {
        string ThirdPartyPath = Path.Combine(ModuleDirectory, "..", "ThirdParty", "gRPC");
        
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string Win64LibPath = Path.Combine(ThirdPartyPath, "Win64", "lib");
            string Win64IncludePath = Path.Combine(ThirdPartyPath, "Win64", "include");

            PublicIncludePaths.Add(Win64IncludePath);

            // Core gRPC libraries
            PublicAdditionalLibraries.AddRange(new string[] {
                Path.Combine(Win64LibPath, "grpc++.lib"),
                Path.Combine(Win64LibPath, "grpc.lib"),
                Path.Combine(Win64LibPath, "protobuf.lib")
            });

            // gRPC dependencies
            PublicAdditionalLibraries.AddRange(new string[] {
                Path.Combine(Win64LibPath, "libssl.lib"),
                Path.Combine(Win64LibPath, "libcrypto.lib"),
                Path.Combine(Win64LibPath, "cares.lib"),
                Path.Combine(Win64LibPath, "address_sorting.lib"),
                Path.Combine(Win64LibPath, "re2.lib"),
                Path.Combine(Win64LibPath, "upb.lib"),
                Path.Combine(Win64LibPath, "utf8_range.lib")
            });

            // Abseil dependencies (gRPC requirement)
            PublicAdditionalLibraries.AddRange(new string[] {
                Path.Combine(Win64LibPath, "absl_base.lib"),
                Path.Combine(Win64LibPath, "absl_strings.lib"),
                Path.Combine(Win64LibPath, "absl_synchronization.lib"),
                Path.Combine(Win64LibPath, "absl_time.lib"),
                Path.Combine(Win64LibPath, "absl_statusor.lib"),
                Path.Combine(Win64LibPath, "absl_status.lib"),
                Path.Combine(Win64LibPath, "absl_cord.lib"),
                Path.Combine(Win64LibPath, "absl_hash.lib")
            });

            // Windows system libraries required by gRPC
            PublicSystemLibraries.AddRange(new string[] {
                "ws2_32.lib",
                "crypt32.lib",
                "advapi32.lib",
                "user32.lib"
            });

            PublicDefinitions.AddRange(new string[] {
                "GRPC_CPP_PLUGIN=1",
                "GPR_FORBID_UNREACHABLE_CODE=1",
                "NOMINMAX=1"  // Prevent Windows.h min/max macro conflicts
            });
        }
        else if (Target.Platform == UnrealTargetPlatform.Linux)
        {
            string LinuxLibPath = Path.Combine(ThirdPartyPath, "Linux", "lib");
            string LinuxIncludePath = Path.Combine(ThirdPartyPath, "Linux", "include");

            PublicIncludePaths.Add(LinuxIncludePath);

            // Core gRPC libraries
            PublicAdditionalLibraries.AddRange(new string[] {
                Path.Combine(LinuxLibPath, "libgrpc++.a"),
                Path.Combine(LinuxLibPath, "libgrpc.a"),
                Path.Combine(LinuxLibPath, "libprotobuf.a")
            });

            // Linux system libraries required by gRPC
            PublicSystemLibraries.AddRange(new string[] {
                "pthread",
                "z",
                "ssl",
                "crypto"
            });

            PublicDefinitions.AddRange(new string[] {
                "GRPC_CPP_PLUGIN=1"
            });
        }
    }
}
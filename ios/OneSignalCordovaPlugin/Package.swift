// swift-tools-version: 5.9
import Foundation
import PackageDescription

let isSimulatorBuild =
    (ProcessInfo.processInfo.environment["SDK_NAME"] ?? "").contains("simulator") ||
    (ProcessInfo.processInfo.environment["PLATFORM_NAME"] ?? "") == "iphonesimulator" ||
    (ProcessInfo.processInfo.environment["SDKROOT"] ?? "").lowercased().contains("simulator")

let pluginTarget: Target = isSimulatorBuild
    ? .target(
        name: "OnesignalCordovaPlugin",
        dependencies: [
            .product(name: "Cordova", package: "capacitor-swift-pm")
        ],
        path: ".",
        exclude: [
            "OneSignalPush.h",
            "OneSignalPush.m",
            "Artifacts"
        ],
        sources: [
            "OneSignalPushSimulator.m"
        ]
    )
    : .target(
        name: "OnesignalCordovaPlugin",
        dependencies: [
            .product(name: "Cordova", package: "capacitor-swift-pm"),
            .target(name: "OneSignalFramework"),
            .target(name: "OneSignalInAppMessages"),
            .target(name: "OneSignalLocation"),
            .target(name: "OneSignalNotifications"),
            .target(name: "OneSignalOutcomes"),
            .target(name: "OneSignalUser"),
            .target(name: "OneSignalExtension"),
            .target(name: "OneSignalOSCore"),
            .target(name: "OneSignalCore"),
            .target(name: "OneSignalLiveActivities")
        ],
        path: ".",
        sources: [
            "OneSignalPush.m"
        ],
        publicHeadersPath: "."
    )

let package = Package(
    name: "OnesignalCordovaPlugin",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "OnesignalCordovaPlugin",
            targets: ["OnesignalCordovaPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.1")
    ],
    targets: isSimulatorBuild ? [
        pluginTarget
    ] : [
        pluginTarget,
        .binaryTarget(
            name: "OneSignalFramework",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalFramework.xcframework.zip",
            checksum: "a58df0c7417b0785da6d0c8718a77aea45f599ad5650bd01781035eb273ef17f"
        ),
        .binaryTarget(
            name: "OneSignalInAppMessages",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalInAppMessages.xcframework.zip",
            checksum: "f9d7f766ed7f2e95d38af149e8a4173508704938053b36d2f58dd5f93dbc2d68"
        ),
        .binaryTarget(
            name: "OneSignalLocation",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalLocation.xcframework.zip",
            checksum: "7c702867a7aca6571873bd9d9bbec5a27489808d83a5ab4fa6c56ff29460dd2e"
        ),
        .binaryTarget(
            name: "OneSignalNotifications",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalNotifications.xcframework.zip",
            checksum: "044af3b7091bb41a75d682f6511be44a7a6bf1e1dfba6f74cf594cb15399c3ed"
        ),
        .binaryTarget(
            name: "OneSignalOutcomes",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalOutcomes.xcframework.zip",
            checksum: "18f0c36fc1a82ab05226ed26cdf63b8ae9d3c0daa98040b3e32ffa8060bef586"
        ),
        .binaryTarget(
            name: "OneSignalUser",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalUser.xcframework.zip",
            checksum: "58d6e32ef0580f6cc355165ee627c5ebef1943ab0db0dd278677d0b3794fa6f6"
        ),
        .binaryTarget(
            name: "OneSignalExtension",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalExtension.xcframework.zip",
            checksum: "cb1b6d28eaf0beac27bb42e98d3e35a55f5b8840ca765b0b43678edacad3a5f7"
        ),
        .binaryTarget(
            name: "OneSignalOSCore",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalOSCore.xcframework.zip",
            checksum: "e427d9ade8c642cc32e50ac772294e2f3c1617edebee2e2e3456d609ea19ceb2"
        ),
        .binaryTarget(
            name: "OneSignalCore",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalCore.xcframework.zip",
            checksum: "027b2485ccf6dabb523bba2628982637d57b73d491efc3e86ed008885858979e"
        ),
        .binaryTarget(
            name: "OneSignalLiveActivities",
            url: "https://github.com/OneSignal/OneSignal-iOS-SDK/releases/download/5.5.1/OneSignalLiveActivities.xcframework.zip",
            checksum: "b8118f029efac9bec0f7f0047d690bfb2609f70aa1b799444918ab3353cc193f"
        )
    ]
)

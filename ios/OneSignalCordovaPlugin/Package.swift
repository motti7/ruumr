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
            path: "Artifacts/OneSignalFramework/OneSignalFramework.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalInAppMessages",
            path: "Artifacts/OneSignalInAppMessages/OneSignalInAppMessages.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalLocation",
            path: "Artifacts/OneSignalLocation/OneSignalLocation.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalNotifications",
            path: "Artifacts/OneSignalNotifications/OneSignalNotifications.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalOutcomes",
            path: "Artifacts/OneSignalOutcomes/OneSignalOutcomes.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalUser",
            path: "Artifacts/OneSignalUser/OneSignalUser.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalExtension",
            path: "Artifacts/OneSignalExtension/OneSignalExtension.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalOSCore",
            path: "Artifacts/OneSignalOSCore/OneSignalOSCore.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalCore",
            path: "Artifacts/OneSignalCore/OneSignalCore.xcframework"
        ),
        .binaryTarget(
            name: "OneSignalLiveActivities",
            path: "Artifacts/OneSignalLiveActivities/OneSignalLiveActivities.xcframework"
        )
    ]
)

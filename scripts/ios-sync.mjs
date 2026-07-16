import path from 'node:path';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const repoRoot = path.resolve(process.cwd());
const oneSignalStaticPluginDir = path.join(
  repoRoot,
  'ios',
  'capacitor-cordova-ios-plugins',
  'sourcesstatic',
  'OnesignalCordovaPlugin',
);
const oneSignalPackageSourcePath = path.join(
  repoRoot,
  'ios',
  'OneSignalCordovaPlugin',
  'Package.swift',
);
const oneSignalPackageArtifactsLinkPath = path.join(
  repoRoot,
  'ios',
  'OneSignalCordovaPlugin',
  'Artifacts',
);
const oneSignalGeneratedPluginDir = path.join(
  repoRoot,
  'ios',
  'capacitor-cordova-ios-plugins',
  'sources',
  'OnesignalCordovaPlugin',
);
const iosProjectFilePath = path.join(
  repoRoot,
  'ios',
  'App',
  'App.xcodeproj',
  'project.pbxproj',
);
const iosCapacitorConfigPath = path.join(
  repoRoot,
  'ios',
  'App',
  'App',
  'capacitor.config.json',
);
const iosAppPackagePath = path.join(
  repoRoot,
  'ios',
  'App',
  'CapApp-SPM',
  'Package.swift',
);
const iosCordovaPluginsManifestPath = path.join(
  repoRoot,
  'ios',
  'App',
  'App',
  'public',
  'cordova_plugins.js',
);
const iosCordovaOneSignalPluginDir = path.join(
  repoRoot,
  'ios',
  'App',
  'App',
  'public',
  'plugins',
  'onesignal-cordova-plugin',
);

const oneSignalSimulatorGuardMarker =
  'Simulator intercepted notification permission request';
const androidBundleId = 'com.ruumr.app.android';
const iosBundleId = 'com.base68c919adff6ac6fafb51bed6.app';

const env = {
  ...process.env,
  VITE_RUUMR_SIMULATOR_MODE: process.env.VITE_RUUMR_SIMULATOR_MODE || 'true',
  VITE_RUUMR_NATIVE_DEMO: process.env.VITE_RUUMR_NATIVE_DEMO || 'true',
  VITE_RUUMR_SIMULATOR_AUTO_RANK_TEAM:
    process.env.VITE_RUUMR_SIMULATOR_AUTO_RANK_TEAM || 'true',
};

function patchOneSignalCordovaPluginSource(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let contents = fs.readFileSync(filePath, 'utf8');
  if (contents.includes(oneSignalSimulatorGuardMarker)) {
    return;
  }

  if (!contents.includes('#import <TargetConditionals.h>')) {
    contents = contents.replace(
      '#import <objc/runtime.h>\n',
      '#import <objc/runtime.h>\n#import <TargetConditionals.h>\n#import <UserNotifications/UserNotifications.h>\n',
    );
  }

  contents = contents.replace(
    'bool initDone = false;\n',
    `bool initDone = false;\n\nstatic BOOL isRuumrSimulatorEnvironment(void) {\n#if TARGET_OS_SIMULATOR\n  return YES;\n#else\n  return NO;\n#endif\n}\n\n#if TARGET_OS_SIMULATOR\n@implementation UNUserNotificationCenter (RuumrSimulatorNotificationGuard)\n\n+ (void)load {\n  static dispatch_once_t onceToken;\n  dispatch_once(&onceToken, ^{\n    Method originalMethod = class_getInstanceMethod(\n        self, @selector(requestAuthorizationWithOptions:completionHandler:));\n    Method swizzledMethod = class_getInstanceMethod(\n        self, @selector(ruumr_requestAuthorizationWithOptions:completionHandler:));\n    method_exchangeImplementations(originalMethod, swizzledMethod);\n  });\n}\n\n- (void)ruumr_requestAuthorizationWithOptions:(UNAuthorizationOptions)options\n                            completionHandler:\n                                (void (^ _Nullable)(BOOL granted,\n                                                    NSError * _Nullable error))\n                                    completionHandler {\n  NSLog(@\"[ruumr] Simulator intercepted notification permission request\");\n  if (completionHandler) {\n    completionHandler(YES, nil);\n  }\n}\n\n@end\n#endif\n`,
  );

  contents = contents.replace(
    `void initOneSignalObject(NSDictionary *launchOptions) {\n  OneSignalWrapper.sdkType = @"cordova";\n  OneSignalWrapper.sdkVersion = @"050307";\n  [OneSignal initialize:nil withLaunchOptions:launchOptions];\n}\n`,
    `void initOneSignalObject(NSDictionary *launchOptions) {\n#if TARGET_OS_SIMULATOR\n  NSLog(@\"[ruumr] OneSignal Cordova plugin disabled on simulator\");\n  return;\n#else\n  OneSignalWrapper.sdkType = @\"cordova\";\n  OneSignalWrapper.sdkVersion = @\"050307\";\n  [OneSignal initialize:nil withLaunchOptions:launchOptions];\n#endif\n}\n`,
  );

  contents = contents.replace(
    `- (BOOL)oneSignalApplication:(UIApplication *)application\n    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {\n  initOneSignalObject(launchOptions);\n`,
    `- (BOOL)oneSignalApplication:(UIApplication *)application\n    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {\n  if (isRuumrSimulatorEnvironment()) {\n    NSLog(@\"[ruumr] Skipping OneSignal Cordova launch initialization on simulator\");\n    if ([self respondsToSelector:\n                  @selector(oneSignalApplication:didFinishLaunchingWithOptions:)])\n      return [self oneSignalApplication:application\n          didFinishLaunchingWithOptions:launchOptions];\n    return YES;\n  }\n\n  initOneSignalObject(launchOptions);\n`,
  );

  contents = contents.replace(
    `- (void)init:(CDVInvokedUrlCommand *)command {\n`,
    `- (void)init:(CDVInvokedUrlCommand *)command {\n  if (isRuumrSimulatorEnvironment()) {\n    NSLog(@\"[ruumr] Skipping OneSignal Cordova init on simulator\");\n    successCallbackBoolean(command.callbackId, true);\n    return;\n  }\n\n`,
  );

  contents = contents.replace(
    `- (void)requestPermission:(CDVInvokedUrlCommand *)command {\n`,
    `- (void)requestPermission:(CDVInvokedUrlCommand *)command {\n  if (isRuumrSimulatorEnvironment()) {\n    successCallbackBoolean(command.callbackId, false);\n    return;\n  }\n\n`,
  );

  contents = contents.replace(
    `- (void)registerForProvisionalAuthorization:(CDVInvokedUrlCommand *)command {\n`,
    `- (void)registerForProvisionalAuthorization:(CDVInvokedUrlCommand *)command {\n  if (isRuumrSimulatorEnvironment()) {\n    successCallbackBoolean(command.callbackId, false);\n    return;\n  }\n\n`,
  );

  contents = contents.replace(
    `- (void)requestLocationPermission:(CDVInvokedUrlCommand *)command {\n  [OneSignal.Location requestPermission];\n}\n`,
    `- (void)requestLocationPermission:(CDVInvokedUrlCommand *)command {\n  if (isRuumrSimulatorEnvironment()) {\n    return;\n  }\n\n  [OneSignal.Location requestPermission];\n}\n`,
  );

  fs.writeFileSync(filePath, contents);
}

function restoreOneSignalCordovaPluginPackage() {
  const files = ['Package.swift', 'OneSignalPush.m', 'OneSignalPush.h', 'OneSignalPushSimulator.m'];

  if (!fs.existsSync(oneSignalStaticPluginDir)) {
    return;
  }

  fs.mkdirSync(oneSignalGeneratedPluginDir, { recursive: true });
  patchOneSignalCordovaPluginSource(path.join(oneSignalStaticPluginDir, 'OneSignalPush.m'));

  for (const fileName of files) {
    const sourcePath =
      fileName === 'Package.swift'
        ? oneSignalPackageSourcePath
        : path.join(oneSignalStaticPluginDir, fileName);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    fs.copyFileSync(sourcePath, path.join(oneSignalGeneratedPluginDir, fileName));
  }

  fs.rmSync(oneSignalPackageArtifactsLinkPath, { recursive: true, force: true });
  fs.rmSync(path.join(oneSignalGeneratedPluginDir, 'Artifacts'), {
    recursive: true,
    force: true,
  });
}

function patchIosBundleId() {
  for (const filePath of [iosProjectFilePath, iosCapacitorConfigPath]) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const contents = fs.readFileSync(filePath, 'utf8');
    if (!contents.includes(androidBundleId)) {
      continue;
    }

    fs.writeFileSync(filePath, contents.replaceAll(androidBundleId, iosBundleId));
  }
}

function removeOnesignalFromIosAppPackage() {
  if (!fs.existsSync(iosAppPackagePath)) {
    return;
  }

  let contents = fs.readFileSync(iosAppPackagePath, 'utf8');
  if (!contents.includes('OnesignalCordovaPlugin')) {
    return;
  }

  contents = contents.replace(
    /,\n\s*\.package\(name: "OnesignalCordovaPlugin", path: "\.\.\/\.\.\/capacitor-cordova-ios-plugins\/sources\/OnesignalCordovaPlugin"\)/,
    '',
  );

  contents = contents.replace(
    /,\n\s*\.product\(name: "OnesignalCordovaPlugin", package: "OnesignalCordovaPlugin"\)/,
    '',
  );

  fs.writeFileSync(iosAppPackagePath, contents);
}

function removeOnesignalFromIosPublicAssets() {
  if (fs.existsSync(iosCordovaOneSignalPluginDir)) {
    fs.rmSync(iosCordovaOneSignalPluginDir, { recursive: true, force: true });
  }

  if (!fs.existsSync(iosCordovaPluginsManifestPath)) {
    return;
  }

  let contents = fs.readFileSync(iosCordovaPluginsManifestPath, 'utf8');
  if (!contents.includes('onesignal-cordova-plugin.OneSignalPlugin')) {
    return;
  }

  contents = `  cordova.define('cordova/plugin_list', function(require, exports, module) {\n    module.exports = [];\n    module.exports.metadata =\n    // TOP OF METADATA\n    {};\n    // BOTTOM OF METADATA\n    });\n`;

  fs.writeFileSync(iosCordovaPluginsManifestPath, contents);
}

execSync('npm run build', { stdio: 'inherit', env, cwd: repoRoot });
execSync('npx cap sync ios', { stdio: 'inherit', env, cwd: repoRoot });
restoreOneSignalCordovaPluginPackage();
patchIosBundleId();

const isSimulatorTarget = env.VITE_RUUMR_SIMULATOR_MODE === 'true';
if (isSimulatorTarget) {
  removeOnesignalFromIosAppPackage();
  removeOnesignalFromIosPublicAssets();
}

#import <Cordova/CDV.h>
#import <Cordova/CDVPlugin.h>
#import <Foundation/Foundation.h>

@interface OneSignalPush : CDVPlugin
@end

@implementation OneSignalPush

- (void)sendOk:(CDVInvokedUrlCommand *)command {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)sendFalse:(CDVInvokedUrlCommand *)command {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:NO];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)sendEmptyDictionary:(CDVInvokedUrlCommand *)command {
  CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{}];
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)setProvidesNotificationSettingsView:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addForegroundLifecycleListener:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)onWillDisplayNotification:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)onClickNotification:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)preventDefault:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)proceedWithWillDisplay:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)displayNotification:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addNotificationClickListener:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)init:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setLogLevel:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setAlertLevel:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)login:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)logout:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addTags:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeTags:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)getTags:(CDVInvokedUrlCommand *)command { [self sendEmptyDictionary:command]; }
- (void)addUserStateObserver:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)getOnesignalId:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)getExternalId:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addPushSubscriptionObserver:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)getPushSubscriptionId:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)getPushSubscriptionToken:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)getPushSubscriptionOptedIn:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)optInPushSubscription:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)optOutPushSubscription:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addPermissionObserver:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)requestPermission:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)getPermissionInternal:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)permissionNative:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)canRequestPermission:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)registerForProvisionalAuthorization:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)clearAllNotifications:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeNotification:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeGroupedNotifications:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setPrivacyConsentRequired:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setPrivacyConsentGiven:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addAliases:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeAliases:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addEmail:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeEmail:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addSms:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeSms:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setInAppMessageClickHandler:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)onClickInAppMessage:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setOnWillDisplayInAppMessageHandler:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setOnDidDisplayInAppMessageHandler:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setOnWillDismissInAppMessageHandler:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setOnDidDismissInAppMessageHandler:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addTriggers:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removeTriggers:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)clearTriggers:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setPaused:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)isPaused:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)addOutcome:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addUniqueOutcome:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)addOutcomeWithValue:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)trackEvent:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)requestLocationPermission:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)setLocationShared:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)isLocationShared:(CDVInvokedUrlCommand *)command { [self sendFalse:command]; }
- (void)setLanguage:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)enterLiveActivity:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)exitLiveActivity:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setPushToStartToken:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)removePushToStartToken:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)setupDefaultLiveActivity:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }
- (void)startDefaultLiveActivity:(CDVInvokedUrlCommand *)command { [self sendOk:command]; }

@end

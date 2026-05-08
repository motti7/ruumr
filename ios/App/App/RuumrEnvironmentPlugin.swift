import Foundation
import Capacitor

@objc(RuumrEnvironmentPlugin)
public class RuumrEnvironmentPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RuumrEnvironmentPlugin"
    public let jsName = "RuumrEnvironment"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSimulator", returnType: CAPPluginReturnPromise)
    ]

    @objc func isSimulator(_ call: CAPPluginCall) {
        #if targetEnvironment(simulator)
        call.resolve(["isSimulator": true])
        #else
        call.resolve(["isSimulator": false])
        #endif
    }
}

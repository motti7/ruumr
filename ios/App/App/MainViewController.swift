import UIKit
import Capacitor

// App-local Capacitor plugins are not auto-discovered in this SPM-based setup
// (calls returned UNIMPLEMENTED). Register them explicitly here, which is the
// supported Capacitor hook for custom plugins bundled in the app target.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WebAuthPlugin())
        bridge?.registerPluginInstance(RuumrEnvironmentPlugin())
    }
}

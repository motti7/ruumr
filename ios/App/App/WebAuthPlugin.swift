import Foundation
import Capacitor
import AuthenticationServices

// Native Sign-in plugin backed by ASWebAuthenticationSession.
//
// Why: OAuth must run outside the app's embedded WebView (Apple blocks it there).
// ASWebAuthenticationSession opens the provider login in a secure system session
// and, crucially, intercepts the app's custom callback scheme (com.ruumr.app)
// WITHOUT the "Open in <app>?" confirmation prompt that a plain SFSafariViewController
// custom-scheme redirect triggers. It then hands the callback URL (carrying the
// access_token) straight back to JS.
@objc(WebAuthPlugin)
public class WebAuthPlugin: CAPPlugin, CAPBridgedPlugin, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "WebAuthPlugin"
    public let jsName = "WebAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var session: ASWebAuthenticationSession?

    @objc func signIn(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Missing or invalid 'url'")
            return
        }
        // The scheme (without "://") the auth flow redirects back to; the session
        // intercepts URLs with this scheme and returns control to the app.
        let callbackScheme = call.getString("callbackScheme")

        DispatchQueue.main.async {
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { [weak self] callbackURL, error in
                defer { self?.session = nil }

                if let error = error {
                    let nsError = error as NSError
                    if nsError.domain == ASWebAuthenticationSessionError.errorDomain,
                       nsError.code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                        call.reject("Sign in canceled", "CANCELED")
                    } else {
                        call.reject(error.localizedDescription)
                    }
                    return
                }

                guard let callbackURL = callbackURL else {
                    call.reject("No callback URL returned")
                    return
                }

                call.resolve(["url": callbackURL.absoluteString])
            }

            session.presentationContextProvider = self
            // Share cookies with Safari so an existing Apple/Google web session is
            // recognized (smoother sign-in); set true only if you want a clean slate.
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            session.start()
        }
    }

    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return self.bridge?.viewController?.view.window
            ?? UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
            ?? ASPresentationAnchor()
    }
}

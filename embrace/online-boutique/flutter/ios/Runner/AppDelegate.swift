import Flutter
import UIKit
import EmbraceIO

@main
@objc class AppDelegate: FlutterAppDelegate {
  override init() {
    super.init()
    do {
      try Embrace
        .setup(
          options: Embrace.Options(
            appId: "2disg",
            platform: .flutter
          )
        )
        .start()
    } catch {
      print("Error starting Embrace: \(error.localizedDescription)")
    }
  }

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

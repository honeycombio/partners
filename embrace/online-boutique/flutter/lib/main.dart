import 'package:embrace/embrace.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

import 'api/boutique_api.dart';
import 'config/app_config.dart';
import 'router/app_router.dart';
import 'state/cart_badge_notifier.dart';
import 'state/session_notifier.dart';
import 'theme/boutique_theme.dart';

Future<void> main() async {
  Future<void> bootstrap() async {
    await dotenv.load(fileName: 'assets/app_config.env');

    final session = SessionNotifier();
    await session.init();

    final config = AppConfig.fromEnv();

    runApp(
      MultiProvider(
        providers: [
          Provider.value(value: config),
          ChangeNotifierProvider.value(value: session),
          ChangeNotifierProvider(create: (_) => CartBadgeNotifier()),
          Provider(create: (_) => BoutiqueApi(config: config)),
        ],
        child: const OnlineBoutiqueApp(),
      ),
    );
  }

  // Embrace Flutter SDK only supports iOS and Android (not web).
  if (kIsWeb) {
    WidgetsFlutterBinding.ensureInitialized();
    await bootstrap();
    return;
  }

  await Embrace.instance.start(action: bootstrap);
}

class OnlineBoutiqueApp extends StatelessWidget {
  const OnlineBoutiqueApp({super.key});

  @override
  Widget build(BuildContext context) {
    final config = context.watch<AppConfig>();
    if (!config.hasApiKey) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: const Color(0xFFFFF3CD),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('API key not configured', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF856404))),
                  const SizedBox(height: 8),
                  Text(
                    'Set FRONTEND_API_KEY in assets/app_config.env (same value as FRONTEND_API_KEY / VITE_FRONTEND_API_KEY on the Online Boutique frontend service).',
                    style: TextStyle(fontSize: 14, color: const Color(0xFF856404).withValues(alpha: 0.95), height: 1.35),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (config.needsExplicitOrigin) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: const Color(0xFFFFF3CD),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Boutique URL required for mobile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF856404))),
                  const SizedBox(height: 8),
                  Text(
                    'Set FRONTEND_ORIGIN in assets/app_config.env to your Online Boutique frontend base URL (HTTPS), or pass --dart-define=FRONTEND_ORIGIN=... when building. CORS on the boutique must allow this app.',
                    style: TextStyle(fontSize: 14, color: const Color(0xFF856404).withValues(alpha: 0.95), height: 1.35),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final router = createRouter();
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Online Boutique',
      theme: boutiqueTheme(),
      routerConfig: router,
    );
  }
}

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Loaded from `assets/app_config.env` and optional `--dart-define`.
class AppConfig {
  AppConfig({required this.apiKey, required this.frontendOrigin});

  final String apiKey;
  final String frontendOrigin;

  bool get hasApiKey => apiKey.trim().isNotEmpty;

  /// Native apps need an explicit boutique host (same as Capacitor).
  bool get needsExplicitOrigin => !kIsWeb && frontendOrigin.trim().isEmpty;

  static AppConfig fromEnv() {
    final key = _firstNonEmpty([
      dotenv.env['FRONTEND_API_KEY'],
      const String.fromEnvironment('FRONTEND_API_KEY', defaultValue: ''),
    ]);
    var origin = _firstNonEmpty([
      dotenv.env['FRONTEND_ORIGIN'],
      const String.fromEnvironment('FRONTEND_ORIGIN', defaultValue: ''),
    ]);
    origin = origin.replaceAll(RegExp(r'/+$'), '');
    if (origin.isEmpty && kIsWeb) {
      origin = Uri.base.origin;
    }
    return AppConfig(apiKey: key, frontendOrigin: origin);
  }

  static String _firstNonEmpty(List<String?> candidates) {
    for (final c in candidates) {
      final t = c?.trim() ?? '';
      if (t.isNotEmpty) return t;
    }
    return '';
  }
}

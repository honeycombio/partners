import '../config/app_config.dart';

/// Same as `src/utils/assets.js` — paths under `/static/...` resolved against boutique origin.
String assetUrl(AppConfig config, String path) {
  if (path.startsWith('http')) return path;
  final o = config.frontendOrigin.replaceAll(RegExp(r'/+$'), '');
  final p = path.startsWith('/') ? path : '/$path';
  return '$o$p';
}

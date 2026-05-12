import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_error.dart';

class BoutiqueApi {
  BoutiqueApi({required AppConfig config}) : _config = config;

  final AppConfig _config;

  Uri _uri(String path) {
    final o = _config.frontendOrigin;
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$o$p');
  }

  Map<String, String> _headers(String sessionId, String currency, {bool withBody = false}) {
    final h = <String, String>{
      'Authorization': 'Bearer ${_config.apiKey}',
      'X-Session-Id': sessionId,
      'X-Currency': currency,
      'Accept': 'application/json',
    };
    if (withBody) {
      h['Content-Type'] = 'application/json';
    }
    return h;
  }

  Future<dynamic> get(String path, {required String sessionId, required String currency}) async {
    if (!_config.hasApiKey) {
      throw ApiError(
        'API key missing: set FRONTEND_API_KEY in assets/app_config.env (same as FRONTEND_API_KEY on the boutique frontend)',
        503,
        null,
      );
    }
    final res = await http.get(_uri(path), headers: _headers(sessionId, currency));
    return _parseResponse(res);
  }

  Future<dynamic> post(
    String path,
    Object? body, {
    required String sessionId,
    required String currency,
  }) async {
    if (!_config.hasApiKey) {
      throw ApiError(
        'API key missing: set FRONTEND_API_KEY in assets/app_config.env (same as FRONTEND_API_KEY on the boutique frontend)',
        503,
        null,
      );
    }
    final res = await http.post(
      _uri(path),
      headers: _headers(sessionId, currency, withBody: true),
      body: body != null ? jsonEncode(body) : null,
    );
    return _parseResponse(res);
  }

  Future<dynamic> delete(String path, {required String sessionId, required String currency}) async {
    if (!_config.hasApiKey) {
      throw ApiError(
        'API key missing: set FRONTEND_API_KEY in assets/app_config.env (same as FRONTEND_API_KEY on the boutique frontend)',
        503,
        null,
      );
    }
    final res = await http.delete(_uri(path), headers: _headers(sessionId, currency));
    return _parseResponse(res);
  }

  Future<dynamic> _parseResponse(http.Response res) async {
    final data = _decodeBody(res.body);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      String msg = res.reasonPhrase ?? 'Request failed';
      if (data is Map && data['error'] != null) {
        msg = data['error'].toString();
      }
      throw ApiError(msg, res.statusCode, data);
    }
    return data;
  }

  static dynamic _decodeBody(String text) {
    if (text.isEmpty) return null;
    try {
      return jsonDecode(text);
    } catch (_) {
      return text;
    }
  }
}

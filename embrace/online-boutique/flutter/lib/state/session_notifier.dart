import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

const _sessionKey = 'ob_embrace_session_id';
const _currencyKey = 'ob_embrace_currency';

class SessionNotifier extends ChangeNotifier {
  String _sessionId = '';
  String _currency = 'USD';
  bool _ready = false;

  String get sessionId => _sessionId;
  String get currency => _currency;
  bool get isReady => _ready;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString(_sessionKey);
    if (id == null || id.isEmpty) {
      id = const Uuid().v4().replaceAll('-', '').substring(0, 16);
      await prefs.setString(_sessionKey, id);
    }
    _sessionId = id;
    _currency = prefs.getString(_currencyKey) ?? 'USD';
    _ready = true;
    notifyListeners();
  }

  Future<void> setCurrency(String code) async {
    _currency = code;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currencyKey, code);
  }
}

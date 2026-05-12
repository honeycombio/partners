import 'package:flutter/foundation.dart';

class CartBadgeNotifier extends ChangeNotifier {
  int _count = 0;

  int get count => _count;

  void setCount(int n) {
    if (_count == n) return;
    _count = n;
    notifyListeners();
  }
}

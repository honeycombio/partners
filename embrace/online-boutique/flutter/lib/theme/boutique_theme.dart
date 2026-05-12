import 'package:flutter/material.dart';

/// Matches `src/theme.js` from the React app.
class BoutiqueColors {
  static const text = Color(0xFF111111);
  static const muted = Color(0xFF707070);
  static const teal = Color(0xFF4BC7C7);
  static const bg = Color(0xFFFFFFFF);
  static const border = Color(0xFFB4B2BB);
  static const barBg = Color(0xFFF2F2F2);
  static const control = Color(0xFF605F64);
}

ThemeData boutiqueTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      surface: BoutiqueColors.bg,
      onSurface: BoutiqueColors.text,
      primary: BoutiqueColors.teal,
      onPrimary: BoutiqueColors.text,
    ),
    scaffoldBackgroundColor: BoutiqueColors.bg,
    appBarTheme: const AppBarTheme(
      backgroundColor: BoutiqueColors.bg,
      foregroundColor: BoutiqueColors.text,
      elevation: 0,
    ),
  );
}

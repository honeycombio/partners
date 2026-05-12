/// Same formatting as `src/utils/money.js`.
String formatMoney(Map<String, dynamic>? m) {
  if (m == null) return '—';
  final code = (m['currencyCode'] ?? m['currency_code'] ?? '').toString();
  final unitsRaw = m['units'];
  final units = unitsRaw is String ? int.tryParse(unitsRaw) ?? 0 : (unitsRaw as num?)?.toInt() ?? 0;
  final nanos = (m['nanos'] as num?)?.toInt() ?? 0;
  final frac = nanos.abs() / 1e9;
  final sign = units < 0 ? -1 : 1;
  final absU = units.abs();
  final total = absU + frac;
  final prefix = sign < 0 ? '-' : '';
  return '$code $prefix${total.toStringAsFixed(2)}';
}

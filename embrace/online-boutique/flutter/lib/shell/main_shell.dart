import 'package:flutter/material.dart';
import '../widgets/bridged_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_error.dart';
import '../api/boutique_api.dart';
import '../config/app_config.dart';
import '../state/cart_badge_notifier.dart';
import '../state/session_notifier.dart';
import '../theme/boutique_theme.dart';
import '../utils/assets.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  String? _banner;
  bool _adLoadStarted = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _refreshCartCount();
    _loadAdOnce();
  }

  void _refreshCartCount() {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    final badge = context.read<CartBadgeNotifier>();
    if (!session.isReady) return;
    api
        .get('/api/v1/cart', sessionId: session.sessionId, currency: session.currency)
        .then((d) {
          if (d is Map && mounted) {
            final n = d['cart_item_count'] as num? ?? 0;
            badge.setCount(n.toInt());
          }
        })
        .catchError((e) {
          if (e is ApiError && e.status == 503) return;
          if (mounted) badge.setCount(0);
        });
  }

  void _loadAdOnce() {
    if (_adLoadStarted) return;
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    if (!session.isReady) return;
    _adLoadStarted = true;
    api.get('/api/v1/ads', sessionId: session.sessionId, currency: session.currency).then((d) {
      if (!mounted || d is! Map) return;
      final ad = d['ad'];
      if (ad is Map && ad['text'] != null) {
        setState(() => _banner = ad['text'].toString());
      }
    }).catchError((_) {});
  }

  int? _tabIndex(String loc) {
    if (loc.startsWith('/product/')) return null;
    if (loc.startsWith('/search')) return 1;
    if (loc.startsWith('/cart')) return 2;
    if (loc == '/') return 0;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    final idx = _tabIndex(loc);
    final config = context.watch<AppConfig>();
    final count = context.watch<CartBadgeNotifier>().count;

    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _TopStrip(banner: _banner, onCurrencyChanged: () => setState(() {})),
          if (_banner != null && _banner!.isNotEmpty)
            Container(
              width: double.infinity,
              color: BoutiqueColors.teal,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
              child: Text(
                _banner!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          Container(
            color: const Color(0xFF111111),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            child: InkWell(
              onTap: () => context.go('/'),
              child: Align(
                alignment: Alignment.centerLeft,
                child: BridgedNetworkImage(
                  key: const ValueKey('nav-logo'),
                  url: assetUrl(config, '/static/icons/Hipster_NavLogo.svg'),
                  fit: BoxFit.contain,
                  width: 209,
                  height: 40,
                ),
              ),
            ),
          ),
          _TabBarRow(
            index: idx,
            cartCount: count,
            onSelect: (i) {
              switch (i) {
                case 0:
                  context.go('/');
                case 1:
                  context.go('/search');
                case 2:
                  context.go('/cart');
              }
            },
          ),
          Expanded(child: widget.child),
        ],
      ),
    );
  }
}

class _TopStrip extends StatelessWidget {
  const _TopStrip({required this.banner, required this.onCurrencyChanged});

  final String? banner;
  final VoidCallback onCurrencyChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: BoutiqueColors.bg,
        border: Border(bottom: BorderSide(color: BoutiqueColors.border)),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Free shipping with \$75 purchase!',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: BoutiqueColors.text),
            ),
          ),
          _CurrencyControl(onApplied: onCurrencyChanged),
        ],
      ),
    );
  }
}

class _CurrencyControl extends StatefulWidget {
  const _CurrencyControl({required this.onApplied});

  final VoidCallback onApplied;

  @override
  State<_CurrencyControl> createState() => _CurrencyControlState();
}

class _CurrencyControlState extends State<_CurrencyControl> {
  List<String> _codes = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchCodes());
  }

  Future<void> _fetchCodes() async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    if (!session.isReady) return;
    try {
      final d = await api.get('/api/v1/currencies', sessionId: session.sessionId, currency: session.currency);
      if (d is Map && d['currencies'] is List && mounted) {
        setState(() {
          _codes = (d['currencies'] as List).map((e) => e.toString()).toList();
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _codes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'TRY']);
      }
    }
  }

  Future<void> _apply(String code) async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    await session.setCurrency(code);
    widget.onApplied();
    api
        .post(
          '/api/v1/session/currency',
          {'currency_code': code},
          sessionId: session.sessionId,
          currency: session.currency,
        )
        .catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionNotifier>();
    final codes = _codes.isEmpty ? ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'TRY'] : _codes;

    return PopupMenuButton<String>(
      offset: const Offset(0, 28),
      itemBuilder: (context) => codes.map((c) => PopupMenuItem(value: c, child: Text(c))).toList(),
      onSelected: _apply,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(session.currency, style: const TextStyle(fontSize: 12, color: BoutiqueColors.control, fontWeight: FontWeight.w500)),
          const Text('▾', style: TextStyle(fontSize: 10, color: BoutiqueColors.control)),
        ],
      ),
    );
  }
}

class _TabBarRow extends StatelessWidget {
  const _TabBarRow({required this.index, required this.cartCount, required this.onSelect});

  final int? index;
  final int cartCount;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    const tabs = [('Home', 0), ('Search', 1), ('Cart', 2)];
    return Container(
      decoration: const BoxDecoration(
        color: BoutiqueColors.bg,
        border: Border(bottom: BorderSide(color: BoutiqueColors.border)),
      ),
      child: Row(
        children: tabs.map((t) {
          final active = index != null && index == t.$2;
          final isCart = t.$2 == 2;
          return Expanded(
            child: InkWell(
              onTap: () => onSelect(t.$2),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: active ? BoutiqueColors.teal : Colors.transparent, width: 2),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      t.$1,
                      style: TextStyle(
                        fontSize: 13,
                        color: active ? BoutiqueColors.text : BoutiqueColors.control,
                        fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                    if (isCart && cartCount > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(color: BoutiqueColors.teal, borderRadius: BorderRadius.circular(9)),
                        child: Text(
                          cartCount > 99 ? '99+' : '$cartCount',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 10, color: BoutiqueColors.text),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

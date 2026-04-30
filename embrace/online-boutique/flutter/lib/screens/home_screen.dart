import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_error.dart';
import '../api/boutique_api.dart';
import '../config/app_config.dart';
import '../state/cart_badge_notifier.dart';
import '../state/session_notifier.dart';
import '../theme/boutique_theme.dart';
import '../widgets/bridged_network_image.dart';
import '../utils/assets.dart';
import '../utils/money.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = true;
  List<dynamic> _rows = const [];
  String? _err;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    if (!session.isReady) return;
    setState(() {
      _loading = true;
      _err = null;
    });
    try {
      final d = await api.get('/api/v1/products', sessionId: session.sessionId, currency: session.currency);
      if (!mounted) return;
      setState(() {
        _rows = (d is Map && d['products'] is List) ? List<dynamic>.from(d['products'] as List) : [];
        _err = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _err = e is ApiError ? e.message : 'Failed to load products');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addToCart(String productId) async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    final badge = context.read<CartBadgeNotifier>();
    try {
      await api.post(
        '/api/v1/cart/items',
        {'product_id': productId, 'quantity': 1},
        sessionId: session.sessionId,
        currency: session.currency,
      );
      final c = await api.get('/api/v1/cart', sessionId: session.sessionId, currency: session.currency);
      if (c is Map && mounted) {
        final n = c['cart_item_count'] as num? ?? 0;
        badge.setCount(n.toInt());
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final config = context.watch<AppConfig>();

    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: BoutiqueColors.teal));
    }
    if (_err != null) {
      return Center(child: Text(_err!, style: const TextStyle(color: Color(0xFFB00020))));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Hot products', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              const gap = 8.0;
              final w = (constraints.maxWidth - gap) / 2;
              return Wrap(
                spacing: gap,
                runSpacing: 16,
                children: _rows.map((row) {
                  final r = row as Map<String, dynamic>;
                  final product = (r['product'] as Map?)?.cast<String, dynamic>() ?? {};
                  final price = (r['price'] as Map?)?.cast<String, dynamic>();
                  final id = product['id']?.toString() ?? '';
                  final pic = product['picture']?.toString() ?? '';
                  final name = product['name']?.toString() ?? '';
                  return SizedBox(
                    width: w,
                    child: _ProductCard(
                      width: w,
                      imageUrl: assetUrl(config, pic),
                      name: name,
                      priceText: formatMoney(price),
                      onTapProduct: () => context.go('/product/${Uri.encodeComponent(id)}'),
                      onAdd: () => _addToCart(id),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.width,
    required this.imageUrl,
    required this.name,
    required this.priceText,
    required this.onTapProduct,
    required this.onAdd,
  });

  final double width;
  final String imageUrl;
  final String name;
  final String priceText;
  final VoidCallback onTapProduct;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: BoutiqueColors.bg,
        border: Border.all(color: BoutiqueColors.border),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: onTapProduct,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: BridgedNetworkImage(
                  key: ValueKey(imageUrl),
                  url: imageUrl,
                  fit: BoxFit.cover,
                  width: width,
                  height: 120,
                ),
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: onTapProduct,
              child: Text(name, maxLines: 2, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: BoutiqueColors.text, height: 1.2)),
            ),
            const SizedBox(height: 6),
            Text(priceText, style: const TextStyle(fontSize: 13, color: BoutiqueColors.muted)),
            const SizedBox(height: 6),
            Material(
              color: BoutiqueColors.teal,
              borderRadius: BorderRadius.circular(4),
              child: InkWell(
                onTap: onAdd,
                borderRadius: BorderRadius.circular(4),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Center(child: Text('Add to cart', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: BoutiqueColors.text))),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

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

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key, required this.productId});

  final String productId;

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  bool _loading = true;
  Map<String, dynamic>? _product;
  Map<String, dynamic>? _price;
  List<dynamic> _recs = const [];
  String? _err;

  String get _id => widget.productId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void didUpdateWidget(ProductScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.productId != widget.productId) {
      _load();
    }
  }

  Future<void> _load() async {
    if (_id.isEmpty) return;
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    if (!session.isReady) return;
    setState(() {
      _loading = true;
      _err = null;
    });
    try {
      final d = await api.get(
        '/api/v1/products/${Uri.encodeComponent(_id)}',
        sessionId: session.sessionId,
        currency: session.currency,
      );
      if (!mounted) return;
      if (d is Map) {
        final product = d['product'];
        final price = d['price'];
        if (product is Map && price is Map) {
          setState(() {
            _product = Map<String, dynamic>.from(product);
            _price = Map<String, dynamic>.from(price);
            _recs = d['recommendations'] is List ? List<dynamic>.from(d['recommendations'] as List) : [];
            _err = null;
          });
        } else {
          setState(() => _err = 'Product not found');
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _err = e is ApiError ? e.message : 'Product not found');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addToCart() async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    final badge = context.read<CartBadgeNotifier>();
    try {
      await api.post(
        '/api/v1/cart/items',
        {'product_id': _id, 'quantity': 1},
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

    if (_err != null || _product == null) {
      return Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextButton(
              onPressed: () => context.pop(),
              child: const Text('← Back', style: TextStyle(fontSize: 15, color: BoutiqueColors.teal, fontWeight: FontWeight.w600)),
            ),
            Text(_err ?? 'Not found', style: const TextStyle(color: Color(0xFFB00020))),
          ],
        ),
      );
    }

    final p = _product!;
    final pic = p['picture']?.toString() ?? '';
    final name = p['name']?.toString() ?? '';
    final desc = p['description']?.toString() ?? '';
    final sku = p['id']?.toString() ?? '';

    void openRec(String rid) {
      context.go('/product/${Uri.encodeComponent(rid)}');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Align(
              alignment: Alignment.centerLeft,
              child: Text('← Back', style: TextStyle(fontSize: 15, color: BoutiqueColors.teal, fontWeight: FontWeight.w600)),
            ),
          ),
          SizedBox(
            height: 240,
            width: double.infinity,
            child: BridgedNetworkImage(
              key: ValueKey(assetUrl(config, pic)),
              url: assetUrl(config, pic),
              fit: BoxFit.contain,
              height: 240,
            ),
          ),
          const SizedBox(height: 12),
          Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
          Text('SKU: #$sku', style: const TextStyle(fontSize: 13, color: BoutiqueColors.muted)),
          const SizedBox(height: 12),
          Text(formatMoney(_price), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: BoutiqueColors.text)),
          const SizedBox(height: 8),
          Text(desc, style: const TextStyle(fontSize: 15, height: 1.47, color: BoutiqueColors.text)),
          const SizedBox(height: 16),
          Material(
            color: BoutiqueColors.teal,
            borderRadius: BorderRadius.circular(4),
            child: InkWell(
              onTap: _addToCart,
              borderRadius: BorderRadius.circular(4),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: Text('Add to cart', style: TextStyle(color: BoutiqueColors.text, fontWeight: FontWeight.w700))),
              ),
            ),
          ),
          if (_recs.isNotEmpty) ...[
            const SizedBox(height: 28),
            const Text('You may also like', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
            const SizedBox(height: 8),
            ..._recs.map((rec) {
              final r = rec as Map<String, dynamic>;
              final rp = (r['product'] as Map?)?.cast<String, dynamic>() ?? {};
              final rprice = (r['price'] as Map?)?.cast<String, dynamic>();
              final rid = rp['id']?.toString() ?? '';
              final rpPic = rp['picture']?.toString() ?? '';
              final rname = rp['name']?.toString() ?? '';
              return InkWell(
                onTap: () => openRec(rid),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: SizedBox(
                          width: 48,
                          height: 48,
                          child: BridgedNetworkImage(
                            key: ValueKey(assetUrl(config, rpPic)),
                            url: assetUrl(config, rpPic),
                            fit: BoxFit.cover,
                            width: 48,
                            height: 48,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(rname, style: const TextStyle(fontSize: 14, color: BoutiqueColors.text)),
                            const SizedBox(height: 4),
                            Text(formatMoney(rprice), style: const TextStyle(fontSize: 13, color: BoutiqueColors.muted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}

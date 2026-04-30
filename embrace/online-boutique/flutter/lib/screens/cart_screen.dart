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

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _loading = true;
  Map<String, dynamic>? _cart;
  String? _err;
  String? _orderMsg;

  final _email = TextEditingController(text: 'someone@example.com');
  final _street = TextEditingController(text: '1600 Amphitheatre Parkway');
  final _zip = TextEditingController(text: '94043');
  final _city = TextEditingController(text: 'Mountain View');
  final _state = TextEditingController(text: 'CA');
  final _country = TextEditingController(text: 'United States');
  final _cc = TextEditingController(text: '4432808768013908');
  final _ccMonth = TextEditingController(text: '1');
  final _ccYear = TextEditingController(text: '2030');
  final _ccCvv = TextEditingController(text: '672');
  bool _submitting = false;

  @override
  void dispose() {
    _email.dispose();
    _street.dispose();
    _zip.dispose();
    _city.dispose();
    _state.dispose();
    _country.dispose();
    _cc.dispose();
    _ccMonth.dispose();
    _ccYear.dispose();
    _ccCvv.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    final badge = context.read<CartBadgeNotifier>();
    if (!session.isReady) return;
    setState(() => _loading = true);
    try {
      final d = await api.get('/api/v1/cart', sessionId: session.sessionId, currency: session.currency);
      if (!mounted) return;
      if (d is Map) {
        setState(() {
          _cart = Map<String, dynamic>.from(d);
          final n = d['cart_item_count'] as num? ?? 0;
          badge.setCount(n.toInt());
          _err = null;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _err = e is ApiError ? e.message : 'Failed to load cart');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _empty() async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    final badge = context.read<CartBadgeNotifier>();
    try {
      await api.delete('/api/v1/cart', sessionId: session.sessionId, currency: session.currency);
      badge.setCount(0);
      await _load();
    } catch (_) {}
  }

  Future<void> _placeOrder() async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    setState(() {
      _submitting = true;
      _orderMsg = null;
    });
    try {
      final d = await api.post(
        '/api/v1/orders',
        {
          'email': _email.text,
          'street_address': _street.text,
          'zip_code': int.tryParse(_zip.text) ?? 0,
          'city': _city.text,
          'state': _state.text,
          'country': _country.text,
          'credit_card_number': _cc.text,
          'credit_card_expiration_month': int.tryParse(_ccMonth.text) ?? 1,
          'credit_card_expiration_year': int.tryParse(_ccYear.text) ?? 2030,
          'credit_card_cvv': int.tryParse(_ccCvv.text) ?? 0,
        },
        sessionId: session.sessionId,
        currency: session.currency,
      );
      if (!mounted) return;
      String msg = 'Order placed!';
      if (d is Map && d['order'] is Map) {
        final o = d['order'] as Map;
        final id = o['orderId'] ?? o['order_id'];
        if (id != null) msg = 'Order placed! Confirmation #$id';
      }
      setState(() => _orderMsg = msg);
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _orderMsg = e is ApiError ? e.message : 'Checkout failed');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = context.watch<AppConfig>();

    if (_loading && _cart == null) {
      return const Center(child: CircularProgressIndicator(color: BoutiqueColors.teal));
    }

    final items = (_cart?['items'] as List?) ?? [];
    final emptyCart = items.isEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Your cart', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
          if (_err != null) Text(_err!, style: const TextStyle(color: Color(0xFFB00020), height: 1.4)),
          if (_orderMsg != null) Text(_orderMsg!, style: const TextStyle(color: Color(0xFF1B5E20), fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          if (emptyCart) ...[
            const Text('Your shopping cart is empty!', style: TextStyle(fontSize: 18, color: BoutiqueColors.text)),
            const Text('Items you add will appear here.', style: TextStyle(color: BoutiqueColors.muted)),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => context.go('/'),
              child: const Text('Browse products →', style: TextStyle(color: BoutiqueColors.teal, fontWeight: FontWeight.w600, fontSize: 15)),
            ),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_cart?['cart_item_count'] ?? 0} item${(_cart?['cart_item_count'] as num? ?? 0) == 1 ? '' : 's'} in your cart',
                  style: const TextStyle(fontSize: 15, color: BoutiqueColors.text),
                ),
                OutlinedButton(
                  onPressed: _empty,
                  style: OutlinedButton.styleFrom(foregroundColor: BoutiqueColors.control, side: const BorderSide(color: BoutiqueColors.border)),
                  child: const Text('Empty cart', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...items.asMap().entries.map((e) {
              final i = e.key;
              final line = e.value as Map<String, dynamic>;
              final product = (line['product'] as Map?)?.cast<String, dynamic>() ?? {};
              final qty = (line['quantity'] as num?)?.toInt() ?? 0;
              final price = (line['price'] as Map?)?.cast<String, dynamic>();
              final pid = product['id']?.toString() ?? '$i';
              final pic = product['picture']?.toString() ?? '';
              final name = product['name']?.toString() ?? '';
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    InkWell(
                      onTap: () => context.go('/product/${Uri.encodeComponent(pid)}'),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: BridgedNetworkImage(
                          key: ValueKey(assetUrl(config, pic)),
                          url: assetUrl(config, pic),
                          fit: BoxFit.cover,
                          width: 88,
                          height: 88,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: BoutiqueColors.text)),
                          Text('SKU: #$pid', style: const TextStyle(fontSize: 12, color: BoutiqueColors.muted)),
                          Text('Quantity: $qty', style: const TextStyle(fontSize: 13, color: BoutiqueColors.text)),
                          Text(formatMoney(price), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
            const Divider(color: BoutiqueColors.border),
            Align(
              alignment: Alignment.centerRight,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Shipping: ${formatMoney((_cart?['shipping_cost'] as Map?)?.cast<String, dynamic>())}',
                      style: const TextStyle(fontSize: 14, color: BoutiqueColors.muted)),
                  const SizedBox(height: 6),
                  Text('Total: ${formatMoney((_cart?['total_cost'] as Map?)?.cast<String, dynamic>())}',
                      style: const TextStyle(fontSize: 17, color: BoutiqueColors.text)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Checkout', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
            const SizedBox(height: 8),
            _LabeledField(label: 'E-mail', controller: _email, keyboard: TextInputType.emailAddress),
            _LabeledField(label: 'Street address', controller: _street),
            Row(
              children: [
                Expanded(child: _LabeledField(label: 'Zip', controller: _zip)),
                const SizedBox(width: 16),
                Expanded(child: _LabeledField(label: 'City', controller: _city)),
              ],
            ),
            Row(
              children: [
                Expanded(child: _LabeledField(label: 'State', controller: _state)),
                const SizedBox(width: 16),
                Expanded(child: _LabeledField(label: 'Country', controller: _country)),
              ],
            ),
            _LabeledField(label: 'Credit card number', controller: _cc),
            Row(
              children: [
                Expanded(child: _LabeledField(label: 'Exp. month', controller: _ccMonth)),
                const SizedBox(width: 16),
                Expanded(child: _LabeledField(label: 'Exp. year', controller: _ccYear)),
              ],
            ),
            _LabeledField(label: 'CVV', controller: _ccCvv),
            const SizedBox(height: 16),
            Material(
              color: BoutiqueColors.teal,
              borderRadius: BorderRadius.circular(4),
              child: InkWell(
                onTap: _submitting ? null : _placeOrder,
                borderRadius: BorderRadius.circular(4),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Center(
                    child: Text(
                      _submitting ? 'Placing order…' : 'Place order',
                      style: const TextStyle(color: BoutiqueColors.text, fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({required this.label, required this.controller, this.keyboard = TextInputType.text});

  final String label;
  final TextEditingController controller;
  final TextInputType keyboard;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: BoutiqueColors.muted)),
          const SizedBox(height: 4),
          TextField(
            controller: controller,
            keyboardType: keyboard,
            style: const TextStyle(fontSize: 15, color: BoutiqueColors.text),
            decoration: InputDecoration(
              filled: true,
              fillColor: BoutiqueColors.bg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: const BorderSide(color: BoutiqueColors.border)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: const BorderSide(color: BoutiqueColors.border)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            ),
          ),
        ],
      ),
    );
  }
}

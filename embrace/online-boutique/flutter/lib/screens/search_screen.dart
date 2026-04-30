import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_error.dart';
import '../api/boutique_api.dart';
import '../config/app_config.dart';
import '../state/session_notifier.dart';
import '../theme/boutique_theme.dart';
import '../widgets/bridged_network_image.dart';
import '../utils/assets.dart';
import '../utils/money.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  bool _loading = false;
  List<dynamic> _rows = const [];
  String? _err;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _runSearch(String raw) {
    final query = raw.trim();
    if (query.length < 2) {
      setState(() {
        _rows = [];
        _err = null;
      });
      return;
    }
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _fetch(query));
  }

  Future<void> _fetch(String query) async {
    final api = context.read<BoutiqueApi>();
    final session = context.read<SessionNotifier>();
    if (!session.isReady) return;
    setState(() {
      _loading = true;
      _err = null;
    });
    try {
      final d = await api.get(
        '/api/v1/products/search?q=${Uri.encodeQueryComponent(query)}',
        sessionId: session.sessionId,
        currency: session.currency,
      );
      if (!mounted) return;
      setState(() {
        _rows = (d is Map && d['products'] is List) ? List<dynamic>.from(d['products'] as List) : [];
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _err = e is ApiError ? e.message : 'Search failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = context.watch<AppConfig>();

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Search', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: InputDecoration(
                    hintText: 'Search products',
                    hintStyle: const TextStyle(color: BoutiqueColors.muted),
                    filled: true,
                    fillColor: BoutiqueColors.barBg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(4),
                      borderSide: const BorderSide(color: BoutiqueColors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(4),
                      borderSide: const BorderSide(color: BoutiqueColors.border),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  style: const TextStyle(fontSize: 15, color: BoutiqueColors.text),
                  textInputAction: TextInputAction.search,
                  onChanged: _runSearch,
                  onSubmitted: (_) {
                    final q = _controller.text.trim();
                    if (q.isNotEmpty) _fetch(q);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Material(
                color: BoutiqueColors.teal,
                borderRadius: BorderRadius.circular(4),
                child: InkWell(
                  onTap: () {
                    final q = _controller.text.trim();
                    if (q.isNotEmpty) _fetch(q);
                  },
                  borderRadius: BorderRadius.circular(4),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Text('Go', style: TextStyle(fontWeight: FontWeight.w600, color: BoutiqueColors.text)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: BoutiqueColors.teal))
                : _err != null
                    ? Text(_err!, style: const TextStyle(color: Color(0xFFB00020)))
                    : ListView.separated(
                        itemCount: _rows.length,
                        separatorBuilder: (_, _) => const Divider(height: 1, color: BoutiqueColors.border),
                        itemBuilder: (context, i) {
                          final row = _rows[i] as Map<String, dynamic>;
                          final product = (row['product'] as Map?)?.cast<String, dynamic>() ?? {};
                          final price = (row['price'] as Map?)?.cast<String, dynamic>();
                          final id = product['id']?.toString() ?? '';
                          final pic = product['picture']?.toString() ?? '';
                          final name = product['name']?.toString() ?? '';
                          return InkWell(
                            onTap: () => context.go('/product/${Uri.encodeComponent(id)}'),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              child: Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                      child: BridgedNetworkImage(
                                        key: ValueKey(assetUrl(config, pic)),
                                        url: assetUrl(config, pic),
                                        fit: BoxFit.cover,
                                        width: 56,
                                        height: 56,
                                      ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(name, maxLines: 2, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: BoutiqueColors.text)),
                                        const SizedBox(height: 4),
                                        Text(formatMoney(price), style: const TextStyle(fontSize: 13, color: BoutiqueColors.muted)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

// Flutter web: real <img> avoids CORS failures from Image.network's fetch-based loader.
// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

/// Uses an HTML `<img>` so cross-origin JPEG/PNG/SVG load without CORS fetch (Flutter web).
class BridgedNetworkImage extends StatefulWidget {
  const BridgedNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;

  @override
  State<BridgedNetworkImage> createState() => _BridgedNetworkImageState();
}

class _BridgedNetworkImageState extends State<BridgedNetworkImage> {
  static final Map<String, String> _cacheKeyToViewType = {};
  static int _seq = 0;

  late String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = _ensureFactory(widget.url, widget.fit);
  }

  @override
  void didUpdateWidget(BridgedNetworkImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url || oldWidget.fit != widget.fit) {
      setState(() => _viewType = _ensureFactory(widget.url, widget.fit));
    }
  }

  static String _ensureFactory(String url, BoxFit fit) {
    final cacheKey = '$url|${fit.name}';
    final existing = _cacheKeyToViewType[cacheKey];
    if (existing != null) {
      return existing;
    }

    final vt = 'online_boutique_img_${_seq++}';
    _cacheKeyToViewType[cacheKey] = vt;
    final objectFit = _objectFitCss(fit);
    ui_web.platformViewRegistry.registerViewFactory(vt, (int _) {
      final img = html.ImageElement()
        ..src = url
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.objectFit = objectFit
        ..style.display = 'block';
      return img;
    });
    return vt;
  }

  static String _objectFitCss(BoxFit fit) {
    switch (fit) {
      case BoxFit.fill:
        return 'fill';
      case BoxFit.contain:
        return 'contain';
      case BoxFit.cover:
        return 'cover';
      case BoxFit.fitWidth:
      case BoxFit.fitHeight:
        return 'contain';
      case BoxFit.none:
        return 'none';
      case BoxFit.scaleDown:
        return 'scale-down';
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: HtmlElementView(viewType: _viewType),
    );
  }
}

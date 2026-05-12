import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/boutique_theme.dart';

/// Loads raster images via [Image.network]. SVG uses [SvgPicture.network] (IO/desktop/mobile).
///
/// On web, the conditional export uses an HTML `<img>` instead so catalog images are not blocked
/// by CORS (Flutter web’s network image path uses fetch/XHR).
class BridgedNetworkImage extends StatelessWidget {
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

  bool get _isSvg => url.toLowerCase().contains('.svg');

  @override
  Widget build(BuildContext context) {
    if (_isSvg) {
      return SvgPicture.network(url, fit: fit, width: width, height: height);
    }
    return Image.network(
      url,
      fit: fit,
      width: width,
      height: height,
      alignment: Alignment.center,
      errorBuilder: (context, error, stackTrace) {
        return ColoredBox(
          color: BoutiqueColors.barBg,
          child: Icon(Icons.broken_image_outlined, color: Colors.grey.shade600),
        );
      },
    );
  }
}

import 'package:embrace/embrace.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/cart_screen.dart';
import '../screens/home_screen.dart';
import '../screens/product_screen.dart';
import '../screens/search_screen.dart';
import '../shell/main_shell.dart';

final _rootKey = GlobalKey<NavigatorState>();

GoRouter createRouter() {
  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    observers: kIsWeb
        ? const <NavigatorObserver>[]
        : <NavigatorObserver>[EmbraceNavigationObserver()],
    routes: [
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            name: 'home',
            path: '/',
            pageBuilder: (context, state) => const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            name: 'search',
            path: '/search',
            pageBuilder: (context, state) => const NoTransitionPage(child: SearchScreen()),
          ),
          GoRoute(
            name: 'cart',
            path: '/cart',
            pageBuilder: (context, state) => const NoTransitionPage(child: CartScreen()),
          ),
          GoRoute(
            name: 'product',
            path: '/product/:id',
            pageBuilder: (context, state) {
              final id = state.pathParameters['id'] ?? '';
              return NoTransitionPage(child: ProductScreen(productId: id));
            },
          ),
        ],
      ),
    ],
  );
}

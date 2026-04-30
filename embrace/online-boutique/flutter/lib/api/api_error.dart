class ApiError implements Exception {
  ApiError(this.message, this.status, this.body);

  final String message;
  final int status;
  final Object? body;

  @override
  String toString() => 'ApiError($status): $message';
}

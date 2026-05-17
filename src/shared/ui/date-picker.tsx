// Non-breaking re-export shim — the real package lives in `./date-picker/`.
// Using the explicit `/index` suffix avoids the file-vs-folder resolution
// ambiguity that would otherwise route imports back to this very file.
export * from './date-picker/index';

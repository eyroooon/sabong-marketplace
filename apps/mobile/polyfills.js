// Polyfills that must load BEFORE any app code, at the very top of the bundle.
//
// Hermes (React Native's JS engine on iOS/Android) doesn't expose
// SharedArrayBuffer. The WebIDL conversion layer used by several deps
// (undici, @whatwg-node, webidl-conversions) probes it at MODULE LOAD
// with `Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable").get`
// — crashing with "Cannot read property 'get' of undefined" when SAB
// doesn't exist or lacks the `growable` accessor.
//
// Fix: provide a stub constructor whose prototype exposes the standard
// accessors the WebIDL probes expect (byteLength, growable, grow,
// maxByteLength, slice) so property-descriptor lookups never return
// undefined.
if (typeof globalThis.SharedArrayBuffer === "undefined") {
  // Stub constructor that behaves like an empty ArrayBuffer. Nothing in our
  // app actually constructs a SharedArrayBuffer — we only need the symbol
  // and its prototype shape to exist.
  function SharedArrayBufferStub(length) {
    return new ArrayBuffer(length || 0);
  }

  // Match the spec: throw if called without `new`
  Object.defineProperty(SharedArrayBufferStub, "name", { value: "SharedArrayBuffer" });

  // Build a prototype that exposes the accessors WebIDL runtime typecheckers
  // look for. Each returns a safe default since the probes swallow errors
  // via try/catch in most cases.
  Object.defineProperty(SharedArrayBufferStub.prototype, "byteLength", {
    configurable: true,
    get: function () {
      return 0;
    },
  });
  Object.defineProperty(SharedArrayBufferStub.prototype, "growable", {
    configurable: true,
    get: function () {
      return false;
    },
  });
  Object.defineProperty(SharedArrayBufferStub.prototype, "maxByteLength", {
    configurable: true,
    get: function () {
      return 0;
    },
  });
  SharedArrayBufferStub.prototype.grow = function () {};
  SharedArrayBufferStub.prototype.slice = function () {
    return new ArrayBuffer(0);
  };
  SharedArrayBufferStub.prototype[Symbol.toStringTag] = "SharedArrayBuffer";

  globalThis.SharedArrayBuffer = SharedArrayBufferStub;
}

// String.prototype.isWellFormed / toWellFormed — ES2024, not in older Hermes.
// The WebIDL DOMString converter (used by the polyfilled URL class in
// react-native-url-polyfill and @whatwg-node/fetch) calls `.toWellFormed()`
// on every string it returns. Missing this crashes at module load in deps
// like `expo-constants` → `getManifestBaseUrl()` → `new URL(...)`.
//
// For our purposes (Philippine gamefowl marketplace — no lone surrogates in
// user data), a no-op that returns the string as-is is safe.
if (typeof String.prototype.isWellFormed !== "function") {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(String.prototype, "isWellFormed", {
    configurable: true,
    writable: true,
    value: function () {
      // A string is well-formed if it has no lone surrogates.
      var s = String(this);
      // Fast path: check for lone surrogates with a regex
      return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s);
    },
  });
}
if (typeof String.prototype.toWellFormed !== "function") {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(String.prototype, "toWellFormed", {
    configurable: true,
    writable: true,
    value: function () {
      // Replace lone surrogates with U+FFFD REPLACEMENT CHARACTER.
      return String(this).replace(
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
        "\uFFFD",
      );
    },
  });
}

// Some deps also probe ArrayBuffer.prototype.resizable / maxByteLength.
// Hermes ships with these on modern iOS, but older engines may lack them.
// Defensive: only polyfill if missing.
if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.prototype) {
  if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "resizable")) {
    Object.defineProperty(ArrayBuffer.prototype, "resizable", {
      configurable: true,
      get: function () {
        return false;
      },
    });
  }
  if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "maxByteLength")) {
    Object.defineProperty(ArrayBuffer.prototype, "maxByteLength", {
      configurable: true,
      get: function () {
        return this.byteLength;
      },
    });
  }
}

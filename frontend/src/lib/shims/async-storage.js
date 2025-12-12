// Shim for React Native AsyncStorage.
// Some wallet SDKs list it as an optional peer dependency but still reference it.
// In the browser build we provide a harmless empty module.

module.exports = {};
module.exports.default = {};

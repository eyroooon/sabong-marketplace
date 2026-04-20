module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // react-native-worklets plugin replaces the old reanimated/plugin in
      // Reanimated 4. Must be listed last so it processes all worklet
      // declarations after other plugins.
      "react-native-worklets/plugin",
    ],
  };
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Plugin của Reanimated phải được đặt ở cuối cùng
      "react-native-reanimated/plugin",
    ],
  };
};

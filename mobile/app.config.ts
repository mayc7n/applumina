import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const buildDesenvolvimento = process.env.APP_VARIANT === "development";

  return {
    ...config,
    name: config.name ?? "Lumina",
    slug: config.slug ?? "lumina",
    plugins: config.plugins?.map((plugin) => {
      if (!Array.isArray(plugin) || plugin[0] !== "expo-build-properties") {
        return plugin;
      }

      return [
        plugin[0],
        {
          ...plugin[1],
          android: {
            ...(plugin[1]?.android ?? {}),
            usesCleartextTraffic: buildDesenvolvimento,
          },
        },
      ];
    }),
  };
};

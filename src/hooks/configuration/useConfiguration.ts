import config from "@/config/config.json";

const useConfiguration = <T>(key: string): T => {
  const env = process.env.NEXT_PUBLIC_ENV || "development";
  const envConfig = config[env as keyof typeof config] as Record<string, unknown>;
  return envConfig[key] as T;
};

export default useConfiguration;

// The `useConfiguration` hook is a utility to fetch environment-specific configuration values from a `config.json` file. 
// It dynamically determines the current environment 
// (`development`, `test`, `production`) using `NEXT_PUBLIC_ENV` 
// and retrieves the corresponding settings for keys like
//  `queryCacheTimeMs` or `refreshQueriesOnWindowFocus`.
//  This ensures the app behaves differently based on the environment without hardcoding values.
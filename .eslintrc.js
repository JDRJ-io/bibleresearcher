module.exports = {
  extends: ["@typescript-eslint/recommended"],
  rules: {
    "no-restricted-globals": ["error", "document", "window", "fetch", "querySelector"],
    "no-console": ["error", { allow: [] }],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@supabase/supabase-js"],
            message: "Direct Supabase imports are not allowed outside of BibleDataAPI facade. Use BibleDataAPI methods instead."
          }
        ]
      }
    ]
  },
  overrides: [
    {
      files: ["client/src/lib/logger.ts"],
      rules: {
        "no-console": "off"
      }
    },
    {
      files: ["client/src/data/BibleDataAPI.ts", "client/src/lib/supabaseLoader.ts", "client/src/lib/queryClient.ts"],
      rules: {
        "no-restricted-globals": "off",
        "no-restricted-imports": "off"
      }
    },
    {
      files: ["client/src/hooks/use*.ts"],
      rules: {
        "no-restricted-globals": "off"
      }
    }
  ]
};
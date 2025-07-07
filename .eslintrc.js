module.exports = {
  extends: ["@typescript-eslint/recommended"],
  rules: {
    "no-restricted-globals": ["error", "document", "window", "fetch", "querySelector"]
  }
};
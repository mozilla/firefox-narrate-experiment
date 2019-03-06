module.exports = {
  env: {
    es6: true,
    webextensions: true
  },
  extends: ["eslint:recommended", "plugin:mozilla/recommended"],
  plugins: ["mozilla"],
  rules: {
    "comma-dangle": ["error", "never"],
    semi: ["error", "never"]
  }
}

/** @typedef {import('prettier').Config} PrettierConfig */

/** @type { PrettierConfig } */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 80,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  trailingComma: 'always',
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  jsxBracketSameLine: false,
  bracketSpacing: true,
  endOfLine: 'auto',
}

export default config
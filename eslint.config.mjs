// next lint was removed in Next.js 16; eslint-config-next now ships flat
// config arrays directly (no FlatCompat shim needed), replacing the old
// .eslintrc.json's `extends: ["next/core-web-vitals", "next/typescript"]`.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  { ignores: ["coverage/**"] },
];

export default eslintConfig;

// @ts-check
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['dist/**', '.serverless/**'],
  },
  ...baseConfig,
];

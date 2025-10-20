/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/domain-variant-service/test/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/domain-variant-service'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
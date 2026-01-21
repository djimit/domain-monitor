/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/domain-variant-service/test/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>/domain-variant-service'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
        moduleResolution: 'node',
      },
      useESM: false,
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/domain-variant-service/src/$1'
  },
  collectCoverageFrom: [
    'domain-variant-service/src/**/*.{ts,tsx}',
    '!domain-variant-service/src/**/*.d.ts',
  ],
};
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Reduce default timeout to 30s to avoid masking slow/hanging tests.
  // Make it overridable via JEST_TIMEOUT (milliseconds) when longer timeout is required.
  testTimeout: parseInt(process.env.JEST_TIMEOUT || '30000', 10),
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

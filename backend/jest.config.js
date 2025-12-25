/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Reduce default timeout to 30s to avoid masking slow/hanging tests.
  // This is lower than Jest's default and may cause timeouts in CI or on slower machines.
  // Use the JEST_TIMEOUT environment variable (milliseconds) to override this value when needed,
  // for example: JEST_TIMEOUT=120000 in CI for a 2-minute timeout.
  testTimeout: parseInt(process.env.JEST_TIMEOUT || '30000', 10),
  roots: ['<rootDir>/src', '<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

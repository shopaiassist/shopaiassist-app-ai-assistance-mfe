import type { Config } from 'jest';

const config: Config = {
  // Determines whether Jest should collect coverage information
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,jxs,ts,tsx}', '!<rootDir>/src/**/*.d.ts'],

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage/',

  // An array of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    [
      'text',
      {
        skipFull: false,
      },
    ],
    'text-summary',
    'html',
    'lcov'
  ],

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules'],

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '\\.(jpg|ico|jpeg|png|gif)$': '<rootDir>/__mocks__/fileMock.js',
    '.+\\.(css|styl|less|sass|scss|ttf|woff|woff2)$': 'identity-obj-proxy',
  },

  // The roots of your project, files outside this folder are considered not affected by tests
  roots: ['<rootDir>/src/'],

  // A list of paths to modules that run some code to configure or set up the testing _environment_ before each test
  setupFiles: [],

  // A list of paths to modules that run some code to configure or set up the testing _framework_ before each test
  setupFilesAfterEnv: ['./jest-setup.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};

export default config;

/* eslint-disable */
// eslint-disable-next-line no-undef
export default {
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/authentication-service',
  displayName: 'authentication-service',
  testEnvironment: 'node',
};

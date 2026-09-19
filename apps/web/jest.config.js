const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/app/**/layout.tsx',
  ],
}

module.exports = async () => {
  const jestConfig = await createJestConfig(customJestConfig)()
  jestConfig.transformIgnorePatterns = [
    'node_modules/(?!(next-intl|use-intl|@formatjs|intl-messageformat)/)',
  ]
  return jestConfig
}

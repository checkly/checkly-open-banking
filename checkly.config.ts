import { defineConfig } from 'checkly'

const config = defineConfig({
  projectName: 'OpenBanking CLI Project',
  logicalId: 'openbanking-example-project',
  repoUrl: 'https://github.com/checkly-solution/openbanking',
  checks: {
    locations: ['us-east-1', 'us-east-2', 'us-west-1'],
    tags: ['open-banking'],
    runtimeId: '2023.09',
    checkMatch: '**/*.check.ts',
    browserChecks: {
      testMatch: '**/__checks__/*.spec.ts',
    },
  },
})

export default config

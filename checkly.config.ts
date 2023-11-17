import { defineConfig } from 'checkly'

const config = defineConfig({
  projectName: 'OpenBanking CLI Project',
  logicalId: 'OpenBanking-01-11-example-project',
  repoUrl: 'https://github.com/checkly/checkly-cli',
  checks: {
    muted: true,
    locations: ['us-east-1', 'eu-west-1'],
    tags: ['OpenBanking'],
    runtimeId: '2023.09',
    checkMatch: '**/*.check.ts',
    browserChecks: {
      testMatch: '**/__checks__/*.spec.ts',
    },
  },
  cli: {
    runLocation: 'eu-west-2',
  },
})

export default config

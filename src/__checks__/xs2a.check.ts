import * as path from 'path'
import { MultiStepCheck } from 'checkly/constructs'
import { emailChannel, callChannel } from './alertChannels'

new MultiStepCheck('xs2a-flow-check', {
    name: 'Klarna Open Banking - XS2A API Flow',
    alertChannels: [emailChannel, callChannel],
    muted: false,
    code: {
      entrypoint: path.join(__dirname, 'xs2a.spec.ts')
    },
  })
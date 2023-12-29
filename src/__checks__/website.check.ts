import * as path from 'path'
import { MultiStepCheck } from 'checkly/constructs'
import { emailChannel, callChannel } from './alertChannels'

new MultiStepCheck('homepage-browser-check', {
    name: 'Klarna Open Banking - XS2A API Flow',
    alertChannels: [emailChannel, callChannel],
    muted: false,
    code: {
      entrypoint: path.join(__dirname, 'multistep.spec.ts')
    },
  })
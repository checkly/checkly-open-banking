import { CheckGroup } from 'checkly/constructs'
import { emailChannel } from './alertChannels'


/*
* In this example, we bundle checks using a Check Group. We add checks to this group in two ways:
* 1. By passing the 'CheckGroup' object for the 'group' property of the check.
* 2. By defining a glob pattern like '*.spec.ts' that matches Browser Checks , just like at the Project level, e.g.
*
*  browserChecks: {
*    testMatch: './*.spec.ts'
*  }
*
* You can use either or both. In this example we show option 1.
**/

export const websiteGroup = new CheckGroup('OpenBanking-group', {
  name: 'OpenBanking',
  activated: true,
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['OpenBanking'],
  alertChannels: [emailChannel],
  muted: false,
  concurrency: 10,
  browserChecks: {
    testMatch: '*.spec.js'
  }
})
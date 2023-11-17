import * as path from 'path'
import { MultiStepCheck } from 'checkly/constructs'
import { emailChannel } from './alertChannels'
import { websiteGroup } from './specGroups.check'

/*
* In this example, we bundle all basic checks needed to check the Checkly homepage. We explicitly define the Browser
* check here, instead of using a default based on a .spec.js file. This allows us to override the check configuration.
* We can also add more checks into one file, in this case to cover a specific API call needed to hydrate the homepage.
*/

// We can define multiple checks in a single *.check.ts file.
new MultiStepCheck('homepage-browser-check', {
    name: 'OpenBanking home page check',
    group: websiteGroup,
    // alertChannels: [emailChannel],
    // muted: false,
    code: {
      entrypoint: path.join(__dirname, 'multistep.spec.ts')
    },
  })
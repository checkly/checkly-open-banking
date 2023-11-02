import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
testDir: './src/__checks__',
timeout: 30 * 1000,
expect: {
    timeout: 5000
},
fullyParallel: true,
forbidOnly: !!process.env.CI,
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,
//reporter: 'html',
use: {
    actionTimeout: 5000,
    trace: 'on',
    video: 'on',
},
projects: [
    {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    },
],
});
# Checkly Open Banking sample

## Overview
This repository contains a sample CLI project that uses Checkly to monitor a multi-step open banking flow on the [Kosma platform](https://www.kosma.com/) by Klarna.

## Repository Structure
* `src/__checks__/`: Where Checkly constructs and the Playwright spec for the Kosma check live.
* `checkly.config.ts`: Configuration file for the Checkly CLI project.
* `playwright.config.ts`: Playwright configuration file.

## Usage
* Clone the Repository
* Run `npm install` to install necessary packages
* To test your check on Checkly before deploying it, run `npx checkly test -e KOSMA_AUTH_TOKEN=<your_kosma_auth_token>`
* Before deploying your project, run `npx checkly env add KOSMA_AUTH_TOKEN <your_kosma_auth_token> -l` to push your environment variable to Checkly
* To deploy your project on Checkly, run `npx checkly deploy`
# AI Assistance Micro Frontend (MFE)

## Overview

Introducing `assistane_mfe`, our innovative micro-frontend designed for interactive and intelligent AI
assistant and chat functionalities. Named after Assistance, the Greek god known for communication and
eloquence, this service is tailored to facilitate engaging and insightful conversations within our
digital platform. Seamlessly integrated with the (https://github.com/shopaiassist) main
container app, assistance-mfe enriches user interaction with AI-driven insights and conversational
capabilities.

![Map of Repositories](doc/assets/repos-map.png)

This repository hosts a React-based Micro Frontend (MFE) application, designed to be integrated
within a larger MFE architecture. The application, featuring a Node.js server backend, acts as a
standalone unit that can be seamlessly embedded into a container application. Leveraging Webpack 5
and Module Federation, it exposes its components via a `remoteEntry` file, allowing for dynamic
integration and interaction with other MFEs. This approach ensures modularity and scalability in
developing complex web applications.

## Micro Frontends

* [Features](doc/micro-frontends#features)
* [Example: Configuring Webpack with Module Federation to Expose a Component](doc/micro-frontends#example-configuring-webpack-with-module-federation-to-expose-a-component)
* [Building and Contributing MFEs](doc/micro-frontends#building-and-contributing-mfes)
* [Best Practices](doc/micro-frontends#best-practices)
* [Communication between MFEs](doc/micro-frontends#communication-between-mfes)

## Getting Started

### Prerequisites

- Node.js (version 20.x or higher)
    - You can install [nvm](https://nvm.sh/) to manage multiple Node.js versions. There is [a script](https://github.com/nvm-sh/nvm#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file) you can add to your shell profile to automatically switch to the correct Node.js version when you enter the project directory.
- npm (version 6.x or higher)
- NPM private registry access for `` packages:
    1. Go to https://www.npmjs.com/
    2. Sign in with your TR/ NPM login (Request access to the  NPM registry by contacting
       the  engineering team at engineering.com).
    3. Click on your user icon in the top right corner and go to Access Tokens.
    4. Click Generate New Token > Classic Token.
    5. Add token to your shell environment. Replace `YOUR_ACCESS_TOKEN` with the actual token value:
       ```
       echo 'export _NPM_TOKEN=YOUR_ACCESS_TOKEN' >> ~/.zshrc
       ```
- NPM Artifactory access for `` packages:
    1. Go to https://npm/packages
    2. Sign in with SAML SSO
    3. Click on Welcome, \employee id in the top right corner
    4. Click Edit Profile
    5. Click Generate API Key
    6. Add token to your shell environment. Replace `YOUR_TR_EMPLOYEE_ID` and `YOUR_NPM_API_KEY` with your actual values:
       ```
       echo 'export NPM_TOKEN='$(echo -n "YOUR_ID:YOUR_NPM_API_KEY" | base64 -w 0)'' >> ~/.zshrc
       ```
- If you are using bash shell, replace `~/.zshrc` with `~/.bashrc` in the above commands.
- After adding the token values, reload your shell profile with the command `source ~/.zshrc` (or the appropriate
  file name for your shell).

### Installation

1. **Install Dependencies:**
   ```
   npm install
   ```

2. **Set Up Environment Variables:**

- Make a copy of the `example.env` file and rename it to `.env`:
  ```
  cp example.env .env
  ```
- Open the `.env` file and set your environment variables. This file will typically include
  configurations like API endpoints, secret keys, and other necessary settings.

3. **One-time setup:**
   ```
   npm run setup
   ```

4. **Start the Node.js Server:**
   ```
   npm start
   ```

## Running Tests

To ensure the reliability and stability of the application, a comprehensive suite of tests is
provided. To run these tests, execute the following command in the project root:

```
npm test
```

This command will run all unit tests defined in the project. It's recommended to run these tests
before pushing any changes to the repository.

## Creating auth token during development

The container app is responsible for providing the authentication token (auth token) to the Micro Frontends (MFEs).
During development, you may need to create an auth token to test the MFEs in isolation and to communicate with
the backend services. To accomplish this, you can utilize the `createAuthToken` script provided in the `scripts` directory.

The script requires the following environment variables to be set: `AUTH_TOKEN_DOMAIN`, `AUTH_TOKEN_EMAIL`,
and `AUTH_TOKEN_PWD`. By default, the `AUTH_TOKEN_DOMAIN` is set to `https://staging.com`.
The `AUTH_TOKEN_EMAIL` and `AUTH_TOKEN_PWD` are utilized to log in to the domain and generate the auth token.
If you do not have an account on the domain or wish to create an additional one for testing purposes, please
follow the instructions below:

1. Navigate to the subscribe page (https://staging.com/subscribe).
2. Click on "subscribe now" for the "Core" product.
3. You will be prompted to create an account, including providing an email address and password. Use these credentials
   to set the `AUTH_TOKEN_EMAIL` and `AUTH_TOKEN_PWD` environment variables.
4. After creating the account, you will be redirected to a Stripe checkout page. When prompted for a credit card
   number, you can use the following test credit card number: `XXXX XXXX XXXX XXXX`. The expiration date and CVC
   can be any future date and any 3-digit number, respectively.
5. Upon completing the checkout process, you will be redirected to the dashboard. You can now utilize
   the `create-auth-token` script to generate the auth token by running the following command:

```
npm run create-auth-token
```

## Deploying the MFE

The MFEs are currently deployed to Heroku.

### Pre-requisites
1. **Install Heroku CLI**: Make sure to have the Heroku Command Line Interface (CLI) installed on your machine.
   You can find installation instructions [here](https://devcenter.heroku.com/articles/heroku-cli).
2. **Login to Heroku**: Use the following command to log in to Heroku via the CLI:
   ```
   heroku login
   ```
   After running this command, follow the prompts in your browser to enter your Heroku credentials.
3. **Add Heroku Remote**: In your project directory, add the Heroku remote to your local repository with the following command:
   ```
   heroku git:remote -a cc-mfe-dev -r staging
   ```
   Here, "cc-mfe-dev" is the name of the (staging) Heroku app, and "staging" is the chosen name for the git remote.

## Staging Deployment
### Deploying the main branch to the staging Heroku environment
To deploy the MFE to the staging environment using the main branch, execute the following command:

```
git push staging master
```

### Deploying a feature branch to the staging Heroku environment
To deploy a feature branch to the staging environment, use the following command:

```
git push staging master:your_feature_branch_name
```

## Using this Repository as a Template

See [Using this Repository as a Template](doc/this-repo-as-template.md).
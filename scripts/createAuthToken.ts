import { config } from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Script to generate an auth token and write it to the .env file
 *
 * Usage:
 *   node -r ts-node/register createAuthToken.ts
 */

const AUTH_TOKEN_COOKIE_NAME = 'Auth';
const AUTH_TOKEN_ENV = 'AUTH_TOKEN';

const projectRootDirectory = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRootDirectory, '.env');

// Load environment variables from .env file
config({ path: envPath });

/**
 * Write the auth token to the .env file
 *
 * @param authToken
 */
const writeToEnvFile = (authToken: string) => {
  // Read the existing .env file
  let envContent = fs.readFileSync(envPath, 'utf-8');

  const tokenLineIndex = envContent.split('\n').findIndex((line) => line.startsWith(`${AUTH_TOKEN_ENV}=`));
  const tokenLineContent = `${AUTH_TOKEN_ENV}="${authToken}"`;

  if (tokenLineIndex !== -1) {
    // If "AUTH_TOKEN" exists, replace the existing value
    const lines = envContent.split('\n');
    lines[tokenLineIndex] = tokenLineContent;
    envContent = lines.join('\n');
  } else {
    // If "AUTH_TOKEN" doesn't exist, append a new line
    envContent += `\n${tokenLineContent}\n`;
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, envContent);
};

/**
 * Main function
 */
const run = async () => {
  const requiredEnvVars = ['AUTH_TOKEN_DOMAIN', 'AUTH_TOKEN_EMAIL', 'AUTH_TOKEN_PWD'];
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  } else {
    let authToken;

    // Authenticate with configured domain to get the auth token
    const response = await axios.post(`${process.env.AUTH_TOKEN_DOMAIN}/api/account/login`, {
      email: process.env.AUTH_TOKEN_EMAIL,
      password: process.env.AUTH_TOKEN_PWD,
    });

    const cookieHeader = response.headers['set-cookie'];
    if (!!cookieHeader?.length) {
      // Find the cookie with the auth token
      const authCookie = cookieHeader.find((cookie) => cookie.includes(`${AUTH_TOKEN_COOKIE_NAME}=`));
      // Get the auth cookie value
      authToken = authCookie
        ?.split(';')
        .find((cookie) => cookie.includes(`${AUTH_TOKEN_COOKIE_NAME}=`))
        ?.split('=')[1];
    }
    if (!!authToken) {
      try {
        console.log('Received auth token:', authToken);
        console.log('Updating .env file...');
        writeToEnvFile(authToken);
      } catch (err) {
        console.error('Failed to update .env file:', err);
      }
    } else {
      throw new Error('Failed to retrieve auth token');
    }
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

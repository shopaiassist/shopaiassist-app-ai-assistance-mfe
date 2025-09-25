import packgeData from './package.json';

export default {
  mfeName: packgeData.name,
  mfeVersion: packgeData.version,
  appDomain: process.env.APP_DOMAIN,
};

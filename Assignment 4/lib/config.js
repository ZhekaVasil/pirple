/**
 * Config module
 */

// Main container
const environments = {};


environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'thisIsASecret',
  stripeHost: 'api.stripe.com',
  stripeMethod: 'POST',
  stripePath: '/v1/charges',
  stripeToken: 'sk_test_mAjn6GeUUCPlDPZKPEa16NCV',
  stripeSource: 'tok_visa',
  stripeCurrency: 'usd',
  mailGunHost: 'api.mailgun.net',
  mailGunPath: '/v3/sandbox5feece572f574bb691a1b70cbd259320.mailgun.org/messages',
  mailGunName: 'api',
  mailGunPassword: 'ec8c25dab4b473d172c31e31efd7cf86-4412457b-7fd23c96',
  mailGunFrom: 'Mailgun Sandbox <postmaster@sandbox5feece572f574bb691a1b70cbd259320.mailgun.org>',
  mailGunMethod: 'POST',
  templateGlobals: {
    appName: 'Easy Pizza'
  }
};

const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const environmentToExport = typeof environments[currentEnvironment] === 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
/**
 * Stripe API module
 */

const https = require('https');
const querystring = require('querystring');
const config = require('./config');
const StringDecoder = require('string_decoder').StringDecoder;

// Main container
const stripe = {};

// Send payment request
stripe.pay = ({amount, description, source}, callback) => {
  if (amount && description) {
    const payload = {
      amount,
      description,
      source,
      currency: config.stripeCurrency
    };
    const stringPayload = querystring.stringify(payload);
    const requestDetails = {
      protocol: 'https:',
      hostname: config.stripeHost,
      method: config.stripeMethod,
      path: config.stripePath,
      auth: config.stripeToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    
    const req = https.request(requestDetails, (res) => {
      res.on('data', data => {
        buffer += decoder.write(data);
      });
  
      res.on('end', () => {
        buffer += decoder.end();
        const status = res.statusCode;
        if (status === 200 || status === 201) {
          callback(false, JSON.parse(buffer))
        } else {
          callback(JSON.parse(buffer));
        }
      });
    });
    
    req.on('error', (error) => {
      callback(error)
    });
    
    req.write(stringPayload);
    
    req.end();
  } else {
    callback('Given params are invalid')
  }
};

module.exports = stripe;
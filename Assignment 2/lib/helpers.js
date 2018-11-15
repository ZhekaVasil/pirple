/**
 * Module with helpers
 */

const crypto = require('crypto');
const config = require('./config');

// Main container
const helpers = {};

// Hash a file
helpers.hash = (str) => {
  return typeof str === 'string' && str.length ? crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex') : false;
};

// Parse string to JSON object
helpers.parseJsonToObject = (str) => {
  let obj = {};
  try {
    obj = JSON.parse(str)
  } catch (error) {
    // console.log(error);
  }
  return obj;
};

// Create random string
helpers.createRandomString = (strLength) => {
  strLength = typeof strLength === 'number' && strLength ? strLength : false;
  if (strLength) {
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < strLength; i++) {
      str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    }
    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
/**
 * Module with helpers
 */

const crypto = require('crypto');
const config = require('./config');
const path = require('path');
const fs = require('fs');

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

// Get template for sending
helpers.getTemplate = (name, data, callback) => {
  name = typeof name === 'string' && name.length ? name : '';
  data = typeof data === 'object' && data !== null ? data : {};
  
  if (name) {
    let templateDir = path.join(__dirname, '/../templates/');
    console.log(templateDir+name+'.html');
    fs.readFile(templateDir+name+'.html', 'utf8', (err, str) => {
      if (!err && str && str.length) {
        let finalString = helpers.interpolate(str, data);
        callback(null, finalString);
      } else {
        callback('No template found')
      }
    })
  } else {
    callback('A valid template was not specified')
  }
};

// Interpolate a string
helpers.interpolate = (str, data) => {
  str = typeof str === 'string' && str.length ? str : '';
  data = typeof data === 'object' && data !== null ? data : {};
  
  // Add global values
  Object.keys(config.templateGlobals).forEach(keyName => {
    data[`global.${keyName}`] = config.templateGlobals[keyName]
  });
  
  // Replace values
  Object.keys(data).forEach(key => {
    if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
      let replace = data[key];
      let find = `{${key}}`;
      
      str = str.replace(find, replace)
    }
  });
  
  return str;
};

// Get common template with header, body, footer
helpers.getCommonTemplate = (name, data, callback) => {
  name = typeof name === 'string' && name.length ? name : '';
  data = typeof data === 'object' && data !== null ? data : {};
  
  helpers.getTemplate('baseTemplate', data, (err, baseStr) => {
    if (!err && baseStr) {
      helpers.getTemplate(name, data, (err, bodyStr) => {
        if (!err && bodyStr) {
          helpers.getTemplate('_header', data, (err, headerStr) => {
            if (!err && headerStr) {
              helpers.getTemplate('_footer', data, (err, footerStr) => {
                if (!err && footerStr) {
                  let fullStr = baseStr
                  .replace('{{header}}', headerStr)
                  .replace('{{body}}', bodyStr)
                  .replace('{{footer}}', footerStr);
                  callback(false, fullStr);
                } else {
                  callback('Can not find footer template')
                }
              })
            } else {
              callback('Can not find header template')
            }
          })
        } else {
          callback('Can not find body template')
        }
      });
    } else {
      callback('Can not find base template')
    }
  });
};

// Get static assets
helpers.getStaticAssets = (fileName, callback) => {
  fileName = typeof fileName === 'string' && fileName.length ? fileName : '';
  if (fileName) {
    let publicDir = path.join(__dirname, '/../public/');
    fs.readFile(publicDir + fileName, (err, data) => {
      if (!err && data) {
        callback(false, data)
      } else {
        callback('No file')
      }
    })
  } else {
    callback('Invalid file name');
  }
};

// Return current date
helpers.getCurrentDate = () => {
  const date = new Date();
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
};

// Return previous date
helpers.getPreviousDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
};

module.exports = helpers;
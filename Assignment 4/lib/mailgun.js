/**
 * MailGun API module
 */

const https = require('https');
const querystring = require('querystring');
const config = require('./config');
const StringDecoder = require('string_decoder').StringDecoder;

// Main container
const mailgun = {};

// Send an email
mailgun.send = ({email, cart, price}) => {
  if (email && cart && price) {
    let text = 'Your order is:\n';
    cart.forEach(item => {
      text += `${item.type} ${item.name}: ${item.price}$\n`
    });
    text += `Total price: ${price/100}$`;
    const payload = {
      from: config.mailGunFrom,
      to: email,
      subject: 'Thanks for your order!',
      text
    };
    const stringPayload = querystring.stringify(payload);
    const requestDetails = {
      protocol: 'https:',
      hostname: config.mailGunHost,
      method: config.mailGunMethod,
      path: config.mailGunPath,
      auth: `${config.mailGunName}:${config.mailGunPassword}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    
    const req = https.request(requestDetails, (res) => {
      res.on('data', (data) => {
        buffer += decoder.write(data);
      });
  
      res.on('end', () => {
    
        buffer += decoder.end();
        const status = res.statusCode;
        if (status === 200 || status === 201) {
          console.log(`Email was send to ${email}`);
        } else {
          console.log(buffer);
          console.log(`Can not send the email to ${email}`);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`Can not send the email to ${email}`);
    });
    
    req.write(stringPayload);
    
    req.end();
  } else {
    console.log('Given params are invalid')
  }
};

module.exports = mailgun;
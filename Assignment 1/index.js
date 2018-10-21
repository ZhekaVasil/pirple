const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(`The http server is listening on port ${config.httpPort}`);
});

const unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
  const decoder = new StringDecoder('utf-8');
  
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    
    const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
    const data = {
      payload: buffer
    };
    
    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode === 'number' ? statusCode : 200;
      payload = typeof payload === 'object' ? payload : {};
      
      const payloadString = JSON.stringify(payload);
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

const handlers = {};

handlers.hello = (data, callback) => {
  const message = {
    message: data.payload ? `Your message was ${data.payload}` : 'There is no message'
  };
  callback(200, message)
};

handlers.notFound = (data, callback) => {
  callback(404)
};
const router = {
  'hello': handlers.hello
};

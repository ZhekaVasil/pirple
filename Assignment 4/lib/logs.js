/*
 * Library for storing and rotating logs
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const helpers = require('./helpers');

// Container for module (to be exported)
const lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.logs/');

// Append a string to a file. Create the file if it does not exist
lib.append = (file,str,callback) => {
  // Open the file for appending
  fs.open(lib.baseDir+file+'.log', 'a', (err, fileDescriptor) => {
    if(!err && fileDescriptor){
      // Append to file and close it
      fs.appendFile(fileDescriptor, str+'\n', (err) => {
        if(!err){
          fs.close(fileDescriptor, (err) => {
            if(!err){
              callback(false);
            } else {
              callback('Error closing file that was being appended');
            }
          });
        } else {
          callback('Error appending to file');
        }
      });
    } else {
      callback('Could open file for appending');
    }
  });
};

// List all the logs, and optionally include the compressed logs
lib.list = (type, includeCompressedLogs,callback) => {
  fs.readdir(`${lib.baseDir}${type}`, (err,data) => {
    if(!err && data && data.length > 0){
      const trimmedFileNames = [];
      data.forEach((fileName) => {
        fileName = `${type}/${fileName}`;
        // Add the .log files
        if(fileName.indexOf('.log') > -1){
          trimmedFileNames.push(fileName.replace('.log',''));
        }

        // Add the .gz files
        if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
          trimmedFileNames.push(fileName.replace('.gz.b64',''));
        }

      });
      callback(false,trimmedFileNames);
    } else {
      callback(err,data);
    }
  });
};

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = (logId,newFileId,callback) => {
  const sourceFile = logId+'.log';
  const destFile = newFileId+'.gz.b64';

  // Read the source file
  fs.readFile(lib.baseDir+sourceFile, 'utf8', (err,inputString) => {
    if(!err && inputString){
      // Compress the data using gzip
      zlib.gzip(inputString,function(err,buffer){
        if(!err && buffer){
          // Send the data to the destination file
          fs.open(lib.baseDir+destFile, 'wx', (err, fileDescriptor) => {
            if(!err && fileDescriptor){
              // Write to the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                if(!err){
                  // Close the destination file
                  fs.close(fileDescriptor, (err) => {
                    if(!err){
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });

    } else {
      callback(err);
    }
  });
};

// Decompress the contents of a .gz file into a string variable
lib.decompress = (fileId,callback) => {
  let fileName = fileId+'.gz.b64';
  fs.readFile(lib.baseDir+fileName, 'utf8', (err,str) => {
    if(!err && str){
      // Inflate the data
      let inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if(!err && outputBuffer){
          // Callback
          let str = outputBuffer.toString();
          callback(false,str);
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

// Truncate a log file
lib.truncate = (logId,callback) => {
  fs.truncate(lib.baseDir+logId+'.log', 0, (err) => {
    if(!err){
      callback(false);
    } else {
      callback(err);
    }
  });
};

// Get recent order logs
lib.getRecentOrders = (callback) => {
  const currentDate = +new Date();
  let result = [];
  let index = 0;
  
  fs.readdir(`${lib.baseDir}orders`, (err, data) => {
    if (!err && data && data.length) {
      // Take logs only with current date and previous date
      const filteredData = data.filter(fileName => fileName.includes(helpers.getCurrentDate()) || fileName.includes(helpers.getPreviousDate(1)));
     
      filteredData.forEach(fileName => {
        fs.readFile(`${lib.baseDir}orders/${fileName}`, 'utf8', (err, fileData) => {
          ++index;
          if (!err && fileData) {
            result.push(helpers.parseJsonToObject(fileData));
          }
          if (index === filteredData.length) {
            // Return only fresh orders (orders placed in the last 24 hours)
            callback(false, result.filter(item => item.date + 24 * 60 * 60 * 1000 >= currentDate));
          }
        })
      })
    } else {
      callback(true)
    }
  })
};

// Get specific order by id
lib.getOrderData = (id, callback) => {
  let orderFileName = '';
  fs.readdir(`${lib.baseDir}orders`, (err, data) => {
    if (!err && data && data.length) {
      data.some(fileName => {
        if (fileName.includes(id)) {
          orderFileName = fileName;
          return true;
        }
      });
      
      if (orderFileName) {
        fs.readFile(`${lib.baseDir}orders/${orderFileName}`, 'utf8', (err, fileData) => {
          if (!err && fileData) {
            callback(false, helpers.parseJsonToObject(fileData))
          } else {
            callback(err)
          }
        })
      } else {
        callback(true)
      }
    } else {
      callback(true)
    }
  })
};

// Get recent Signups
lib.getRecentSignUps = (callback) => {
  const currentDate = +new Date();
  let result = [];
  let index = 0;
  
  [helpers.getCurrentDate(), helpers.getPreviousDate(1)].forEach((date, i, arr) => {
    fs.readFile(`${lib.baseDir}signup/${date}.log`, (err, data) => {
      ++index;
      if (!err && data) {
        data.toString().split('\n').forEach(item => {
          item = helpers.parseJsonToObject(item);
          if (item.date + 24 * 60 * 60 * 1000 >= currentDate) {
            result.push(item);
          }
        })
      }
      if (index === arr.length) {
        // Return only fresh orders (orders placed in the last 24 hours)
        callback(false, result);
      }
    })
  });
};

// Get log data based on path
lib.getLogData = (path, callback) => {
  const result = [];
  fs.readFile(`${lib.baseDir}${path}.log`, 'utf8', (err, fileData) => {
    fileData.toString().split('\n').forEach(data => {
      if (data) {
        result.push(helpers.parseJsonToObject(data));
      }
    });
    if (!err && fileData) {
      callback(false, result)
    } else {
      callback(err)
    }
  })
};

// Export the module
module.exports = lib;

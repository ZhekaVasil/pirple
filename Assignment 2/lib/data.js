/**
 * Module to manipulate with file system
 */

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Main container
const lib = {};

// Root dir for data
lib.baseDir = path.join(__dirname, '/../.data/');

// Create new file
lib.create = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          })
        } else {
          callback('Error writing to new file');
        }
      })
    } else {
      callback('Could not create new file, it may already exist');
    }
  })
};

// Read a file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if (!err && data) {
      callback(false, helpers.parseJsonToObject(data))
    } else {
      callback(err, data);
    }
  })
  
};

//Update a file
lib.update = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data);
      fs.truncate(fileDescriptor, (err) => {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing new file');
                }
              })
            } else {
              callback('Error writing to new file');
            }
          })
        } else {
          callback('Error truncating file')
        }
      });
    } else {
      callback('Could not open the file for update, it may exist yet');
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  })
};

// Get list of files in a folder
lib.list = (dir, callback) => {
  fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
    if (!err && data && data.length) {
      const trimmedFilesName = [];
      data.forEach(fileName => {
        trimmedFilesName.push(fileName.replace('.json', ''))
      });
      callback(false, trimmedFilesName);
    } else {
      callback(err, data)
    }
  })
};


module.exports = lib;
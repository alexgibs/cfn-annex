'use strict';

const crypto = require('crypto');
const aws = require('aws-sdk');
const cfnresponse = require('./cfn-response.js');

function findKey(keyName, obj) {
  let value;
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      value = findKey(keyName, obj[i]);
      if (value) break;
    }
  } else {
    for (const key in obj) {
      if (key === keyName) return obj[key];
      if (obj[key] instanceof Object || obj[key] instanceof Array) {
        value = findKey(keyName, obj[key]);
        if (value) break;
      }
    }
  }
  return value;
}

function regexEscape(str) {
  return `[${str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]`;
}

function regexObject(data) {
  return new RegExp(regexEscape(data), 'g');
}

exports.handler = (event, context) => {
  const input = event.ResourceProperties.input;
  const debug = !!(event.ResourceProperties.debug);

  if (debug) console.log('Request Object: ', event);

  function signalCFN(err, data) {
    const physicalResourceId = event.PhysicalResourceId || `${event.ResourceProperties.fn}-${String(process.hrtime()[1])}`;
    if (err) {
      if (debug) console.log(err);
      cfnresponse.send(event, context, cfnresponse.FAILED, { error: err }, physicalResourceId, debug);
    } else {
      if (debug) console.log(data);
      // Set PhysicalResourceId to the name of function-timestamp, CW logstream is not unique for multiple custom resources.
      cfnresponse.send(event, context, cfnresponse.SUCCESS, { response: data }, physicalResourceId, debug);
    }
  }

  if (event.RequestType === 'Delete') {
    signalCFN(null, 'Delete request succesful.');
    return;
  }

  function lowerCase(str) {
    return new Promise((resolve, reject) => {
      if (typeof str !== 'string') {
        reject('Input data is not a string.');
      }
      resolve(str.toLowerCase());
    });
  }

  function upperCase(str) {
    return new Promise((resolve, reject) => {
      if (typeof str !== 'string') {
        reject('Input data is not a string.');
      }
      resolve(str.toUpperCase());
    });
  }

  /*
  * returns pseudo-random characters [a-z0-9] of 'length' long.
  */
  function randomChars(length) {
    return new Promise((resolve) => {
      const len = Number(length);
      resolve(crypto.randomBytes(len).toString('hex').substring(len));
    });
  }

  function splitStr(str, delimiter) {
    return new Promise((resolve, reject) => {
      if (typeof str !== 'string' || typeof delimiter !== 'string') {
        reject('Input data is not a string');
      }

      resolve(str.split(delimiter));
    });
  }

  /*
  * 'remove' can be a string or array of chars to remove from 'str'.
  */
  function removeChars(str, remove) {
    return new Promise((resolve, reject) => {
      if (typeof str !== 'string') {
        reject('Input data is not a string');
      }

      let rem = remove;
      if (rem == null || rem === undefined) { rem = ' '; }

      if (typeof rem === 'string') {
        const regex = regexObject(rem);
        resolve(str.replace(regex, ''));
      }

      if (Array.isArray(rem)) {
        const regex = regexObject(rem.join(''));
        resolve(str.replace(regex, ''));
      }
    });
  }

  /*
  * sleep will return a promise that gets resolved after 'duration' time.
  * errors if 'duration' is greater than the max Lambda allowed exec time.
  * errors if 'duration' is greater than the Lambda function configured exec time.
  */
  function sleep(duration) {
    if (debug) console.log(duration);
    return new Promise((resolve, reject) => {
      if (duration >= 300000) {
        reject('The specified pause duration exceeds the maximum allowed Lambda Function execution time.');
      }

      if (duration >= context.getRemainingTimeInMillis()) {
        reject('The specified pause duration exceeds the Lambda Function execution time set.');
      }

      setTimeout(() => {
        resolve(`Slept for ${duration}ms`);
      }, duration);
    });
  }

  // testing
  function describeAPICall(describeCall, params, responseKey) {
    return new Promise((resolve, reject) => {
      // TODO: test if params are undefined here

      const apiCall = describeCall.split('.');

      if (typeof aws[apiCall[0]] !== 'function') reject(`The service '${apiCall[0]}' is not valid. Please check http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/.`);
      const service = new aws[apiCall[0]]();

      if (typeof service[apiCall[1]] !== 'function') reject(`The API Call '${apiCall[1]}' is not valid. Please check http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/.`);
      service[apiCall[1]](params, (err, data) => {
        if (err) reject(err);
        const returnVal = responseKey.split('.');
        let response = data;
        let value;
        try {
          // try to access the returnVal key from the data obj, e.g. data[StackResourceDetail][LastUpdatedTimestamp]
          // if not found, should traverse the data object for the key
          returnVal.forEach((key) => {
            response = response[key];
          });
          if (response === undefined) {
            throw new Error('undefined');
          } else {
            value = response;
          }
        } catch (e) {
          // attempt to traverse data object and returnVal find key
          if (returnVal.length === 1) {
            value = findKey(returnVal[0], data);
          } else {
            reject(`Unable to find key ${responseKey} from the ${describeCall} call.`);
          }
        }
        resolve(value);
      });
    });
  }

  const actions = {
    lowercase: ()               =>    lowerCase(input.string),
    uppercase: ()               =>    upperCase(input.string),
    split: ()                   =>    splitStr(input.string, input.delimiter),
    remove: ()                  =>    removeChars(input.string, input.remove),
    random: ()                  =>    randomChars(input.length),
    pause: ()                   =>    sleep(input.duration),
    describe: ()                =>    describeAPICall(input.describe, input.params, input.responseKey),
  };

  let response = {};
  if (Object.prototype.hasOwnProperty.call(actions, event.ResourceProperties.fn)) {
    // response should return a Promise, even if it is a synchronous operation.
    response = actions[event.ResourceProperties.fn]();
    response.then((res) => {
      signalCFN(null, res);
    }).catch((err) => {
      signalCFN(`Error occurred: ${err}`);
    });
  } else {
    signalCFN('Function does not exist.');
  }
};

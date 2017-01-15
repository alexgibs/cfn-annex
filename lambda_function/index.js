'use strict';

const crypto = require('crypto');
const aws = require('aws-sdk');
const cfnresponse = require('./cfn-response.js');

function helperFunctions() {
  return {
    regexEscape(str) {
      return `[${str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}]`;
    },
    regexReplace(str) {
      return RegExp(this.regexEscape(str), 'g');
    },
    isObject(val) {
      return typeof val === 'object';
    },
    isUndefined(val) {
      return typeof val === 'undefined';
    },
    isNull(val) {
      return !val && this.isObject(val);
    },
    isString(val) {
      return typeof val === 'string';
    },
    isNumber(val) {
      return typeof val === 'number';
    },
    isFunction(val) {
      return typeof val === 'function';
    },
    isArray(val) {
      return Array.isArray(val);
    },
    findValueByKey(keyName, obj) {
      let val;
      if (this.isArray(obj)) {
        for (let i = 0; i < obj.length; i += 1) {
          val = this.findValueByKey(keyName, obj[i]);
          if (val) break;
        }
      } else {
        // eslint-disable-next-line no-restricted-syntax
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (key === keyName) return obj[key];
            if (this.isArray(obj[key]) || this.isObject(obj[key])) {
              val = this.findValueByKey(keyName, obj[key]);
              if (val) break;
            }
          }
        }
      }
      return val;
    },
  };
}
// for brevity
const _ = helperFunctions();

exports.handler = (event, context) => {
  aws.config.setPromisesDependency(null);
  console.log(aws.config.getPromisesDependency());
  const input = event.ResourceProperties.input;
  const debug = !!(event.ResourceProperties.debug);

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
    return Promise.resolve().then(() => {
      if (!_.isString(str)) throw new Error(`Input data: '${str}' is not a string.`);
      return str.toLowerCase();
    });
  }

  function upperCase(str) {
    return Promise.resolve().then(() => {
      if (!_.isString(str)) throw new Error(`Input data: '${str}' is not a string.`);
      return str.toUpperCase();
    });
  }

  /*
  * returns pseudo-random characters [a-z0-9] of 'length' long.
  */
  function randomChars(length) {
    return Promise.resolve().then(() => {
      if (!_.isNumber(length)) throw new Error(`Input data: '${length}' is not a number.`);
      const len = Number(length);
      return crypto.randomBytes(len).toString('hex').substring(len);
    });
  }

  function splitStr(str, delimiter) {
    return Promise.resolve().then(() => {
      if (!_.isString(str) || !_.isString(delimiter)) throw new Error('Input data is not a string');
      return str.split(delimiter);
    });
  }

  /*
  * 'remove' can be a string or array of chars to remove from 'str'.
  */
  function removeChars(str, remove) {
    return Promise.resolve().then(() => {
      if (!_.isString(str)) throw new Error(`Input data ${str} is not a string`);

      let valueToRemove = remove;
      if (_.isNull(valueToRemove) || _.isUndefined(valueToRemove)) {
        valueToRemove = ' ';
      }
      if (_.isString(valueToRemove)) {
        const regex = _.regexReplace(valueToRemove);
        return str.replace(regex, '');
      }
      if (_.isArray(valueToRemove)) {
        const regex = _.regexReplace(valueToRemove.join(''));
        return str.replace(regex, '');
      }
      return str;
    });
  }

  /*
  * sleep will return a promise that gets resolved after 'duration' time.
  * errors if 'duration' is greater than the max Lambda allowed exec time.
  * errors if 'duration' is greater than the Lambda function configured exec time.
  */
  function sleep(duration) {
    if (debug) console.log(`Sleep for: ${duration}ms`);
    return new Promise((resolve) => {
      if (duration >= 300000) {
        throw new Error('The specified pause duration exceeds the maximum allowed Lambda Function execution time.');
      }

      if (duration >= context.getRemainingTimeInMillis()) {
        throw new Error('The specified pause duration exceeds the Lambda Function execution time set.');
      }
      setTimeout(() => {
        resolve(`Slept for ${duration}ms`);
      }, duration);
    });
  }

  function describeAPICall(describeCall, params, responseKey) {
    // return new Promise((resolve) => {
    if (!_.isString(describeCall) || !_.isString(responseKey)) return Promise.reject('describeCall or responseKey is not a string.');
    if (!_.isObject(params)) return Promise.reject('Parameters should be an object');
    const apiCall = describeCall.split('.');

    if (!_.isFunction(aws[apiCall[0]])) return Promise.reject(`The service '${apiCall[0]}' is not valid. Please check http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/.`);
    const service = new aws[apiCall[0]]();

    if (!_.isFunction(service[apiCall[1]])) return Promise.reject(`The API Call '${apiCall[1]}' is not valid. Please check http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/.`);
    const reqpromise = service[apiCall[1]](params).promise();
    return reqpromise.then((data) => {
      // if (err) console.log(err);
      const returnVal = responseKey.split('.');
      let response = data;
      let value;
      try {
        // try to access the returnVal key from the data obj, e.g. data[StackResourceDetail][LastUpdatedTimestamp]
        // if not found, should traverse the data object for the key
        returnVal.forEach((key) => {
          response = response[key];
        });
        if (_.isNull(response) || _.isUndefined(response)) throw new Error('response is empty');
        value = response;
      } catch (e) {
        // attempt to traverse data object and returnVal find key
        if (returnVal.length === 1) {
          value = _.findValueByKey(returnVal[0], data);
        } else {
          return Promise.reject((`Unable to find key ${responseKey} from the ${describeCall} call.`));
        }
      }
      return Promise.resolve(value);
    });
    // });
  }

  const actions = {
    lowercase: () => lowerCase(input.string),
    uppercase: () => upperCase(input.string),
    split: () => splitStr(input.string, input.delimiter),
    remove: () => removeChars(input.string, input.remove),
    random: () => randomChars(input.length),
    pause: () => sleep(input.duration),
    describe: () => describeAPICall(input.describe, input.params, input.responseKey),
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

const nock = require('nock');
const index = require('../lambda_function/index.js');

const enableDebug = true;
const AWSRegion = 'us-west-2';

const lambdaMaxTimeout = 300000;
const lambdaExecTimeout = 20000;
const logStreamName = 'logstream';
const ResponseURL = 'https://pre-signed-S3-url-for-response';
const StackId = `arn:aws:cloudformation:${AWSRegion}:EXAMPLE/stack-name/guid`;
const LogicalResourceId = 'TestResource';
const RequestId = 'a7a09189-a5b6-426c-8fc5-ae0ee868b8b1';
const ResourceType = 'Custom::TestResource';
const PhysicalResourceId = `logStreamName-${String(process.hrtime()[1])}`;
const requestTypeCreate = 'Create';
const requestTypeDelete = 'Delete';
const responseStatusSUCCESS = 'SUCCESS';
const responseStatusFAILED = 'FAILED';


// Mock the Lambda invocation for testing
function lambdaTest(event) {
  return new Promise((resolve, reject) => {
    const execTime = lambdaExecTimeout || lambdaMaxTimeout;
    const timeNow = new Date().getTime();
    const maxTime = timeNow + execTime;

    process.env.AWS_REGION = AWSRegion;

    const handler = 'handler';
    const context = {
      done: (err, data) => {
        if (err) reject(err);
        resolve(data);
      },
      succeed: (data) => {
        resolve(data);
      },
      fail: (err) => {
        reject(err);
      },
      getRemainingTimeInMillis: () => (maxTime - (new Date().getTime())),
      logStreamName,
    };

    const callback = (err, data) => {
      if (err) reject(err);
      resolve(data);
    };

    index[handler](event, context, callback);
  });
}

function mockCustomResource(requestParams, responseParams) {
  const event = {
    StackId,
    ResponseURL,
    ResourceProperties: requestParams.resourceProperties || {},
    RequestType: requestParams.requestType || 'Create',
    ResourceType,
    RequestId,
    LogicalResourceId,
    PhysicalResourceId,
  };

  nock(ResponseURL)
    // ensure content-type header is empty
    .matchHeader('content-type', '')
    .put('/', {
      Status: responseParams.responseStatus,
      StackId,
      RequestId,
      LogicalResourceId,
      PhysicalResourceId,
      Data: responseParams.responseData,
    })
    .reply(200)
    .log((d) => { if (enableDebug) console.log(d); });

  return lambdaTest(event);
}

module.exports = {
  mockCustomResource,
  requestTypeCreate,
  requestTypeDelete,
  responseStatusSUCCESS,
  responseStatusFAILED,
  AWSRegion,
  lambdaMaxTimeout,
  lambdaExecTimeout,
  enableDebug,
};

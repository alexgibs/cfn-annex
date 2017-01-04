/*
* This is a modified version of cfn-response.
* http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-lambda-function-code.html#cfn-lambda-function-code-cfnresponsemodule
*/

/*
   Copyright 2015 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
   This file is licensed to you under the AWS Customer Agreement (the "License").
   You may not use this file except in compliance with the License.
   A copy of the License is located at http://aws.amazon.com/agreement/.
   This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied.
   See the License for the specific language governing permissions and limitations under the License. */

const https = require('https');
const url = require('url');

exports.SUCCESS = 'SUCCESS';
exports.FAILED = 'FAILED';

exports.send = (event, context, responseStatus, responseData, physicalResourceId, debug) => {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
    StackId: event.StackId,
    RequestId: event.RequestId,
    PhysicalResourceId: physicalResourceId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length,
    },
  };

  if (debug) console.log('Response body:\n', responseBody);

  const request = https.request(options, (response) => {
    if (debug) console.log(`Status code: ${response.statusCode}`);
    if (debug) console.log(`Status message: ${response.statusMessage}`);
    context.done();
  });

  request.on('error', (error) => {
    if (debug) console.log(`send(..) failed executing https.request(..):  ${error}`);
    context.done();
  });

  request.write(responseBody);
  request.end();
};

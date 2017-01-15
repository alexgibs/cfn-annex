const assert = require('assert');
const nock = require('nock');
const helpers = require('./helpers.js');

const enableDebug = helpers.enableDebug;
const lambdaMaxTimeout = helpers.lambdaMaxTimeout;
const lambdaExecTimeout = helpers.lambdaExecTimeout;
const AWSRegion = helpers.AWSRegion;

describe('== Test \'Create\' request event ==', () => {
  describe('*** Testing: PUT response correctly formed', () => {
    it('Should have \'content-type\' set to empty, the LogicalResourceId and PhysicalResourceId specified.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'lowercase',
          input: {
            string: 'TESTING',
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: /\w/ },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: No \'fn\' specified', () => {
    it('Should return an error and signal failure.', (done) => {
      const requestParams = {
        resourceProperties: {
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusFAILED,
        responseData: { error: 'Function does not exist.' },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });
});

describe('== Test \'Delete\' request event ==', () => {
  describe('*** Testing: PUT response correctly formed', () => {
    it('Should return Status: SUCCESS, StackId, RequestId, LogicalResourceId and PhysicalResourceId.', (done) => {
      const requestParams = {
        resourceProperties: {
          debug: enableDebug,
        },
        requestType: helpers.requestTypeDelete,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: 'Delete request succesful.' },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });
});

describe('== Testing individual functions ==', () => {
  describe('*** Testing: lowercase function.', () => {
    it('Should return a lowercase string \'testing\'.', (done) => {
      const inputString = 'TESTING';
      const requestParams = {
        resourceProperties: {
          fn: 'lowercase',
          input: {
            string: inputString,
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: inputString.toLowerCase() },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: uppercase function', () => {
    it('Should return an uppercase string \'TESTING\'.', (done) => {
      const inputString = 'testing';
      const requestParams = {
        resourceProperties: {
          fn: 'uppercase',
          input: {
            string: inputString,
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: inputString.toUpperCase() },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: split function', () => {
    it('Should split a string on delimiter: \'-\' and return an array.', (done) => {
      const inputString = 'dffaEFWFWE-FEWW-EfEWaddfWQD';
      const delimiter = '-';
      const requestParams = {
        resourceProperties: {
          fn: 'split',
          input: {
            string: inputString,
            delimiter,
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: inputString.split(delimiter) },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: removeChars function', () => {
    const inputString = 'dffaEFWFWE-FEWW-EfEWaddfWQD';

    it('Should remove all: \'-\' chars and return a string.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'remove',
          input: {
            string: inputString,
            remove: '-',
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: 'dffaEFWFWEFEWWEfEWaddfWQD' },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });

    it('Should remove all: \'-, a, F\' characters and return a string.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'remove',
          input: {
            string: inputString,
            remove: ['-', 'a', 'F'],
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: 'dffEWWEEWWEfEWddfWQD' },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: randomChars function', () => {
    it('Should generate 10 pseudo-random characters.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'random',
          input: {
            length: 10,
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        // regex to test any word character only of length 10
        responseData: { response: /^\w{10}$/ },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: pause function', () => {
    it('Should pause for 3 seconds.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'pause',
          input: {
            duration: '3000',
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: 'Slept for 3000ms' },
      };

      const start = process.hrtime();
      helpers.mockCustomResource(requestParams, responseParms)
      .then(() => {
        assert(nock.isDone());
        // console.log(nock.isDone());
        const finished = process.hrtime(start)[1] / 1000;
        // console.log(finished);
        assert.ok(finished > 3000);
        done();
      }).catch((d) => { console.log(d); });
    }).timeout(5000); // increase timeout for this test

    it('Should reject with an error due to the specified pause duration being gerater than the maximum allowed by Lambda.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'pause',
          input: {
            duration: lambdaMaxTimeout + 1,
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusFAILED,
        responseData: { error: 'Error occurred: Error: The specified pause duration exceeds the maximum allowed Lambda Function execution time.' },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });

    it('Should reject with an error due to the specified duration being greater than timeout set for the Lambda function.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'pause',
          input: {
            duration: lambdaExecTimeout + 1000,
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusFAILED,
        responseData: { error: 'Error occurred: Error: The specified pause duration exceeds the Lambda Function execution time set.' },
      };

      helpers.mockCustomResource(requestParams, responseParms).then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });

  describe('*** Testing: Describe function', () => {
    const StackName = 'testStackName';
    const LogicalResourceId = 'TestResource';

    it('Should return the LastUpdatedTimestamp (single key name specified) from the CloudFormation describeStackResource API call.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'describe',
          input: {
            describe: 'CloudFormation.describeStackResource',
            params: {
              StackName,
              LogicalResourceId,
            },
            responseKey: 'LastUpdatedTimestamp',
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: '2017-01-03T01:46:29.035Z' },
      };

      // create additional nock for CloudForamtion API Call.
      nock(`https://cloudformation.${AWSRegion}.amazonaws.com:443`, { encodedQueryParams: true })
        .post('/', `Action=DescribeStackResource&LogicalResourceId=${LogicalResourceId}&StackName=${StackName}&Version=2010-05-15`)
        .reply(200, `<DescribeStackResourceResponse xmlns='http://cloudformation.amazonaws.com/doc/2010-05-15/'>
                      <DescribeStackResourceResult>
                        <StackResourceDetail>
                          <LastUpdatedTimestamp>2017-01-03T01:46:29.035Z</LastUpdatedTimestamp>
                          <Metadata>{}</Metadata>
                          <PhysicalResourceId>${StackName}-${LogicalResourceId}-E123456789W</PhysicalResourceId>
                          <ResourceStatus>UPDATE_COMPLETE</ResourceStatus>
                          <StackId>arn:aws:cloudformation:${AWSRegion}:12345678910:stack/${StackName}/c8604420-cd62-11e6-8e10-12345678910</StackId>
                          <StackName>${StackName}</StackName>
                          <LogicalResourceId>${LogicalResourceId}</LogicalResourceId>
                          <ResourceType>AWS::Lambda::Function</ResourceType>
                        </StackResourceDetail>
                      </DescribeStackResourceResult>
                      <ResponseMetadata>
                      </ResponseMetadata>
                    </DescribeStackResourceResponse>`)
        .log((d) => { if (enableDebug) console.log(d); });

      helpers.mockCustomResource(requestParams, responseParms)
      .then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });

    it('Should return the SnapshotId (full path specified) from the EC2 describeImages API call.', (done) => {
      const requestParams = {
        resourceProperties: {
          fn: 'describe',
          input: {
            describe: 'EC2.describeImages',
            params: {
              ImageIds: ['ami-1e299d7e'],
            },
            responseKey: 'Images.0.BlockDeviceMappings.0.Ebs.SnapshotId',
          },
          debug: enableDebug,
        },
        requestType: helpers.requestTypeCreate,
      };
      const responseParms = {
        responseStatus: helpers.responseStatusSUCCESS,
        responseData: { response: 'snap-0bf6845989e028a9a' },
      };

      nock(`https://ec2.${AWSRegion}.amazonaws.com:443`, { encodedQueryParams: true })
        .post('/', 'Action=DescribeImages&ImageId.1=ami-1e299d7e&Version=2016-11-15')
        .reply(200, `<?xml version='1.0' encoding='UTF-8'?>
                <DescribeImagesResponse xmlns='http://ec2.amazonaws.com/doc/2016-11-15/'>
                    <imagesSet>
                        <item>
                            <imageId>ami-1e299d7e</imageId>
                            <imageLocation>amazon/amzn-ami-hvm-2016.09.1.20161221-x86_64-gp2</imageLocation>
                            <imageState>available</imageState>
                            <imageOwnerId>137112412989</imageOwnerId>
                            <creationDate>2016-12-20T23:24:47.000Z</creationDate>
                            <isPublic>true</isPublic>
                            <architecture>x86_64</architecture>
                            <imageType>machine</imageType>
                            <sriovNetSupport>simple</sriovNetSupport>
                            <imageOwnerAlias>amazon</imageOwnerAlias>
                            <name>amzn-ami-hvm-2016.09.1.20161221-x86_64-gp2</name>
                            <description>Amazon Linux AMI 2016.09.1.20161221 x86_64 HVM GP2</description>
                            <rootDeviceType>ebs</rootDeviceType>
                            <rootDeviceName>/dev/xvda</rootDeviceName>
                            <blockDeviceMapping>
                                <item>
                                    <deviceName>/dev/xvda</deviceName>
                                    <ebs>
                                        <snapshotId>snap-0bf6845989e028a9a</snapshotId>
                                        <volumeSize>8</volumeSize>
                                        <deleteOnTermination>true</deleteOnTermination>
                                        <volumeType>gp2</volumeType>
                                        <encrypted>false</encrypted>
                                    </ebs>
                                </item>
                            </blockDeviceMapping>
                            <virtualizationType>hvm</virtualizationType>
                            <hypervisor>xen</hypervisor>
                            <enaSupport>true</enaSupport>
                        </item>
                    </imagesSet>
                </DescribeImagesResponse>`)
       .log((d) => { if (enableDebug) console.log(d); });

      helpers.mockCustomResource(requestParams, responseParms)
      .then(() => {
        assert(nock.isDone());
        done();
      }).catch((d) => { console.log(d); });
    });
  });
});

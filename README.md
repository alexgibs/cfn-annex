# cfn-annex

*A set of tested helper functions for AWS CloudFormation, implemented as an AWS Lambda backed custom resource.
cfn-annex adds functionality to CloudFormation, such as being able to split a string into an array (Fn::Split), generate pseudo-random chars, perform a describe call on another AWS service, or add a delay between resource creation to help with eventual consistency issues.*

## Table of Contents

<!-- toc -->

- [Setup](#setup)
- [How to Use](#how-to-use)
- [Template Syntax helpers](#syntax-helpers)
  * [lowercase](#syntax-helpers--lowercase)
  * [uppercase](#syntax-helpers--uppercase)
  * [split](#syntax-helpers--split) - now natively supported via cfn, will be deprecated. See http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-split.html
  * [remove](#syntax-helpers--remove)
  * [random](#syntax-helpers--random)
- [Stack Creation helpers](#stack-creation-helpers)
  * [pause](#stack-creation-helpers--pause)
- [AWS Resource helpers](#aws-resource-helpers)
  * [describe](#aws-resource-helpers--describe)
  * [tag](#aws-resource-helpers--tag)
- [Debugging](#debugging)
- [Tests](#tests)

<!-- tocstop -->

## Installation

First, start by cloning this this repository.

Installing the cfn-annex Lambda function can be done either of the following methods:

**1. Deploying it as part of a CloudFormation Stack:**

  > Ensure you have npm and the aws cli installed.

  ``
  npm run deploy --s3bucket="mybucket" --stackname="cfn-annex"
  ``
  
  *Note:* The --stackname parameter is optional, it will use 'cfn-annex' as the stack name by default.

**2. Deploying it directly as a Lambda function:**

  - Zip the 'index.js' and 'cfn-response.js' files within the lambda_function folder.
  - Deploy as a NodeJS 4.3 Lambda function: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html

## How to use

The 'test/test-template.yml' CloudFormation template will demonstrate how each of the functions can be used.

This can be deployed with the following:

  ``
  npm run deploy:test --stackname="cfn-annex-test"
  ``
  
  *Note:* The --stackname parameter is optional, it will use 'cfn-annex-test' as the stack name by default.

  The ARN of the Lambda function will be available in the stack outputs and also exported as 'cfn-annex' so that it can be imported in other stacks where required.

[⬆ back to top](#table-of-contents)

## Syntax Helpers

  <a name="syntax-helpers--lowercase"></a><a name="1.1"></a>
  - **[1.1](#syntax-helpers--lowercase) lowercase**

  Converts an UPPERCASE string to a lowercase string.

  Usage:
  ```
  fn: 'lowercase'
  input:
    string: {string}
  ```

 Example CloudFormation Resource:
  ```yaml
  Lowercase:
    Type: Custom::Lowercase
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: lowercase
      input:
        string: TESTING


  # The response can be accessed via the Fn::GetAtt function.
  # Returns 'testing':
  !GetAtt Lowercase.response
  ```

  [⬆ back to top](#table-of-contents)

  <a name="syntax-helpers--uppercase"></a><a name="1.2"></a>
  - **[1.2](#syntax-helpers--uppercase) uppercase**

  Converts a lowercase string to a UPPERCASE string.

  Usage:
  ```
  fn: 'uppercase'
  input:
    string: {string}
  ```

  Example CloudFormation Resource:
  ```yaml
  Uppercase:
    Type: Custom::Uppercase
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: uppercase
      input:
        string: testing

  # The response can be accessed via the Fn::GetAtt function.
  # Returns 'TESTING':
  !GetAtt Uppercase.response
  ```

  [⬆ back to top](#table-of-contents)

  <a name="syntax-helpers--split"></a><a name="1.3"></a>
  - **[1.3](#syntax-helpers--split) split**

  Converts a string into an array, based on a specified delimiter.

  Usage:
  ```
  fn: 'split'
  input:
    string: {string}
    delimiter: {string}
  ```

  Example CloudFormation Resource:
  ```yaml
  Split:
    Type: Custom::Split
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: split
      input:
        string: ab-c--def-g-
        delimiter: '-'

  # The response can be accessed via the Fn::GetAtt function.
  # Returns '['ab','c','','def','g','']:
  !GetAtt Split.response
  ```

  [⬆ back to top](#table-of-contents)

  <a name="syntax-helpers--remove"></a><a name="1.4"></a>
  - **[1.4](#syntax-helpers--remove) remove**

  Removes all occurances of a character or array of characters from a string.

  Usage:
  ```
  fn: 'remove'
  input:
    string: {string}
    remove: {string | array}
  ```

  Example CloudFormation Resource:
  ```yaml
  Remove:
    Type: Custom::Remove
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: remove
      input:
        string: ab-c--def-g-
        # An array of multiple chars to remove could also be specified here:
        remove: '-'

  # The response can be accessed via the Fn::GetAtt function.
  # Returns 'abcdefg':
  !GetAtt Split.remove
  ```

  [⬆ back to top](#table-of-contents)

  <a name="syntax-helpers--random"></a><a name="1.5"></a>
  - **[1.5](#syntax-helpers--random) random**

  Returns a pseudo-random alpha-numeric string of specified length. This can be useful for appending random chars when naming resources.

  Usage:
  ```
  fn: 'random'
  input:
    length: {int}
  ```

  Example CloudFormation Resource:
  ```yaml
  RandomChars:
    Type: Custom::RandomChars
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: random
      input:
        length: 10

  # The response can be accessed via the Fn::GetAtt function.
  # Returns '38hr32974gf':
  !GetAtt RandomChars.response
  ```

  [⬆ back to top](#table-of-contents)

## Stack Creation helpers

  <a name="stack-creation-helpers--pause"></a><a name="2.1"></a>
  - **[2.1](#stack-creation-helpers--pause) pause**

  Causes CloudFormation to sleep or pause for a specified duration of time.
  This can be useful to introduce delay when eventual consistency is an issue.
  The CloudFormation 'DependsOn' resource attribute can be used to explicitly define another resource should wait for the pause to finish before being created/updated/deleted.
  http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html

  Usage:
  ```
  fn: 'pause'
  input:
    duration: {int} - in milliseconds
  ```

  Example CloudFormation Resource:
  ```yaml
  Pause:
    Type: Custom::Pause
    Properties:
      ServiceToken: ServiceToken: !ImportValue cfn-annex
      fn: pause
      input:
        # This will pause for 20 seconds:
        duration: 20000
  ```

  [⬆ back to top](#table-of-contents)

## AWS API helpers

  <a name="aws-api-helpers--describe"></a><a name="3.1"></a>
  - **[3.1](#aws-api-helpers--describe) describe**

  Allows you to make a describe API call on another AWS Service from within your stack.
  In order to defined the required API call, parameters and response key, please refer to the AWS NodeJS SDK API Documentation: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/
  *Note: The API call, params and response key are all case sensitive.*

  > Note, the cfn-annex Lambda function execution role must have the required permissions to perform the API action you specify.

  Usage:
  ```
  fn: 'describe'
  input:
    describe: {string} Service.APICall, e.g. EC2.describeImages
    params: {key value pairs} as required by the API call
    responseKey: {string} the name of the key or the path to the key for the value you want returned
  ```

  The following example demonstrates how to look up the root volume SnapshotId an AMI and make it available within your CloudFormation stack:

  Example CloudFormation Resource:
  ```yaml
  Describe:
    Type: Custom::Describe
    Properties:
      ServiceToken: ServiceToken: !ImportValue cfn-annex
      fn: describe
      input:
        # Performs an EC2 describeImages() API call:
        describe: EC2.describeImages
        params:
          ImageIds:
            - ami-123456
        # Full path defined for the response value (.0. defines the first object in an array):
        responseKey: Images.0.BlockDeviceMappings.0.Ebs.SnapshotId

        # Just the key name can also be used. This would return the value corresponding to the first 'SnapshotId' key found in the response:
        # responseKey: SnapshotId

  # The response can be accessed via the Fn::GetAtt function.
  # Returns 'snapshot-12345678':
  !GetAtt Describe.response
  ```

  <a name="aws-api-helpers--tag"></a><a name="3.2"></a>
  - **[3.1](#aws-api-helpers--tag) tag**

  Adds tags to EC2 Instance root EBS volumes and EBS volumes attached via BlockDeviceMappings.
  Support for VPC default resources will be added soon.

  > Note, the cfn-annex Lambda function execution role must have the required permissions to create tags on resources.
  > If used in an autoscaling group, the EC2 instances must have permission to invoke the cfn-annex function.

  Usage:
  ```
  fn: 'tag'
  input:
    resouce: {string} the instance id, e.g. i-1234567
    tags: {list of key value pairs} list of 'Key' and 'Value' tag pairs
  ```

  Example CloudFormation Resource - tagging a single EC2 Instance volumes:
  ```yaml
  Describe:
    Type: Custom::Tag
    Properties:
      ServiceToken: ServiceToken: !ImportValue cfn-annex
      fn: tag
      input:
        resource: i-12345678910
        tags:
          - Key: myTagName
          - Value: myTagValue
  ```

  Example CloudFormation Resource - tagging AutoScaled Instance volumes:
  ```yaml
  LaunchConfiguration:
    Type: AWS::AutoScaling::LaunchConfiguration
    Properties:
      ImageId: ami-123456
      UserData:
        Fn::Base64:
          Fn::ImportValue:
            !Sub
              - |
                #!/bin/bash -xe
                yum install aws-cli
                INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
                aws lambda invoke --region ${AWS::Region} --function-name ${Function} --invocation-type Event --payload "{ \"ResourceProperties\": { \"fn\": \"tag\", \"input\": { \"resource\": \"${!INSTANCE_ID}\", \"tags\": [ { \"Key\": \"myKeyName\", \"Value\": \"myKeyValue\" } ] } } }" outputfile
              - { Function: !ImportValue cfn-annex }
  ```

  [⬆ back to top](#table-of-contents)

## Debugging

An optional 'debug' parameter can be passed with any helper function. This will cause the cfn-annex Lambda function to output more verbose logs to its CloudWatch log group.

 Example:
  ```yaml
  Lowercase:
    Type: Custom::Lowercase
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: lowercase
      input:
        string: TESTING
      # Enables debug logs for this instance of cfn-annex:
      debug: true
  ```

## Tests

All API endpoints, including the S3 pre-signed url for signaling the custom resource are mocked using 'nock' <https://github.com/node-nock/nock>.

To enable debug logs when running tests, set 'enableDebug' to true in the test/helpers.js file.

Mocha tests can be run locally with:

 ``
 npm install
 ``

 ``
 npm test
 ``

The test CloudFormation stack can be deployed with:

  ``
  npm run deploy:test  --stackname="cfn-annex-test"
  ``
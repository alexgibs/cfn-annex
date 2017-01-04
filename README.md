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
  * [split](#syntax-helpers--split)
  * [remove](#syntax-helpers--remove)
  * [random](#syntax-helpers--random)
- [Stack Creation helpers](#stack-creation-helpers)
  * [pause](#stack-creation-helpers--pause)
- [AWS API helpers](#aws-api-helpers)
  * [describe](#aws-api-helpers--describe)
- [Debugging](#debugging)
- [Tests](#tests)

<!-- tocstop -->

## Installation

First, start by cloning this this repository.

Installing the cfn-annex Lambda function can be done either of the following methods:

**1. Deploying it as part of a CloudFormation Stack:**

  > Ensure you have npm and the aws cli installed.

  ``
  npm run deploy --s3bucket="mybucket" --stack-name="cfn-annex"
  ``

**2. Deploying it directly as a Lambda function:**

  - Zip the 'index.js' and 'cfn-response.js' files within the lambda_function folder.
  - Deploy as a NodeJS 4.3 Lambda function: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html

## How to use

The 'test/test-template.yml' CloudFormation template will demonstrate how each of the functions can be used.

This can be deployed with the following:

  ``
  npm run deploy:test --stackname="cfn-annex-test"
  ``

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


  # The response can be accessed via the Fn::GetAtt function:

  !GetAtt Lowercase.response # would return 'testing'
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


  # The response can be accessed via the Fn::GetAtt function:

  !GetAtt Uppercase.response # would return 'TESTING'
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


  # The response can be accessed via the Fn::GetAtt function:

  !GetAtt Split.response # would return '['ab','c','','def','g','']
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
        remove: '-' # an array of multiple chars to remove could be specified here


  # The response can be accessed via the Fn::GetAtt function:

  !GetAtt Split.remove # would return 'abcdefg'
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


  # The response can be accessed via the Fn::GetAtt function:

  !GetAtt RandomChars.response # would return '38hr32974gf'
  ```

  [⬆ back to top](#table-of-contents)

## Stack Creation helpers

  <a name="stack-creation-helpers--pause"></a><a name="2.1"></a>
  - **[2.1](#stack-creation-helpers--pause) pause**

  Causes CloudFormation to sleep or pause for a specified duration of time. This can be useful to introduce delay when eventual consistency is an issue.

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
        duration: 20000 # this will pause for 20seconds.
  ```

  [⬆ back to top](#table-of-contents)

## AWS API helpers

  <a name="aws-api-helpers--describe"></a><a name="3.1"></a>
  - **[3.1](#aws-api-helpers--describe) describe**

  Allows you to make a describe API call on another AWS Service from within your stack. For example, you may wish to find the SnapshotId of an AMI.

  > Note, the cfn-annex Lambda function execution role must have the required permissions to perform the API action.

  Usage:
  ```
  fn: 'describe'
  input:
    describe: {string} Service.APICall, e.g. EC2.describeImages
    params: {key value pairs} as required by the API call
    responseKey: {string} the name of the key or the path to the key for the value you want returned
  ```

  Example CloudFormation Resource:
  ```yaml
  Describe:
    Type: Custom::Describe
    Properties:
      ServiceToken: ServiceToken: !ImportValue cfn-annex
      fn: describe
      input:
        describe: EC2.describeImages #will perform a describeStackResource API call
        params:
          ImageIds:
            - ami-123456
        responseKey: Images.0.BlockDeviceMappings.0.Ebs.SnapshotId # the value you want returned, full path specified.
        # responseKey: SnapshotId # this would return the value corresponding to the first 'SnapshotId' key foudn in the response.


  # The response can be accessed via the Fn::GetAtt function:

  !GetAtt Describe.response # would return 'snapshot-12345678'
  ```

  [⬆ back to top](#table-of-contents)

## Debugging

An optional 'debug' parameter can be parsed with any helper function. This will cause the cfn-annex Lambda function to output more verbose logs to its CloudWatch log group.

 Example:
  ```yaml
  Lowercase:
    Type: Custom::Lowercase
    Properties:
      ServiceToken: !ImportValue cfn-annex
      fn: lowercase
      input:
        string: TESTING
      debug: true # this enables debug logs for this instance of cfn-annex.
  ```

## Tests

Mocha tests can be run locally with:

 ``
 npm install
 ``

 ``
 npm test
 ``

The test CloudFormation stack can be deployed with:

  ``
  npm run deploy:test --stackname="cfn-annex-test"
  ``
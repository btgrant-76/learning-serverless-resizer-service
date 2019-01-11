'use strict';

const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions();

const resizer = require('./resizer');

module.exports.resizer = (event, context, callback) => {
  console.log(event); // .Records[0].s3);

  const bucket = event.bucketName;
  const key = event.objectKey;

  // const bucket = event.Records[0].s3.bucket.name;
  // const key = event.Records[0].s3.object.key;

  console.log(`A file named ${key} was put in a bucket ${bucket}`);

  resizer(bucket, key)
    .then(() => {
      console.log(`The thumbnail was created`);
      callback(null, { message: 'The thumbnail was created' });
    })
    .catch(error => {
      console.log(error);
      callback(error);
    });
};

module.exports.saveImageMetadata = (event, context, callback) => {
  console.log("called saveImageMetadata with event %o", event);

  const bucket = event.bucketName;
  const key = event.objectKey;
};

module.exports.thumbnailListener = (event, context, callback) => {
  console.log('called thumbnailListener');
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  console.log(`A thumbnail named ${key} was created`);
  callback(null, { message: 'A thumbnail was created'});
};

module.exports.executeStepFunction = (event, context, callback) => {
  const stateMachineName = 'ImageProcessingMachine'; // the name of the step function defined in serverless.yml has to be Capitalized

  console.log('Fetching the list of available workflows');

  stepfunctions
    .listStateMachines({})
    .promise()
    .then(listStateMachines => {
      console.log('Searching for the step function', listStateMachines);

      for (var i = 0; i < listStateMachines.stateMachines.length; i++) {
        const item = listStateMachines.stateMachines[i];

        if (item.name.indexOf(stateMachineName) >= 0) {
          console.log('Found the step function', item);

          // The event data contains the information of the S3 bucket and the key of the object
          const eventData = event.Records[0];

          var params = {
            stateMachineArn: item.stateMachineArn,
            input: JSON.stringify({
              objectKey: eventData.s3.object.key,
              bucketName: eventData.s3.bucket.name
            })
          };

          console.log('Start execution');

          stepfunctions.startExecution(params).promise().then(() => { // TODO why is this not item.startExecution?
            return context.succeed('OK');
          });
        }
      }
    }).catch(error => {
      console.log('failing due to error:  ' + error);
      return context.fail(error);
    });
};

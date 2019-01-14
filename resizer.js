'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Jimp = require('jimp'); // https://github.com/oliver-moran/jimp

module.exports = (bucket, key) => {
  const newKey = replacePrefix(key);
  const height = 512;

  return getS3Object(bucket, key)
    .then(data => resizer(data.Body, height))
    .then(buffer => putS3Object(bucket, newKey, buffer));
};

module.exports.cropToBlackAndWhite = (bucket, key) => {
  const newKey = replacePrefix(key, 'crop_');
  const height = 512;

  return getS3Object(bucket, key)
    .then(data => blackAndWhiteSquare(data.Body, height))
    .then(buffer => putS3Object(bucket, newKey, buffer));
};

function getS3Object(bucket, key) {
  console.log(`Getting image '${key}' from bucket '${bucket}'`);

  return S3.getObject({
    Bucket: bucket,
    Key: key
  }).promise();
}

function putS3Object(bucket, key, body) {
  console.log(`Putting image '${key}' into bucket '${bucket}'`);

  return S3.putObject({
    Body: body,
    Bucket: bucket,
    ContentType: 'image/jpg',
    Key: key
  }).promise();
}

function replacePrefix(key, filePrefix = '') {
  const uploadPrefix = 'uploads/';
  const thumbnailsPrefix = `thumbnails/${filePrefix}`;
  return key.replace(uploadPrefix, thumbnailsPrefix);
}

function resizer(data, height) {
  return Jimp.read(data)
    .then(image => {
      return image
        .resize(Jimp.AUTO, height)
        .quality(100) // set JPEG quality
        .getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
          return buffer;
        });
    })
    .catch(err => err);
}

function blackAndWhiteSquare(data, heightAndWidth) {
  return Jimp
    .read(data)
    .then(image => {
      return image
        .crop(0, 0, heightAndWidth, heightAndWidth)
        .greyscale()
        .quality(100)
        .getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
          return buffer;
        })
    }).catch(err => err);

}

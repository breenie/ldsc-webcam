const aws = require("aws-sdk");

const s3 = new aws.S3();

module.exports = {
  // Gets the object body.
  get: ({ Bucket, Key }) =>
    s3
      .getObject({ Bucket, Key })
      .promise()
      .then(({ Body }) => Body),

  //Moves an onject from SourceBucket to TargetBucket, essentialy a copy delete.
  move: ({ TargetBucket, Key, SourceBucket }) =>
    s3
      .copyObject({
        CopySource: `/${SourceBucket}/${Key}`,
        Bucket: TargetBucket,
        Key
      })
      .promise()
      .then(() => s3.deleteObject({ Key, Bucket: SourceBucket }).promise())
      .then(() => ({ Key, Bucket: TargetBucket })),

  // Proxy the native copyObject({CopySource, Bucket, Key})
  copy: args => s3.copyObject(args).promise()
};

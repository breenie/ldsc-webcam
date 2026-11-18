const s3 = require("../s3");
const path = require("path");
const mime = require("mime");

module.exports.handler = async ({ Records }) =>
  Promise.all(
    Records.map(
      ({
        s3: {
          object: { key: Key },
          bucket: { name: Bucket }
        }
      }) =>
        s3
          .get({ Bucket, Key })
          .then(() =>
            s3.move({
              TargetBucket: process.env["ARCHIVED_BUCKET"],
              Key,
              SourceBucket: Bucket
            })
          )
          // The new "moved" Bucket and Key are returned. Not sure if I like that or not.
          .then(({ Bucket, Key }) =>
            // This will honour any file extension so it is possible to end up with multiple latest extensions `latest.png`, `latest.jpg`...
            s3.copy({
              CopySource: `/${Bucket}/${Key}`,
              Bucket,
              Key: `${path.dirname(Key)}/latest${path.extname(Key).toLowerCase()}`
            })
          )
          .catch(console.log)
    )
  ).catch(console.log);

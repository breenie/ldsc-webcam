const s3 = require("../s3");
const gm = require("gm").subClass({ imageMagick: true });
const meanThreshold = parseFloat(process.env["MEAN_THRESHOLD"]);

const mean = buffer =>
  new Promise((resolve, reject) =>
    gm(buffer, "img.jpg").identify(
      { format: "%[mean]", verbose: true },
      (err, format) => (err ? reject(err) : resolve(parseFloat(format)))
    )
  );

module.exports.handler = async ({ Records }) =>
  Promise.all(
    Records.map(({ s3: { object: { key: Key }, bucket: { name: Bucket } } }) =>
      s3
        .get({ Bucket, Key })
        .then(mean)
        .then(
          mean =>
            process.env[
              meanThreshold < mean ? "PROCESSED_BUCKET" : "FAILED_BUCKET"
            ]
        )
        .then(bucket =>
          s3.move({ TargetBucket: bucket, SourceBucket: Bucket, Key })
        )
        .then(console.log)
    )
  ).catch(console.log);

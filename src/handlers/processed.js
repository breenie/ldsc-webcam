const s3 = require("../s3");
const path = require("path");
const mime = require("mime");
const { TwitterApi } = require("twitter-api-v2");

const twitter = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}).readWrite;

const tweet = (body, mimeType) =>
  twitter.v1
    .uploadMedia(body, { mimeType })
    .then((media_ids) =>
      twitter.v2.tweet({ media: { media_ids: [media_ids] } })
    )
    .then(({ data }) => data)
    .then(({ text }) => text);

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
          .then((body) => tweet(body, mime.getType(Key)))
          .then((url) => console.log(`Tweeted ${url}`))
          .then(() =>
            s3.move({
              TargetBucket: process.env["ARCHIVED_BUCKET"],
              Key,
              SourceBucket: Bucket,
              ACL: "public-read"
            })
          )
          // The new "moved" Bucket and Key are returned. Not sure if I like that or not.
          .then(({ Bucket, Key }) =>
            // This will honour any file extension so it is possible to end up with multiple latest extensions `latest.png`, `latest.jpg`...
            s3.copy({
              CopySource: `/${Bucket}/${Key}`,
              Bucket,
              Key: `latest${path.extname(Key).toLowerCase()}`,
              ACL: "public-read"
            })
          )
          .catch(console.log)
    )
  ).catch(console.log);

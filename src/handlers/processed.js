const s3 = require("../s3");
const path = require("path");
const Twitter = require("twitter");

const twitter = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const tweet = body =>
  twitter
    .post("media/upload", { media_data: body.toString("base64") })
    .then(({ media_id_string }) => media_id_string)
    .then(media_ids => twitter.post("statuses/update", { media_ids }))
    .then(({ text }) => text);

module.exports.handler = async ({ Records }) =>
  Promise.all(
    Records.map(({ s3: { object: { key: Key }, bucket: { name: Bucket } } }) =>
      s3
        .get({ Bucket, Key })
        .then(body => tweet(body))
        .then(url => console.log(`Tweeted ${url}`))
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
        .catch(e => console.log(e))
    )
  ).catch(({ message }) => console.log(message));

const aws = require("aws-sdk");
const Twitter = require("twitter");

const s3 = new aws.S3();
const twitter = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

module.exports.tweet = async ({ Records }) =>
  Promise.all(
    Records.map(({ s3: { object: { key: Key }, bucket: { name: Bucket } } }) =>
      s3
        .getObject({ Bucket, Key })
        .promise()
        .then(({ Body }) =>
          twitter.post("media/upload", { media_data: Body.toString("base64") })
        )
        .then(({ media_id_string }) => media_id_string)
        .then(media_ids => twitter.post("statuses/update", { media_ids }))
        .then(({ text }) => console.log(`Tweeted ${text}`))
    )
  ).catch(({ message }) => console.log(message));

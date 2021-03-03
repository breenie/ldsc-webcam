const aws = require("aws-sdk");
const twitter = require("twitter");

const s3 = new aws.S3();
const twtr = new twitter({
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
          twtr.post("media/upload", { media_data: Body.toString("base64") })
        )
        .then(({ media_id_string }) => media_id_string)
        .then(media_ids => twtr.post("statuses/update", { media_ids }))
        .then(({ text }) => `Tweeted ${text}`)
    )
  ).catch(({ message }) => console.log(message));

const format = require("date-format");
const simpleParser = require("mailparser").simpleParser;
const s3 = require("../s3");

// ldscwebcam__20180112.135711GMT.jpg
const now = () => format("yyyyMMdd.hhmmss", new Date());

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
          .then((source) =>
            simpleParser(source, {}).then(({ attachments }) =>
              // TODO this can probably be improved
              attachments.filter(
                (a) =>
                  "image/jpeg" === a["contentType"] ||
                  "image/jpg" === a["contentType"]
              )
            )
          )
          .then(([at]) => at)
          .then(({ content: Body }) =>
            s3.put({
              Body,
              Bucket: process.env["SOURCE_BUCKET"],
              Key: `ldscwebcam__${now()}GMT.jpg`
            })
          )
          .catch((err) => console.error(err))
    )
  );

const format = require("date-format");
const simpleParser = require("mailparser").simpleParser;
const s3 = require("../s3");

const CAMERAS = Object.freeze({
  hut: "hut",
  slope: "slope"
});

const getCamera = (subject) => {
  if (subject === undefined) {
    return CAMERAS.hut;
  }

  const subjects = {
    [CAMERAS.hut]: ["Hutcam"],
    [CAMERAS.slope]: ["DAV ski slope webcam"]
  };

  for (const [key, values] of Object.entries(subjects)) {
    if (values.includes(subject)) {
      return key;
    }
  }

  return "unknown";
};

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
          .then((source) => simpleParser(source, {}))
          .then(({ attachments, subject }) => ({
            subject,
            // TODO this can probably be improved
            attachment: attachments.filter(
              (a) =>
                "image/jpeg" === a["contentType"] ||
                "image/jpg" === a["contentType"]
            )?.[0]
          }))
          .then(({ attachment: { content: Body }, subject }) => ({
            Body,
            Key: `${getCamera(subject)}/ldscwebcam__${now()}GMT.jpg`
          }))
          .then(
            (data) =>
              console.log(
                `Uploading ${process.env["SOURCE_BUCKET"]} with Key: ${data.Key}` ||
                  data
              ) || data
          )
          .then(({ Body, Key }) =>
            s3.put({
              Body,
              Bucket: process.env["SOURCE_BUCKET"],
              Key,
              ContentType: "image/jpeg"
            })
          )
          .catch((err) => console.error(err))
    )
  );

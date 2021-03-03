# The Lake District Ski Club Webcam image handler

## Basic flow

1. Push image to S3 path `incoming/*`
2. Fire `s3:ObjectCreated` event
3. Read image from bucket
4. Tweet content

## Configuration

Environment values passed to the lambdas come from SSM or the local environment. SSM values are stored in the form `/${service}/${stage}/${NAME}`.

Copy `.env` to `.env.${stage}` and fill in the blanks.

## Development

To upload an image locally execute the fragment below taking care to use values which point to an actual S3 resource.

```sh
$ npx sls invoke local --function hello --data '{"Records":[{"s3":{"bucket":{"name":"ldscwebcam"},"object":{"key":"incoming/ldscwebcam__20180112.135711GMT.jpg"}}}]}'
```

## Deployment

```sh
$ npx deploy --stage=<stage|production>
```

## Testing

Err, 😬. Maybe next time.

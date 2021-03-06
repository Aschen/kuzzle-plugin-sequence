# Kuzzle Plugin S3

This plugin exposes actions to upload files to Amazon S3 using [Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/dev/PresignedUrlUploadObject.html).  

## Usage

Get a Presigned URL: 

```javascript
// Kuzzle request
{
  "controller": "s3/upload",
  "action": "getUrl",
  "filename": "headcrab.png",
  "uploadDir": "xen"
}

// Kuzzle response
{
  "fileKey": "xen/<uuid>-headcrab.png",
  "uploadUrl": "https://s3.eu-west-3.amazonaws.com/...",
  "fileUrl": "https://s3.eu-west-3.amazonaws.com/...",
  "ttl": 1200000
}
```

Then send a PUT request to the `uploadUrl` URL with the body set to the file's content and a `Content-Type` header corresponding to the file mime type.  

Finally, validate the uploaded file. If not validated in a timely manner (the TTL is configurable), the uploaded file is automatically removed.

```javascript
// Kuzzle request
{
  "controller": "s3/upload",
  "action": "validate",
  "fileKey": "xen/<uuid>-headcrab.png"
}
```

### Example using the Javascript SDK

```js
  // Get a Presigned URL
  const file = document.getElementById('uploadInput').files[0];
  const { result } = await kuzzle.query({
    controller: 's3/upload',
    action: 'getUrl',
    uploadDir: 'xen',
    filename: file.name
  });

  // Upload the file directly to S3
  const axiosOptions = {
    headers: {
      'Content-Type': file.type
    }
  };
  await axios.put(result.uploadUrl, file, axiosOptions);

  // Validate the uploaded file
  await kuzzle.query({
    controller: 's3/upload',
    action: 'validate',
    fileKey: result.fileKey
  });
```

You can see a full example here: [test/s3-test.html](test/s3-test.html)

### API

#### *upload:getUrl*

Returns a Presigned URL to upload directly to S3.  
The URL is only valid for a specified period of time. (Configurable in the [kuzzlerc file](https://docs.kuzzle.io/plugins/1/manual-setup/config/))

File uploaded to the generated URL must be validated with `upload:validate` otherwise they will be deleted after the same TTL as for the URL expiration.

*Request format:*

```javascript
{
  // Kuzzle API params
  "controller": "s3/upload",
  "action": "getUrl",

  // Uploaded file name
  "filename": "headcrab.png", 
  // Upload directory
  "uploadDir": "xen" 
}
```

*Response result format:* 

```javascript
{
  // File key in S3 bucket
  "fileKey": "xen/<uuid>-headcrab.png", 
  // Presigned upload URL
  "uploadUrl": "https://s3.eu-west-3.amazonaws.com/...", 
  // Public file URL after successful upload
  "fileUrl": "https://s3.eu-west-3.amazonaws.com/...", 
  // TTL in ms for the URL validity and before the uploaded file deletion
  "ttl": 1200000 
}
```

#### *upload:validate*

Validate and persist a previsously uploaded file.  
Without a call to the action, every file uploaded on a Presigned URL will be deleted after a TTL.

*Request format:*

```javascript
{
  // Kuzzle API params
  "controller": "s3/upload",
  "action": "validate",

  // File key in S3 bucket
  "fileKey": "xen/<uuid>-headcrab.png" 
}
```

*Response result format:* 

```javascript
{
  // File key in S3 bucket
  "fileKey": "xen/<uuid>-headcrab.png", 
  // Public file URL after successful upload
  "fileUrl": "https://s3.eu-west-3.amazonaws.com/..." 
}
```

#### *file:getUrl*

Returns the public file URL.

*Request format:*

```javascript
{
  // Kuzzle API params
  "controller": "s3/file",
  "action": "getUrl",

  // File key in S3 bucket
  "fileKey": "xen/<uuid>-headcrab.png" 
}
```

*Response result format:* 

```javascript
{
  // Public file URL after successful upload
  "fileUrl": "https://s3.eu-west-3.amazonaws.com/..." 
}
```

#### *file:delete*

Deletes an uploaded file from S3.

*Request format:*

```javascript
{
  // Kuzzle API params
  "controller": "s3/file",
  "action": "delete",

  "fileKey": "xen/<uuid>-headcrab.png" // File key in S3 bucket
}
```

## Configuration

You need to set your AWS access key in the environment: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.  
Your access key must have the following rights: `PutObject` and `DeleteObject`.  

Then in your `kuzzlerc` file, you can change the following configuration variable:

```js
{
  "plugins": {
    "s3": {
      // AWS S3 bucket
      "bucketName": "your-s3-bucket",
      // AWS S3 region
      "region": "eu-west-3",
      // TTL in ms before Presigned URL expire or the uploaded file is deleted
      "signedUrlTTL": 1200000,
      // Redis key prefix
      "redisPrefix": "s3Plugin/uploads"
    }
  }
}
```


### AWS S3 Bucket

First you must configure your bucket to allow public access to uploaded files.  
Go to the `Permissions` tab in your bucket configuration and in `Bucket Policy` add the following statement:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AddPerm",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Then you have to allow Cross Origin Request by editing the CORS Configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
<CORSRule>
    <AllowedOrigin>your-app-domain.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
    <AllowedHeader>Content-Type</AllowedHeader>
    <AllowedHeader>Authorization</AllowedHeader>
</CORSRule>
</CORSConfiguration>
```

## Installation

### On an existing Kuzzle stack

Clone this repository in your `plugins/available` directory and then link it to the `plugins/enabled` directory.  

Then go to your plugin directory and run the following command `npm install`.

For more information, refer to the official documentation: https://docs.kuzzle.io/guide/1/essentials/plugins/#installing-a-plugin

### Local setup

You can use the [docker-composer.yml](docker/docker-compose.yml) file provided in this repository to start a Kuzzle stack with this plugin pre-installed.  

You have to provide valid credentials for AWS S3 through the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables.

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key

docker-compose -f docker/docker-compose.yml up
```

Then you can open the file [test/s3-upload-test.html](test/s3-upload-test.html) in your browser.

# kuzzle-plugin-sequence

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'node:crypto'

let s3Client = null

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

/**
 * Upload a buffer to Cloudflare R2
 * @param {Buffer} buffer - file buffer
 * @param {string} mimeType - e.g. 'image/png'
 * @param {string} folder - subfolder in bucket e.g. 'canvas'
 * @returns {Promise<string>} public URL
 */
export async function uploadToR2(buffer, mimeType = 'image/png', folder = 'canvas') {
  const ext = mimeType.split('/')[1] || 'png'
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`

  const client = getS3Client()
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }))

  return `${process.env.R2_PUBLIC_URL}/${key}`
}

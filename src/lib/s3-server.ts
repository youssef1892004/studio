import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const WASABI_ENDPOINT = "https://s3.eu-south-1.wasabisys.com";

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET_NAME || !AWS_REGION) {
    console.warn("S3 environment variables are missing. Uploads will fail.");
}

export const s3Client = new S3Client({
    region: AWS_REGION,
    endpoint: WASABI_ENDPOINT,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || '',
        secretAccessKey: AWS_SECRET_ACCESS_KEY || '',
    }
});

export async function uploadToS3(buffer: Buffer, contentType: string, projectId: string, extension: string = 'mp3'): Promise<string> {
    if (!S3_BUCKET_NAME) throw new Error("S3_BUCKET_NAME is not defined");

    const objectKey = `studio-uploads/${projectId}/${uuidv4()}.${extension}`;

    const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read' as any,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    return `${WASABI_ENDPOINT}/${S3_BUCKET_NAME}/${objectKey}`;
}

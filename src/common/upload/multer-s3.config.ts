import { Injectable } from '@nestjs/common';
import { ConfigService, S3 } from 'aws-sdk';
import { Multer } from 'multer';

@Injectable()
export class AwsS3Service {
    constructor (
        private readonly configService : ConfigService
    ) {}

    private s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
    });

    async upload(file: Multer.File, folder = 'uploads'): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    await this.s3
        .upload({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
        .promise();

        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
    }
}

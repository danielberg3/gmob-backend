import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder: 'imoveis' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
}

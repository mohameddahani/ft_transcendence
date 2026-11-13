import { Injectable, Inject } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  constructor(
    // Inject the custom Cloudinary provider.
    // We cannot inject Cloudinary directly because it is an external library,
    // not a NestJS-managed class. Therefore, we use a custom injection token.
    @Inject(CLOUDINARY)

    // `typeof Cloudinary` gives TypeScript the shape of the Cloudinary SDK object,
    // allowing autocomplete and type checking for methods like:
    // uploader.upload_stream(), uploader.destroy(), api resources, etc.
    private readonly cloudinary: typeof Cloudinary,
  ) {}

  /**
   * Upload an image to Cloudinary.
   *
   * @param file - File object provided by Multer after uploading to memory.
   * @param folder - Cloudinary folder where the image will be stored.
   *
   * @returns Promise containing Cloudinary upload response
   */
  upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader

        // Use upload_stream because Multer stores the uploaded file
        // in memory (`file.buffer`) instead of saving it on disk.
        //
        // This allows sending the file directly to Cloudinary without
        // creating temporary files on the server.
        .upload_stream(
          {
            // Cloudinary folder structure:
            // Example: "users/avatar.jpg"
            folder,

            // Specify that the uploaded resource is an image.
            // Cloudinary also supports video and raw files.
            resource_type: 'image',

            // Replace an existing file if the same public ID already exists.
            overwrite: true,

            // Generate a unique filename to avoid name collisions.
            // Example:
            // avatar.png -> avatar_a8sd92.png
            unique_filename: true,
          },

          // Cloudinary uses callbacks instead of returning a Promise.
          // This callback runs after the upload operation finishes.
          (error, result) => {
            // If Cloudinary returns an error, reject the Promise.
            // This allows callers to handle errors using try/catch with await.
            if (error) {
              return reject(new Error(error.message));
            }

            // Check if result is empty
            if (!result) {
              return reject(new Error('Cloudinary returned empty response'));
            }

            // Resolve the Promise with Cloudinary's response.
            resolve(result);
          },
        )

        // Send the file buffer to the Cloudinary upload stream
        // and close the stream to start the upload process.
        .end(file.buffer);
    });
  }

  /**
   * Delete an image from Cloudinary.
   *
   * @param publicId - Cloudinary unique identifier of the image.
   *
   * Example:
   * "users/profile_a83jd92"
   */
  delete(publicId: string) {
    // Cloudinary uses the public ID to locate and remove the asset.
    return this.cloudinary.uploader.destroy(publicId);
  }
}

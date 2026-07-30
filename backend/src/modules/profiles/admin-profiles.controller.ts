import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';

@Controller('/api/users/admins')
export class AdminProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /* 
  =========================
  ! Admins Profile
  =========================
  */

  // * Get current admin
  @Get('me')
  // * @UseGuards applies a guard to a route/controller to control access before execution. Used for authentication, authorization, and permission checks.
  @UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.ADMIN])
  @SkipThrottle() // * Skip Rate Limiting
  // * @GetAccessTokenPayload(): this is Custom parameter decorator
  findMe(@GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload) {
    return this.profilesService.findMe(accessTokenPayload.id);
  }

  // * Update data of admin
  @Patch('edit-profile')
  @UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profilesService.update(accessTokenPayload.id, body);
  }

  // * Upload profile image
  @Post('profile-image')
  // * Interceptors: are NestJS classes that run BEFORE and AFTER the route handler.
  //   They can transform requests, handle files, logging, or modify responses.
  //
  // * @UseInterceptors: is a NestJS decorator used to attach one or more interceptors
  //   to a route handler so they run during request processing.
  //
  // * FileInterceptor: is a built-in NestJS interceptor (based on Multer)
  //   that handles SINGLE file upload from a specific form field name.
  @UseInterceptors(
    FileInterceptor('file', {
      // * diskStorage: is a Multer storage engine that saves uploaded files
      //   directly to the local filesystem (your server disk).

      storage: diskStorage({
        // * destination: is the folder path where uploaded files will be saved.
        destination: './images/users/profile',

        // * req: is the HTTP request object (contains headers, body, user, etc.)
        // * file: is the uploaded file object (originalname, mimetype, buffer, etc.)
        // * cb: is a callback function used by Multer to return the filename or error

        filename: (req, file, cb) => {
          // * Date.now(): returns current timestamp (used to avoid filename collisions)
          // * Math.random(): generates random number to further ensure uniqueness
          const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000000)}`;

          // * file.originalname: is the original filename from the user (e.g. avatar.png)
          const filename = `${prefix}-${file.originalname}`;

          // * cb(null, filename): sends final generated filename back to Multer
          //   null = no error, filename = saved file name
          cb(null, filename);
        },
      }),

      fileFilter: (req, file, cb) => {
        // * file.mimetype: represents file type sent by browser (e.g. image/png, image/jpeg)
        // * startsWith('image'): checks if mimetype begins with "image"
        //   meaning only image files are allowed

        if (file.mimetype.startsWith('image')) {
          cb(null, true); // accept file
        } else {
          cb(new BadRequestException('Unsupported File Format'), false); // reject file
        }
      },

      // * limits: restricts file upload size to prevent large or malicious uploads
      // * fileSize: 1024 * 1024 = 1MB maximum file size
      limits: { fileSize: 1024 * 1024 },
    }),
  )

  // * UseGuards: applies authentication/authorization guards to protect the route
  @UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  uploadProfileImage(
    // * @UploadedFile: extracts the uploaded file from the request
    @UploadedFile() file: Express.Multer.File,

    // * @GetAccessTokenPayload: custom decorator that retrieves logged-in user from request (JWT payload)
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    // * validation: ensures file exists before continuing
    if (!file) {
      throw new BadRequestException('No Image Provided');
    }

    return this.profilesService.uploadProfileImage(
      accessTokenPayload.id,
      file.filename,
    );
  }

  // * Remove profile image
  @Delete('profile-image')
  @UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removeProfileImage(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.profilesService.removeProfileImage(accessTokenPayload.id);
  }

  // * Get image
  @Get('profile-image/:image')
  @UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.ADMIN])
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  findImage(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('image') image: string,
    @Res() res: Response,
  ) {
    return this.profilesService.findImage(accessTokenPayload.id, image, res);
  }
}

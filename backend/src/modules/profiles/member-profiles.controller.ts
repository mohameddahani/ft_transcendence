import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';

@Controller('/api/users/members')
export class MemberProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /* 
  =========================
  ! Members Profile
  =========================
  */

  // * Get current member
  @Get('me')
  // * @UseGuards applies a guard to a route/controller to control access before execution. Used for authentication, authorization, and permission checks.
  @UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.MEMBER])
  @SkipThrottle() // * Skip Rate Limiting
  // * @GetAccessTokenPayload(): this is Custom parameter decorator
  findMeMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.profilesService.findMeMember(accessTokenPayload.id);
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
  @UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.MEMBER])
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  uploadProfileImageMember(
    // * @UploadedFile: extracts the uploaded file from the request
    @UploadedFile() file: Express.Multer.File,

    // * @GetAccessTokenPayload: custom decorator that retrieves logged-in user from request (JWT payload)
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    // * validation: ensures file exists before continuing
    if (!file) {
      throw new BadRequestException('No Image Provided');
    }

    return this.profilesService.uploadProfileImageMember(
      accessTokenPayload.id,
      file.filename,
    );
  }

  // * Remove profile image
  @Delete('profile-image')
  @UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.MEMBER])
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removeProfileImageMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.profilesService.removeProfileImageMember(accessTokenPayload.id);
  }

  // * Get image
  @Get('profile-image/:image')
  @UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
  @Roles([Role.MEMBER])
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  findImageMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('image') image: string,
    @Res() res: Response,
  ) {
    return this.profilesService.findImageMember(
      accessTokenPayload.id,
      image,
      res,
    );
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from '@/decorators/current-user.decorator';
import type { JWTPayload } from '@/utils/types';
import { AuthRolesGuard } from './guards/auth.roles.guard';
import { Roles } from '@/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { ForgotPasswordUserDto } from './dtos/forgot-passworf-user.dto';
import { ResetPasswordUserDto } from './dtos/reset-passworf-user.dto';

@Controller('/api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // * Register
  @Post('register')
  register(@Body() body: RegisterUserDto) {
    return this.usersService.register(body);
  }

  // * Login
  @Post('login')
  @HttpCode(HttpStatus.OK) // * set default status code
  login(@Body() body: LoginUserDto) {
    return this.usersService.login(body);
  }

  // * Activate user account
  @Get('auth/activate')
  activateAccount(@Query('token') token: string) {
    return this.usersService.activateAccount(token);
  }

  // * Forgot password
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK) // * set default status code
  forgotPassword(@Body() email: ForgotPasswordUserDto) {
    return this.usersService.forgotPassword(email.email);
  }

  // * Reset password
  @Post('auth/reset-password')
  resetPassword(
    @Query('token') token: string,
    @Body() password: ResetPasswordUserDto,
  ) {
    return this.usersService.resetPassword(token, password.password);
  }

  // * Get current user
  @Get('me')
  // * @UseGuards applies a guard to a route/controller to control access before execution. Used for authentication, authorization, and permission checks.
  @UseGuards(AuthGuard)
  // * @CurrentUser(): this is Custom parameter decorator
  findMe(@CurrentUser() userPayload: JWTPayload) {
    return this.usersService.findMe(userPayload.id);
  }

  // * Update data of user
  @Patch('edit-profile')
  @UseGuards(AuthGuard)
  update(@CurrentUser() userPayload: JWTPayload, @Body() body: UpdateUserDto) {
    return this.usersService.update(userPayload.id, body);
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
  @UseGuards(AuthGuard)
  uploadProfileImage(
    // * @UploadedFile: extracts the uploaded file from the request
    @UploadedFile() file: Express.Multer.File,

    // * @CurrentUser: custom decorator that retrieves logged-in user from request (JWT payload)
    @CurrentUser() userPayload: JWTPayload,
  ) {
    // * validation: ensures file exists before continuing
    if (!file) {
      throw new BadRequestException('No Image Provided');
    }

    return this.usersService.uploadProfileImage(userPayload.id, file.filename);
  }

  // * Remove profile image
  @Delete('profile-image')
  @UseGuards(AuthGuard)
  removeProfileImage(@CurrentUser() userPayload: JWTPayload) {
    return this.usersService.removeProfileImage(userPayload.id);
  }

  // * Get image
  @Get('profile-image/:image')
  @UseGuards(AuthGuard)
  findImage(@Param('image') image: string, @Res() res: Response) {
    // * Check if image is already exist
    const imagePath = join(process.cwd(), 'images/users/profile', image);
    if (!existsSync(imagePath)) {
      throw new BadRequestException('There is No Profile Image In DataBase');
    }

    // * Send file to client
    return res.sendFile(imagePath);
  }

  // ! All this routes is Access only by Admin

  // * Get all users
  @Get()
  // * Check if user has valid token and is a admin not normal user
  @UseGuards(AuthGuard, AuthRolesGuard)
  // * Set admin roles in this route
  @Roles([UserType.admin])
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  // * Get one user
  @Get(':id')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles([UserType.admin])
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // * Delete one user
  @Delete(':id')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles([UserType.admin])
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}

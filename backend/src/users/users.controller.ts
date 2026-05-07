import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
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

  // * Get current user
  @Get('me')
  // * @UseGuards applies a guard to a route/controller to control access before execution. Used for authentication, authorization, and permission checks.
  @UseGuards(AuthGuard)
  // * @CurrentUser(): this is Custom parameter decorator
  findMe(@CurrentUser() userPayload: JWTPayload) {
    return this.usersService.findMe(userPayload.id);
  }

  // * Get all users
  @Get()
  // * Check if user has valid token and is a admin not normal user
  @UseGuards(AuthGuard, AuthRolesGuard)
  // * Set admin roles in this route
  @Roles(UserType.admin)
  findAll() {
    return this.usersService.findAll();
  }

  // * Get one user
  @Get(':id')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserType.admin)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // * Update one user
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
  //   return this.postsService.update(+id, updatePostDto);
  // }

  // * Delete one user
  @Delete(':id')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserType.admin)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}

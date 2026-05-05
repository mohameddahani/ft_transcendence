import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';

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
  login(@Body() body: LoginUserDto) {
    return this.usersService.login(body);
  }

  // * Get all users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // * Get one user
  @Get(':id')
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}

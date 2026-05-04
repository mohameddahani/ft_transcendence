import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { User } from "./register.entity";

@Controller("/api/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // * Register
  @Post()
  registerUser(@Body() body: RegisterUserDto): Promise<void> {
    return this.usersService.register(body);
  }

  // * Get all users
  @Get()
  getAllUsers(): Promise<User[]> {
    return this.usersService.getAll();
  }

  // * Get one user
  @Get(":id")
  getOneUser(@Param("id", ParseIntPipe) id: number): Promise<User> {
    return this.usersService.getOne(id);
  }
}

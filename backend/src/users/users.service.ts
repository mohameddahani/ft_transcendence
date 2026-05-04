import { Repository } from "typeorm";
import { User } from "./register.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { RegisterUserDto } from "./dtos/register-user.dto";

export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  // * Register
  async register(data: RegisterUserDto): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { userName: data.userName },
        { email: data.email },
        { phoneNumber: data.phoneNumber },
      ],
    });

    if (existingUser) {
      if (existingUser.userName === data.userName) {
        throw new BadRequestException("Username already exists");
      }

      if (existingUser.email === data.email) {
        throw new BadRequestException("Email already exists");
      }

      if (existingUser.phoneNumber === data.phoneNumber) {
        throw new BadRequestException("Phone number already exists");
      }
    }

    const newUser = this.usersRepository.create(data);
    await this.usersRepository.save(newUser);
  }

  // * Get all users
  async getAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    if (users.length <= 0) {
      throw new NotFoundException("No Users To Show");
    }
    return users;
  }

  // * Get one user
  async getOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException("User Not Found");
    }
    return user;
  }
}

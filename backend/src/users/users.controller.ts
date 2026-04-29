import { Controller, Get } from "@nestjs/common";

@Controller()
export class UserController {
  @Get("/api/users")
  getAllUsers() {
    return [
      { id: 1, email: "user123@gmail.com" },
      { id: 2, email: "user456@gmail.com" },
      { id: 3, email: "user789@gmail.com" },
    ];
  }
}

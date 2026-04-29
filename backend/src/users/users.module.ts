import { Module } from "@nestjs/common";

@Module({})
export class UsersModule {
  test: string;
  constructor(test: string) {
    this.test = test;
  }
}

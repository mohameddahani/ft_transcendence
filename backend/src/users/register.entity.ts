import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// * Type of Users
enum UserType {
  ADMIN = "admin",
  NORMAL_USER = "normal_user",
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  userName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ unique: true })
  phoneNumber!: string;

  @Column({ type: "enum", enum: UserType, default: UserType.NORMAL_USER })
  userType!: UserType;

  @Column({ default: false })
  isAccountVerified!: boolean;

  @Column()
  termsAccepted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

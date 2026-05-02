import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// * name of database
@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  price!: number;

  @CreateDateColumn({ type: "timestamp", default: "CURRENT_TIMESTAMP(6)" }) // * store both date + time (2026-05-02 20:45:12)
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt!: Date;
}

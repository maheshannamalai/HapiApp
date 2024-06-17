import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Users } from "./User";
import { Products } from "./Products";

@Entity()
export class Carts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Users, (user) => user.cart)
  user: Users;

  @ManyToOne(() => Products, (product) => product.cart)
  product: Products;
}

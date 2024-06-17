import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Orders } from "./Orders";
import { Carts } from "./Carts";

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password: string;

  @OneToMany(() => Orders, (orders) => orders.placedBy)
  orders: Orders[];

  @OneToMany(() => Carts, (carts) => carts.user)
  cart: Carts[];
}

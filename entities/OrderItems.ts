import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Orders } from "./Orders";
import { Products } from "./Products";

@Entity()
export class OrderItems {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Orders, (orders) => orders.id)
  order: Orders;

  @ManyToOne(() => Products, (products) => products.id)
  product: Products;

  @Column()
  quantity: number;

  @Column()
  price: number;
}

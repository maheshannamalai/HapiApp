import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Reviews } from "./Reviews";
import { Categories } from "./Categories";
import { Carts } from "./Carts";

@Entity()
export class Products {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  stock: number;

  @Column()
  price: number;

  @ManyToOne(() => Categories, (categories) => categories.id)
  category: Categories;

  @OneToMany(() => Reviews, (reviews) => reviews.product)
  reviews: Reviews[];

  @OneToMany(() => Carts, (carts) => carts.product)
  cart: Carts[];
}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Reviews } from "./Reviews";

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

  @Column()
  category: string;

  @OneToMany(() => Reviews, (reviews) => reviews.product)
  reviews: Reviews[];
}

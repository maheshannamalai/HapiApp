import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Products } from "./Products";

@Entity()
export class Categories {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(
    () => Categories,
    (categories) => {
      categories.id;
    }
  )
  @JoinColumn()
  parent: number;

  @OneToMany(() => Products, (products) => products.category)
  products: Products[];
}

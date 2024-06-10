import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Reviews } from "./Reviews";
import { Products } from "./Products";

@Entity()
export class Orders {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @OneToOne(() => Products)
  @JoinColumn()
  product_: Products;
}

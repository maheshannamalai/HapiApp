import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Users } from "./User";
import { OrderItems } from "./OrderItems";
import { Coupons } from "./Coupons";

@Entity()
export class Orders {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (users) => users.id)
  placedBy: Users;

  @OneToMany(() => OrderItems, (orderitems) => orderitems.order)
  ordersItems: OrderItems[];

  @Column()
  totalamount: number;
}

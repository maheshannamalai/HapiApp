import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Users } from "./User";
import { OrderItems } from "./OrderItems";

@Entity()
export class Orders {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (users) => users.id)
  placedBy: Users;

  @OneToMany(() => OrderItems, (orderitems) => orderitems.order)
  ordersItems: OrderItems[];
}

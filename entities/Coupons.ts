import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Orders } from "./Orders";

@Entity()
export class Coupons {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uniqueCode: string;

  @Column()
  used: boolean;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  percent: number;

  @OneToOne(() => Orders)
  @JoinColumn()
  order: Orders;
}

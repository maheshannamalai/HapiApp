import { DataSource } from "typeorm";
import { Users } from "./entities/User";
import { Products } from "./entities/Products";
import { Orders } from "./entities/Orders";
import { Reviews } from "./entities/Reviews";
import { OrderItems } from "./entities/OrderItems";

export const getUser = (name: string, ds: DataSource) => {
  return new Promise<Users>(async (resolve) => {
    const user = await ds.manager.findOneBy(Users, {
      name,
    });
    resolve(user);
  });
};

export const getAllOrders = (ds: DataSource) => {
  return new Promise<Orders[]>(async (resolve) => {
    const orders = await ds.manager.find(Orders, {
      relations: {
        placedBy: true,
      },
    });
    resolve(orders);
  });
};

// export const dbscript = (ds: DataSource) => {
//   return new Promise<void>(async (resolve) => {
//     for (let i = 1; i < 100000; i++) {
//       const p = new Products();
//       p.name = "p" + i;
//       p.price = 10;
//       p.stock = 10;
//       p.category = "c" + i;
//       ds.manager.save(p);
//     }
//     resolve();
//   });
// };

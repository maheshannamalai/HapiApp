import { DataSource } from "typeorm";
import { Users } from "./entities/User";
import { Products } from "./entities/Products";
import { Orders } from "./entities/Orders";
import { Reviews } from "./entities/Reviews";

export const getUser = (name: string, ds: DataSource) => {
  return new Promise<Users>(async (resolve) => {
    const user = await ds.manager.findOneBy(Users, {
      name,
    });
    resolve(user);
  });
};

export const getProductAndReviews = (ds: DataSource) => {
  return new Promise<Products[]>(async (resolve) => {
    // const product = await ds.manager.find(Products, {
    //   relations: {
    //     reviews: true,
    //   },
    // });
    const product = await ds.manager.find(Products, {
      relations: { reviews: true },
    });
    for (const p of product) {
      await ds.manager.find(Reviews, {
        where: {
          product_: p,
        },
      });
    }

    console.log("---------------------");

    const productsWithReviews = await ds.manager
      .createQueryBuilder(Products, "product")
      .leftJoinAndSelect("product.reviews", "review")
      .getMany();

    resolve(product);
  });
};

export const getAllOrders = (ds: DataSource) => {
  return new Promise<Orders[]>(async (resolve) => {
    const orders = await ds.manager.find(Orders, {
      relations: {
        product_: true,
      },
    });
    console.log(orders);
    resolve(orders);
  });
};

export const postOrder = (
  ds: DataSource,
  pid: number,
  quantity: number,
  oid
) => {
  return new Promise<void>(async (resolve) => {
    const products = await ds.manager.findOneBy(Products, {
      id: pid,
    });
    products.stock -= quantity;

    const orders = new Orders();
    orders.id = oid;
    orders.quantity = quantity;
    orders.product_ = products;

    await ds.manager.transaction(async (transactionalEntityManager) => {
      await ds.manager.save(products);
      await transactionalEntityManager.save(orders);
    });

    resolve();
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

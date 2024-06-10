import { DataSource } from "typeorm";
import { Users } from "./entities/User";
import { Products } from "./entities/Products";
import { Orders } from "./entities/Orders";

export const validateUser = (
  name: string,
  password: string,
  ds: DataSource
) => {
  return new Promise<Users>(async (resolve) => {
    const user = await ds.manager.findOneBy(Users, {
      name,
      password,
    });
    console.log(user);
    resolve(user);
  });
};

export const getProductAndReviews = (ds: DataSource) => {
  return new Promise<Products[]>(async (resolve) => {
    const product = await ds.manager.find(Products, {
      relations: {
        reviews: true,
      },
    });
    console.log(product);
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

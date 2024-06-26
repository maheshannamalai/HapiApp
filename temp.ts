import Hapi from "@hapi/hapi";
import inert from "@hapi/inert";
import amqplib from "amqplib";
import { DataSource } from "typeorm";
import { Carts } from "./entities/Carts";
import { OrderItems } from "./entities/OrderItems";
import { Orders } from "./entities/Orders";
import { Users } from "./entities/User";
import { createClient } from "redis";
import { Coupons } from "./entities/Coupons";
// import profiler from "v8-profiler-node8";

// profiler.startProfiling("", true);
// setTimeout(function () {
//   var profile = profiler.stopProfiling("");
//   console.log(profile);
//   profiler.deleteAllProfiles();
// }, 1000);

const AppDataSource = new DataSource({
  type: "mssql",
  host: "localhost",
  port: 1433,
  username: "sa",
  password: "Mahesh@sa",
  database: "dbe",
  entities: ["entities/*"],
  options: {
    trustServerCertificate: true,
  },
});

AppDataSource.initialize().then(() => {
  console.log("App Data Source has been initialized!");
});

const init = async () => {
  const server = Hapi.server({
    port: 4000,
    host: "localhost",
  });

  await server.register(inert);

  const redisClient = await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

  server.route({
    method: "GET",
    path: "/",
    handler: async (request, h) => {
      return h.file("fetch.html");
    },
  });

  server.route({
    method: "GET",
    path: "/consume",
    handler: async (request, h) => {
      const queue = "test";
      const conn = await amqplib.connect("amqp://localhost");

      const ch = await conn.createChannel();
      await ch.assertQueue(queue);

      ch.consume(queue, (msg) => {
        if (msg !== null) {
          console.log("Received:", msg.content.toString());
          ch.ack(msg);
        } else {
          console.log("Consumer cancelled by server");
        }
      });
      return "Consumer initialized";
    },
  });

  const queue = "orders";
  const conn = await amqplib.connect("amqp://localhost");

  const ch = await conn.createChannel();
  await ch.assertQueue(queue);

  ch.consume(queue, async (msg) => {
    if (msg !== null) {
      console.log("Received:", msg.content.toString());
      ch.ack(msg);
      const [userIdStr, couponIdStr] = msg.content.toString().split(" ");
      const userId = parseInt(userIdStr);
      const user = await AppDataSource.manager.findOneBy(Users, { id: userId });
      const carts = await AppDataSource.manager.find(Carts, {
        where: {
          user: user,
        },
        relations: {
          product: true,
        },
      });
      if (carts.length <= 0) {
        return;
      }
      const order = new Orders();
      order.placedBy = user;
      order.totalamount = 0;
      const placedOrder = await AppDataSource.manager.save(order);
      redisClient.del("order_" + userId);
      console.log(placedOrder);
      order.totalamount = 0;
      for (let cart of carts) {
        const item = new OrderItems();
        item.order = placedOrder;
        item.product = cart.product;
        item.quantity = cart.quantity;
        item.price = cart.product.price * cart.quantity;
        const product = cart.product;
        product.stock -= cart.quantity;
        order.totalamount += item.price;
        await AppDataSource.manager.save(product);
        await redisClient.del("product_" + product.id);
        await AppDataSource.manager.save(item);
        await AppDataSource.manager.remove(cart);
      }
      if (couponIdStr != "") {
        const couponId = parseInt(couponIdStr);
        const coupon = await AppDataSource.manager.findOneBy(Coupons, {
          id: couponId,
        });
        order.totalamount -= order.totalamount * (coupon.percent / 100);
      }
      await AppDataSource.manager.save(order);
      redisClient.del("order_" + userId);
    } else {
      console.log("Consumer cancelled by server");
    }
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

init();

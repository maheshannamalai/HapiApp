import Hapi from "@hapi/hapi";
import inert from "@hapi/inert";
import amqplib from "amqplib";
import { DataSource } from "typeorm";
import { Carts } from "./entities/Carts";
import { OrderItems } from "./entities/OrderItems";
import { Orders } from "./entities/Orders";
import { Users } from "./entities/User";
import { createClient } from "redis";

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
      const userId = parseInt(msg.content.toString());
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
      const placedOrder = await AppDataSource.manager.save(order);
      redisClient.del("order_" + userId);
      console.log(placedOrder);
      for (let cart of carts) {
        const item = new OrderItems();
        item.order = placedOrder;
        item.product = cart.product;
        item.quantity = cart.quantity;
        item.price = cart.product.price * cart.quantity;
        const product = cart.product;
        product.stock -= cart.quantity;
        await AppDataSource.manager.save(product);
        await redisClient.del("product_" + product.id);
        await AppDataSource.manager.save(item);
        await AppDataSource.manager.remove(cart);
      }
    } else {
      console.log("Consumer cancelled by server");
    }
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

init();

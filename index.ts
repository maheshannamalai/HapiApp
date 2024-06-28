import Hapi from "@hapi/hapi";
import Cookie from "@hapi/cookie";
import Joi from "joi";
import inert from "@hapi/inert";
import bcrypt from "bcrypt";
import { Users } from "./entities/User";
import { createClient } from "redis";
import { Orders } from "./entities/Orders";
import { badRequest } from "@hapi/boom";
import amqplib from "amqplib";
import jwt from "jsonwebtoken";
import { jwtscheme } from "./jwtValidateScheme";
import HapiRateLimit from "hapi-rate-limit";
import { getAppDataSource } from "./AppDataSources";
import { logger } from "./logger";
import { createPlugin, getSummary, getContentType } from "@promster/hapi";
import productRoutes from "./routes/products";
import cartRoutes from "./routes/carts";
import chatsRoutes from "./routes/chats";
import { findCouponByCodeAndDate } from "./utils";
import profiler from "v8-profiler-node8";
import fs from "fs";

export const private_key = "maheshutd";

export const location = "USA";

export const redisClient = createClient();
// .on("error", (err) => console.log("Redis Client Error", err))
redisClient.connect();

profiler.startProfiling("", true);
setTimeout(function () {
  var profile = profiler.stopProfiling("");
  profile.export(function (error, result) {
    fs.writeFileSync("profile.json", result);
    profile.delete();
  });
  profiler.deleteAllProfiles();
}, 5000);

export const init = async (port: number) => {
  const server = Hapi.server({
    port,
    host: "localhost",
    // tls: {
    //   key: fs.readFileSync("key.pem"),
    //   cert: fs.readFileSync("cert.pem"),
    // },
    routes: {
      cors: {
        origin: ["http://localhost:4000"],
        credentials: true,
      },
    },
  });

  await server.register(Cookie);
  await server.register(inert);
  await server.register(createPlugin());

  await server.register({
    plugin: HapiRateLimit,
    options: {
      pathLimit: 100,
      userLimit: 200,
      userCache: {
        expiresIn: 60000,
      },
    },
  });

  server.auth.strategy("base", "cookie", {
    cookie: {
      password: "123456789123456789123456789123456789",
      ttl: 24 * 60 * 60 * 1000,
      isSecure: true,
    },
    redirectTo: "/login",
  });

  server.auth.scheme("myjwtvalidatescheme", jwtscheme);
  server.auth.strategy("jwtvalidate", "myjwtvalidatescheme");

  server.route({
    method: "POST",
    path: "/login",
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          password: Joi.string().min(6).max(30),
        }),
      },
    },
    handler: async (request, h) => {
      const AppDataSource = getAppDataSource(location);
      const user = await AppDataSource.manager.findOneBy(Users, {
        name: request.payload["name"],
      });
      if (!user) {
        return h.redirect("/login");
      }
      const result = await bcrypt.compare(
        request.payload["password"],
        user.password
      );
      if (result === true) {
        logger.info("User logged in: " + user);
        const jwttoken = jwt.sign({ userId: user.id }, private_key, {
          expiresIn: 24 * 60 * 60,
        });
        request.cookieAuth.set({ jwttoken });
        return h.redirect("/");
      }
      return h.redirect("/login");
    },
  });

  server.route({
    method: "GET",
    path: "/logout",
    handler: function (request, h) {
      request.cookieAuth.clear();
      logger.info("User logged out");
      return h.redirect("/login");
    },
  });

  server.route({
    method: "GET",
    path: "/login",
    handler: (request, h) => {
      return `
      <html><head><title>Login page</title></head><body>
      <form method="post" action="/login">
        Username: <input type="text" name="name"><br>
        Password: <input type="password" name="password"><br></a>
      <input type="submit" value="Login"></form>
      <p>Click here to  <a href="/signup">sign up</a> <p>
      </body></html>
        `;
    },
  });

  server.route({
    method: "GET",
    path: "/signup",
    handler: (request, h) => {
      return `
      <html><head><title>Signup page</title></head><body>
      <form method="post" action="/signup">
        Username: <input type="text" name="name"><br>
        Password: <input type="password" name="password"><br></a>
      <input type="submit" value="Signup"></form>
      </body></html>
        `;
    },
  });

  server.route({
    method: "POST",
    path: "/signup",
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          password: Joi.string().min(6).max(30),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const hash = await bcrypt.hash(request.payload["password"], 10);
        const user = new Users();
        user.name = request.payload["name"];
        user.password = hash;
        const AppDataSource = getAppDataSource(location);
        await AppDataSource.manager.save(user);
        logger.info("New user signed up: " + JSON.stringify(user));
        return h.redirect("/login");
      } catch (err) {
        logger.error(err);
        return err;
      }
    },
  });

  server.route({
    method: "GET",
    path: "/",
    options: {
      auth: "base",
    },
    handler: (request, h) => {
      return request.auth.credentials;
    },
  });

  // const io = new Server(3002);
  // io.on("connection", (socket) => {
  //   socket.on("join", () => {
  //     console.log("Joining chatroom");
  //     socket.join("chatroom");
  //   });

  //   socket.on("message", (data) => {
  //     socket.to("chatroom").emit("message", data);
  //   });
  // });

  server.route({
    method: "GET",
    path: "/orders",
    options: {
      auth: "jwtvalidate",
    },
    handler: async (request, h) => {
      try {
        const userId = parseInt(request.auth.credentials.userId as string);
        const cachedResult = await redisClient.get(
          location + "_order_" + userId
        );
        if (!cachedResult) {
          logger.info("Cache miss for user order");
          const AppDataSource = getAppDataSource(location);
          const orders = await AppDataSource.manager.find(Orders, {
            where: {
              placedBy: {
                id: userId,
              },
            },
            relations: ["ordersItems", "ordersItems.product"],
          });
          if (!orders) {
            return badRequest("No orders present for the given userId");
          }
          await redisClient.set(
            location + "_order_" + userId,
            JSON.stringify(orders)
          );
          return orders;
        } else {
          logger.info("Cache hit for user order");
          return JSON.parse(cachedResult);
        }
      } catch (err) {
        logger.error(err);
        return err;
      }
    },
  });

  server.route({
    method: "GET",
    path: "/checkout",
    options: {
      auth: "jwtvalidate",
      validate: {
        query: Joi.object({
          coupon: Joi.string().optional(),
        }),
      },
    },
    handler: async (request, h) => {
      const queue = "orders";
      const conn = await amqplib.connect("amqp://localhost");
      let couponId = "";
      if (request.query["coupon"]) {
        const result = await findCouponByCodeAndDate(request.query["coupon"]);
        if (!result) {
          return badRequest("Invalid coupon code");
        }
        result.used = true;
        await getAppDataSource(location).manager.save(result);
        couponId = result.id + "";
      }
      const ch = await conn.createChannel();
      const userId = request.auth.credentials.userId;
      ch.sendToQueue(queue, Buffer.from(userId + " " + couponId));
      logger.info("Order process pushed to queue for the user: " + userId);
      return "order placed successfully";
    },
  });

  server.route({
    method: "GET",
    path: "/check",
    handler: async (request, h) => {
      return "Hello, from port 3000";
    },
  });

  server.route({
    method: "GET",
    path: "/produce",
    handler: async (request, h) => {
      const queue = "test";
      const conn = await amqplib.connect("amqp://localhost");

      const ch = await conn.createChannel();

      setInterval(() => {
        ch.sendToQueue(queue, Buffer.from("Hi"));
      }, 1000);
      return "Producer initialized";
    },
  });

  server.route({
    method: "GET",
    path: "/cat",
    handler: async (request, h) => {
      return h
        .file("cat.jpg", { etagMethod: "simple" })
        .header("Cache-Control", "max-age=36000");
    },
  });

  server.route({
    method: "GET",
    path: "/metrics",
    handler: async (request, h) => {
      return h.response(await getSummary()).type(getContentType());
    },
  });

  server.route([...productRoutes, ...cartRoutes, ...chatsRoutes]);

  await server.start();
  logger.info("Server started on " + server.info.uri);
  console.log("Server running on %s", server.info.uri);

  return server;
};

process.on("unhandledRejection", (err) => {
  logger.info(err);
  process.exit(1);
});

init(3001);
//init(3005);

import Hapi from "@hapi/hapi";
import Cookie from "@hapi/cookie";
import { DataSource } from "typeorm";
import Joi from "joi";
import { getAllOrders, getProductAndReviews, getUser } from "./queries";
import { Server } from "socket.io";
import inert from "@hapi/inert";
import fs from "fs";
import bcrypt from "bcrypt";
import { Users } from "./entities/User";
import { Products } from "./entities/Products";
import { createClient } from "redis";
import { Orders } from "./entities/Orders";
import { badRequest } from "@hapi/boom";

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
  synchronize: true,
});

AppDataSource.initialize().then(() => {
  console.log("App Data Source has been initialized!");
});

export const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
    tls: {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    routes: {
      cors: {
        origin: ["http://localhost:4000"],
        credentials: true,
      },
    },
  });

  const redisClient = await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();
  await server.register(Cookie);
  await server.register(inert);

  server.auth.strategy("base", "cookie", {
    cookie: {
      password: "123456789123456789123456789123456789",
      ttl: 24 * 60 * 60 * 1000,
      isSecure: true,
    },
    redirectTo: "/login",
  });

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
      const user = await getUser(request.payload["name"], AppDataSource);
      if (!user) {
        return h.redirect("/login");
      }
      const result = await bcrypt.compare(
        request.payload["password"],
        user.password
      );
      if (result === true) {
        request.cookieAuth.set({ userId: user.id });
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
      return h.redirect("/login");
    },
  });

  server.route({
    method: "GET",
    path: "/chat1",
    options: {
      auth: "base",
    },
    handler: (request, h) => {
      return h.file("index.html");
    },
  });

  server.route({
    method: "GET",
    path: "/chat2",
    options: {
      auth: "base",
    },
    handler: (request, h) => {
      return h.file("index1.html");
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
      const hash = await bcrypt.hash(request.payload["password"], 10);
      const user = new Users();
      user.name = request.payload["name"];
      user.password = hash;
      await AppDataSource.manager.save(user);
      return h.redirect("/login");
    },
  });

  server.route({
    method: "GET",
    path: "/",
    options: {
      auth: "base",
    },
    handler: (request, h) => {
      return "You'r now logged in";
    },
  });

  // const io = new Server(3001);
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
    path: "/pr",
    handler: async (request, h) => {
      const product = await getProductAndReviews(AppDataSource);
      return JSON.stringify(product);
    },
  });

  server.route({
    method: "GET",
    path: "/orders",
    options: {
      auth: "base",
    },
    handler: async (request, h) => {
      const userId = request.query.userId;
      if (!userId) {
        return badRequest("User id missing!");
      }
      const cachedResult = await redisClient.get("order_" + userId);
      if (!cachedResult) {
        console.log("from db");
        const orders = await AppDataSource.manager.find(Orders, {
          where: {
            placedBy: {
              id: userId,
            },
          },
          relations: {
            ordersItems: true,
          },
        });
        if (!orders) {
          badRequest("No orders present for the given userId");
        }
        await redisClient.set("order_" + userId, JSON.stringify(orders));
        return JSON.stringify(orders);
      } else {
        console.log("from cache");
        return cachedResult;
      }
    },
  });

  server.route({
    method: "GET",
    path: "/check",
    handler: async (request, h) => {
      return "Hello, from port 3000";
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);

  return server;
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

// init();

import Hapi from "@hapi/hapi";
import Cookie from "@hapi/cookie";
import { DataSource } from "typeorm";
import Joi from "joi";
import {
  getAllOrders,
  getProductAndReviews,
  postOrder,
  validateUser,
} from "./queries";
import { Server } from "socket.io";
import inert from "@hapi/inert";
import fs from "fs";
import { join } from "path";

const AppDataSource = new DataSource({
  type: "mssql",
  host: "localhost",
  port: 1433,
  username: "sa",
  password: "Mahesh@sa",
  database: "TestDB",
  entities: ["entities/*"],
  options: {
    trustServerCertificate: true,
  },
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
    tls: {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
  });

  await server.register(Cookie);
  await server.register(inert);

  server.auth.strategy("base", "cookie", {
    cookie: {
      password: "123456789123456789123456789123456789",
      isSecure: false,
      ttl: 24 * 60 * 60 * 1000,
    },
    redirectTo: "/login",
    // validate: async (request, session) => {
    //   const result = await validateUser(
    //     session.name,
    //     session.password,
    //     AppDataSource
    //   );
    //   if (result) {
    //     return { credentials: null, isValid: true };
    //   } else {
    //     return { isValid: false };
    //   }
    // },
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
      const user = await validateUser(
        request.payload["name"],
        request.payload["password"],
        AppDataSource
      );
      if (user) {
        request.cookieAuth.set(user);
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
      </body></html>
        `;
    },
  });

  const io = new Server(3001);
  io.on("connection", (socket) => {
    socket.on("join", () => {
      console.log("Joining chatroom");
      socket.join("chatroom");
    });

    socket.on("message", (data) => {
      socket.to("chatroom").emit("message", data);
    });
  });

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
    handler: async (request, h) => {
      const orders = await getAllOrders(AppDataSource);
      return JSON.stringify(orders);
    },
  });

  server.route({
    method: "POST",
    path: "/orders",
    handler: async (request, h) => {
      const pid = parseInt(request.payload["pid"]);
      const quantity = parseInt(request.payload["quantity"]);
      const oid = parseInt(request.payload["oid"]);
      await postOrder(AppDataSource, pid, quantity, oid);
      return "order placed successfully";
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();

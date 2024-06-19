import { badRequest } from "@hapi/boom";
import { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import { redisClient } from "..";
import { getAppDataSource } from "../AppDataSources";
import { Carts } from "../entities/Carts";
import { Products } from "../entities/Products";
import { Users } from "../entities/User";
import { logger } from "../logger";
import { location } from "..";

const cartRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/cart",
    options: {
      auth: "jwtvalidate",
      validate: {
        query: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      const id = request.query.id;
      const cachedResult = await redisClient.get(location + "_product_" + id);
      let product: Products;
      if (!cachedResult) {
        logger.info("Cache miss for product");
        const AppDataSource = getAppDataSource(location);
        product = await AppDataSource.manager.findOne(Products, {
          where: {
            id,
          },
        });
        if (!product) {
          return badRequest("No such product present");
        }
        await redisClient.set(
          location + "_product_" + id,
          JSON.stringify(product)
        );
      } else {
        logger.info("Cache hit for product");
        product = JSON.parse(cachedResult) as Products;
      }
      if (product.stock <= 0) {
        logger.info("No stocks avaialable");
        return "No stocks available!";
      }
      const userId = parseInt(request.auth.credentials.userId as string);
      const AppDataSource = getAppDataSource(location);
      const user = await AppDataSource.manager.findOneBy(Users, { id: userId });
      const item = await AppDataSource.manager.findOne(Carts, {
        where: {
          user: user,
          product,
        },
      });
      if (!item) {
        const cart = new Carts();
        cart.product = product;
        cart.user = user;
        cart.quantity = 1;
        await AppDataSource.manager.save(cart);
      } else {
        item.quantity += 1;
        await AppDataSource.manager.save(item);
      }
      return "Added successfully to cart";
    },
  },
  {
    method: "DELETE",
    path: "/cart/{id}",
    options: {
      auth: "jwtvalidate",
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      const id = request.params.id;
      const AppDataSource = getAppDataSource(location);
      const cart = await AppDataSource.manager.findOneBy(Carts, { id });
      await AppDataSource.manager.remove(cart);
      return "Item deleted from cart";
    },
  },
  {
    method: "GET",
    path: "/cart",
    options: {
      auth: "jwtvalidate",
    },
    handler: async (request, h) => {
      const userId = parseInt(request.auth.credentials.userId as string);
      const AppDataSource = getAppDataSource(location);
      const carts = await AppDataSource.manager.find(Carts, {
        where: {
          user: {
            id: userId,
          },
        },
        relations: {
          product: true,
        },
      });
      return carts;
    },
  },
];

export default cartRoutes;

import { badRequest } from "@hapi/boom";
import { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import { getAppDataSource } from "../AppDataSources";
import { Products } from "../entities/Products";
import { logger } from "../logger";
import { location, redisClient } from "..";
import { FindManyOptions, Like } from "typeorm";
import validator from "validator";

const productRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/products",
    options: {
      validate: {
        query: Joi.object({
          sortByPrice: Joi.bool().optional(),
          searchKey: Joi.string().optional(),
          category: Joi.string().optional(),
        }),
      },
    },
    handler: async (request, h) => {
      const AppDataSource = getAppDataSource(location);
      const opt: FindManyOptions<Products> = {
        relations: {
          category: true,
        },
      };
      if (request.query["sortByPrice"]) {
        opt["order"] = { price: "ASC" };
      }
      const searchKey = validator.escape(request.query["searchKey"]);
      if (searchKey) {
        opt["where"] = { name: Like(`%${searchKey}%`) };
      }
      const category = request.query["category"];
      if (category) {
        opt["where"] = {
          category: { name: Like(`%${category}%`) },
        };
      }
      const products = await AppDataSource.manager.find(Products, opt);
      return products;
    },
  },
  {
    method: "GET",
    path: "/products/{id}",
    options: {
      auth: "jwtvalidate",
      validate: {
        params: Joi.object({
          id: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const id = request.params.id;
        const cachedResult = await redisClient.get(location + "_product_" + id);
        if (!cachedResult) {
          logger.info("Cache miss for product");
          const AppDataSource = getAppDataSource(location);
          const product = await AppDataSource.manager.findOne(Products, {
            where: {
              id,
            },
            relations: {
              category: true,
            },
          });
          if (!product) {
            return badRequest("No such product present");
          }
          await redisClient.set(
            location + "_product_" + id,
            JSON.stringify(product)
          );
          return product;
        } else {
          logger.info("Cache hit for product");
          return JSON.parse(cachedResult);
        }
      } catch (err) {
        console.log(err);
        logger.error(err);
        return err;
      }
    },
  },
];

export default productRoutes;

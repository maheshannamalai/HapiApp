import { internal } from "@hapi/boom";
import { DataSource } from "typeorm";
import { logger } from "./logger";

export const AppDataSource1 = new DataSource({
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

AppDataSource1.initialize().then(() => {
  logger.info("App Data Source 1 has been initialized!");
});

export const AppDataSource2 = new DataSource({
  type: "mssql",
  host: "localhost",
  port: 1433,
  username: "sa",
  password: "Mahesh@sa",
  database: "dbe2",
  entities: ["entities/*"],
  options: {
    trustServerCertificate: true,
  },
  synchronize: true,
});

AppDataSource2.initialize().then(() => {
  logger.info("App Data Source 2 has been initialized!");
});

export const getAppDataSource = (location: "USA" | "INDIA") => {
  if (!location) {
    throw internal("Internal Server Error");
  }
  logger.info("Inside getAppDataSource");
  if (location === "USA") return AppDataSource1;
  else return AppDataSource2;
};

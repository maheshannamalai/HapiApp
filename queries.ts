import { DataSource } from "typeorm";
import { Users } from "./entities/User";

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

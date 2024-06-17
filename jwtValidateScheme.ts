import { unauthorized } from "@hapi/boom";
import Hapi from "@hapi/hapi";
import jwt, { JwtPayload } from "jsonwebtoken";
import { logger } from "./logger";
import { private_key } from ".";

export const jwtscheme = (server: Hapi.Server, options: any) => {
  return {
    authenticate: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      const result = validateRequest(request.headers.authorization);

      if (!result.isValid) {
        return h.unauthenticated(
          unauthorized("You are unauthorized to perform this action!")
        );
      }

      return h.authenticated({ credentials: result });
    },
  };
};

const validateRequest = (authHeader: string) => {
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const jwttoken = authHeader.split(" ")[1];
      const decoded = jwt.verify(jwttoken, private_key) as JwtPayload;
      return { isValid: true, userId: decoded.userId };
    } catch (err) {
      logger.error(err);
      return { isValid: false };
    }
  }
  return { isValid: false };
};

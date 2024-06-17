import { createLogger, transports, format } from "winston";
import fs from "fs";
import path from "path";

const logDirectory = path.resolve(__dirname, "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(logDirectory, "combined.log") }),
    new transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
  ],
});

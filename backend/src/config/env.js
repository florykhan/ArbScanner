import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*"
};

export default env;

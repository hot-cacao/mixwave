import { createClient } from "redis";
import { env } from "./env";

export const client = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

await client.connect();

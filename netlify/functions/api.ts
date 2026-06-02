import type { Config } from "@netlify/functions";
import app from "../../app/api/boot";

export default async (req: Request) => {
  return app.fetch(req);
};

export const config: Config = {
  path: ["/api/*"],
};

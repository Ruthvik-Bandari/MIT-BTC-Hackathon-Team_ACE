import { Router, type Request, type Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "satsguard-guardian-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

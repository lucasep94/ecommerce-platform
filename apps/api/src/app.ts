import { env } from "./lib/env";
import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.routes";
import { productsRouter } from "./routes/products.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { ordersRouter } from "./routes/orders.routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/auth", authLimiter);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/orders", ordersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

export default app;

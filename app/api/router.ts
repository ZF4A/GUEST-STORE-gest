import { employeeAuthRouter } from "./employee-auth-router";
import { dashboardRouter } from "./dashboard-router";
import { categoryRouter } from "./category-router";
import { productRouter } from "./product-router";
import { variantRouter } from "./variant-router";
import { inventoryRouter } from "./inventory-router";
import { employeeRouter } from "./employee-router";
import { salesRouter } from "./sales-router";
import { auditRouter } from "./audit-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: employeeAuthRouter,
  dashboard: dashboardRouter,
  category: categoryRouter,
  product: productRouter,
  variant: variantRouter,
  inventory: inventoryRouter,
  employee: employeeRouter,
  sales: salesRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;

import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sales, inventory, employees, stores, products, categories } from "@db/schema";
import { eq, and, gte, lt, lte, sql, desc, count } from "drizzle-orm";

export const dashboardRouter = createRouter({
  kpis: adminQuery.query(async () => {
    const db = getDb();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Today's revenue
    const todaySales = await db
      .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
      .from(sales)
      .where(gte(sales.createdAt, todayStart));
    const todayRevenue = todaySales[0]?.total ?? 0;

    // Yesterday's revenue
    const yesterdaySales = await db
      .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
      .from(sales)
      .where(and(gte(sales.createdAt, yesterdayStart), lt(sales.createdAt, todayStart)));
    const yesterdayRevenue = yesterdaySales[0]?.total ?? 0;

    // Today's sales count
    const todayCount = await db
      .select({ count: count() })
      .from(sales)
      .where(gte(sales.createdAt, todayStart));
    const todaySalesCount = todayCount[0]?.count ?? 0;

    // Low stock count
    const lowStock = await db
      .select({ count: count() })
      .from(inventory)
      .where(lte(inventory.quantity, 5));
    const lowStockCount = lowStock[0]?.count ?? 0;

    // Active employees
    const activeEmp = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.isActive, 1));
    const activeEmployeeCount = activeEmp[0]?.count ?? 0;

    return {
      todayRevenue,
      yesterdayRevenue,
      todaySalesCount,
      lowStockCount,
      activeEmployeeCount,
    };
  }),

  revenueChart: adminQuery
    .input(z.object({ period: z.enum(["week", "month"]).default("week") }))
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const days = input.period === "week" ? 7 : 30;

      const results = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const yaoundeSales = await db
          .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales)
          .where(
            and(
              gte(sales.createdAt, dayStart),
              lt(sales.createdAt, dayEnd),
              eq(sales.storeId, 1)
            )
          );

        const kribiSales = await db
          .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
          .from(sales)
          .where(
            and(
              gte(sales.createdAt, dayStart),
              lt(sales.createdAt, dayEnd),
              eq(sales.storeId, 2)
            )
          );

        results.push({
          date: dayStart.toISOString().split("T")[0],
          yaounde: yaoundeSales[0]?.total ?? 0,
          kribi: kribiSales[0]?.total ?? 0,
        });
      }

      return results;
    }),

  salesByStore: adminQuery
    .input(z.object({ period: z.enum(["today", "week", "month"]).default("today") }))
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      let startDate: Date;

      if (input.period === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (input.period === "week") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
      }

      const yaoundeSales = await db
        .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
        .from(sales)
        .where(and(gte(sales.createdAt, startDate), eq(sales.storeId, 1)));

      const kribiSales = await db
        .select({ total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)` })
        .from(sales)
        .where(and(gte(sales.createdAt, startDate), eq(sales.storeId, 2)));

      return {
        yaounde: yaoundeSales[0]?.total ?? 0,
        kribi: kribiSales[0]?.total ?? 0,
      };
    }),

  recentSales: adminQuery
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = getDb();

      const recent = await db
        .select({
          id: sales.id,
          createdAt: sales.createdAt,
          employeeName: employees.name,
          employeeId: employees.employeeId,
          storeName: stores.name,
          totalAmount: sales.totalAmount,
        })
        .from(sales)
        .leftJoin(employees, eq(sales.employeeId, employees.id))
        .leftJoin(stores, eq(sales.storeId, stores.id))
        .orderBy(desc(sales.createdAt))
        .limit(input.limit);

      return recent;
    }),

  lowStock: adminQuery
    .input(z.object({ threshold: z.number().default(5) }))
    .query(async ({ input }) => {
      const db = getDb();

      const low = await db
        .select({
          productId: inventory.productId,
          productName: products.name,
          categoryName: categories.name,
          storeName: stores.name,
          quantity: inventory.quantity,
        })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(stores, eq(inventory.storeId, stores.id))
        .where(lte(inventory.quantity, input.threshold))
        .orderBy(inventory.quantity);

      return low;
    }),

  employeePerformance: adminQuery
    .input(
      z.object({
        period: z.enum(["week", "month"]).default("week"),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const startDate = new Date(now);
      if (input.period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      const performance = await db
        .select({
          employeeId: employees.employeeId,
          employeeName: employees.name,
          salesCount: count(),
          totalRevenue: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        })
        .from(sales)
        .leftJoin(employees, eq(sales.employeeId, employees.id))
        .where(gte(sales.createdAt, startDate))
        .groupBy(employees.id, employees.employeeId, employees.name)
        .orderBy(desc(count()))
        .limit(input.limit);

      return performance;
    }),
});



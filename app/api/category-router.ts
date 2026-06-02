import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories, products } from "@db/schema";
import { eq, count } from "drizzle-orm";
import { logAction } from "./queries/audit";

export const categoryRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    const cats = await db.select().from(categories);

    const result = [];
    for (const cat of cats) {
      const productCount = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.categoryId, cat.id));

      result.push({
        id: cat.id,
        name: cat.name,
        productCount: productCount[0]?.count ?? 0,
      });
    }

    return result;
  }),

  create: adminQuery
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(categories).values({ name: input.name }).returning({ id: categories.id });
      const newCat = await db.select().from(categories).where(eq(categories.id, result[0].id)).limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "CATEGORY_CREATED",
        description: `Category "${input.name}" created`,
      });

      return newCat[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const productCount = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.categoryId, input.id));

      if ((productCount[0]?.count ?? 0) > 0) {
        throw new Error("Cannot delete category with existing products");
      }

      const cat = await db.select().from(categories).where(eq(categories.id, input.id)).limit(1);
      await db.delete(categories).where(eq(categories.id, input.id));

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "CATEGORY_DELETED",
        description: `Category "${cat[0]?.name}" deleted`,
      });

      return { success: true };
    }),
});

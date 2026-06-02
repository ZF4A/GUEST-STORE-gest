import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { inventory, products, categories, stores } from "@db/schema";
import { eq, like, and, asc } from "drizzle-orm";
import { logAction } from "./queries/audit";

export const inventoryRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.number().optional(),
        storeId: z.number().optional(),
        lowStock: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Employees can only see their own store
      const effectiveStoreId =
        ctx.employee.role === "EMPLOYEE"
          ? ctx.employee.storeId ?? undefined
          : input.storeId;

      const items = await db
        .select({
          productId: products.id,
          productName: products.name,
          categoryName: categories.name,
          price: products.price,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(input.search ? like(products.name, `%${input.search}%`) : undefined)
        .orderBy(asc(products.name));

      const result = [];
      for (const item of items) {
        const yaoundeStock = await db
          .select()
          .from(inventory)
          .where(and(eq(inventory.productId, item.productId), eq(inventory.storeId, 1)))
          .limit(1);

        const kribiStock = await db
          .select()
          .from(inventory)
          .where(and(eq(inventory.productId, item.productId), eq(inventory.storeId, 2)))
          .limit(1);

        const yaoundeQty = yaoundeStock[0]?.quantity ?? 0;
        const kribiQty = kribiStock[0]?.quantity ?? 0;
        const totalQty = yaoundeQty + kribiQty;

        let status: "In Stock" | "Low" | "Out of Stock" = "In Stock";
        if (totalQty === 0) status = "Out of Stock";
        else if (totalQty <= 5) status = "Low";

        // Filter by low stock if requested
        if (input.lowStock && totalQty > 5) continue;

        // Filter by store if requested
        if (effectiveStoreId) {
          const storeQty = effectiveStoreId === 1 ? yaoundeQty : kribiQty;
          if (storeQty === 0 && !input.lowStock) continue;
        }

        result.push({
          ...item,
          yaoundeQty,
          kribiQty,
          totalQty,
          status,
        });
      }

      return result;
    }),

  update: adminQuery
    .input(
      z.object({
        productId: z.number(),
        storeId: z.number(),
        quantity: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, input.productId),
            eq(inventory.storeId, input.storeId)
          )
        )
        .limit(1);

      const oldQty = existing[0]?.quantity ?? 0;

      if (existing.length > 0) {
        await db
          .update(inventory)
          .set({ quantity: input.quantity })
          .where(
            and(
              eq(inventory.productId, input.productId),
              eq(inventory.storeId, input.storeId)
            )
          );
      } else {
        await db.insert(inventory).values({
          productId: input.productId,
          storeId: input.storeId,
          quantity: input.quantity,
        });
      }

      const store = await db
        .select()
        .from(stores)
        .where(eq(stores.id, input.storeId))
        .limit(1);

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "STOCK_UPDATE",
        description: `Stock updated for "${product[0]?.name}" at ${store[0]?.name}: ${oldQty} → ${input.quantity}`,
        storeId: input.storeId,
      });

      return { success: true, newQuantity: input.quantity };
    }),

  addStock: adminQuery
    .input(
      z.object({
        productId: z.number(),
        storeId: z.number(),
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, input.productId),
            eq(inventory.storeId, input.storeId)
          )
        )
        .limit(1);

      const oldQty = existing[0]?.quantity ?? 0;
      const newQty = Math.max(0, oldQty + input.amount);

      if (existing.length > 0) {
        await db
          .update(inventory)
          .set({ quantity: newQty })
          .where(
            and(
              eq(inventory.productId, input.productId),
              eq(inventory.storeId, input.storeId)
            )
          );
      } else {
        await db.insert(inventory).values({
          productId: input.productId,
          storeId: input.storeId,
          quantity: newQty,
        });
      }

      const store = await db
        .select()
        .from(stores)
        .where(eq(stores.id, input.storeId))
        .limit(1);

      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "STOCK_UPDATE",
        description: `Stock ${input.amount >= 0 ? "added" : "removed"} for "${product[0]?.name}" at ${store[0]?.name}: ${oldQty} → ${newQty}`,
        storeId: input.storeId,
      });

      return { success: true, newQuantity: newQty };
    }),
});

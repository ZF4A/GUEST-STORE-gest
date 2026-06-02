import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { productVariants, variantInventory, inventory } from "@db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logAction } from "./queries/audit";

export const variantRouter = createRouter({
  // List all color variants for a product, with per-store quantities
  list: authedQuery
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, input.productId))
        .orderBy(productVariants.createdAt);

      const result = [];
      for (const v of variants) {
        const stock = await db
          .select()
          .from(variantInventory)
          .where(eq(variantInventory.variantId, v.id));
        const yaoundeQty = stock.find((s) => s.storeId === 1)?.quantity ?? 0;
        const kribiQty = stock.find((s) => s.storeId === 2)?.quantity ?? 0;
        result.push({ ...v, yaoundeQty, kribiQty, totalQty: yaoundeQty + kribiQty });
      }
      return result;
    }),

  // Add or update a color variant
  upsert: adminQuery
    .input(
      z.object({
        id: z.number().optional(),
        productId: z.number(),
        colorName: z.string().min(1).max(60),
        colorHex: z.string().default("#888888"),
        yaoundeQty: z.number().min(0).default(0),
        kribiQty: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      let variantId: number;

      if (input.id) {
        await db
          .update(productVariants)
          .set({ colorName: input.colorName, colorHex: input.colorHex })
          .where(eq(productVariants.id, input.id));
        variantId = input.id;
      } else {
        const result = await db
          .insert(productVariants)
          .values({ productId: input.productId, colorName: input.colorName, colorHex: input.colorHex, createdAt: new Date() })
          .returning({ id: productVariants.id });
        variantId = result[0].id;
      }

      // Upsert inventory for store 1 (Yaoundé)
      const e1 = await db.select().from(variantInventory)
        .where(and(eq(variantInventory.variantId, variantId), eq(variantInventory.storeId, 1))).limit(1);
      if (e1.length > 0) {
        await db.update(variantInventory).set({ quantity: input.yaoundeQty, updatedAt: new Date() })
          .where(and(eq(variantInventory.variantId, variantId), eq(variantInventory.storeId, 1)));
      } else {
        await db.insert(variantInventory).values({ variantId, storeId: 1, quantity: input.yaoundeQty, updatedAt: new Date() });
      }

      // Upsert inventory for store 2 (Kribi)
      const e2 = await db.select().from(variantInventory)
        .where(and(eq(variantInventory.variantId, variantId), eq(variantInventory.storeId, 2))).limit(1);
      if (e2.length > 0) {
        await db.update(variantInventory).set({ quantity: input.kribiQty, updatedAt: new Date() })
          .where(and(eq(variantInventory.variantId, variantId), eq(variantInventory.storeId, 2)));
      } else {
        await db.insert(variantInventory).values({ variantId, storeId: 2, quantity: input.kribiQty, updatedAt: new Date() });
      }

      // Sync base inventory totals (so the rest of the system stays consistent)
      await syncBaseInventory(db, input.productId);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: input.id ? "VARIANT_UPDATED" : "VARIANT_CREATED",
        description: `Color "${input.colorName}" ${input.id ? "updated" : "added"} for product #${input.productId}`,
      });

      return { success: true, variantId };
    }),

  // Delete a color variant
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const variant = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, input.id))
        .limit(1);

      await db.delete(variantInventory).where(eq(variantInventory.variantId, input.id));
      await db.delete(productVariants).where(eq(productVariants.id, input.id));

      if (variant[0]) {
        await syncBaseInventory(db, variant[0].productId);
      }

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "VARIANT_DELETED",
        description: `Color "${variant[0]?.colorName}" deleted`,
      });

      return { success: true };
    }),
});

// Keep base inventory in sync with sum of variant quantities
async function syncBaseInventory(db: ReturnType<typeof getDb>, productId: number) {
  const variants = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  if (variants.length === 0) return;
  const variantIds = variants.map((v) => v.id);

  for (const storeId of [1, 2]) {
    const allStock = await db
      .select()
      .from(variantInventory)
      .where(and(eq(variantInventory.storeId, storeId), inArray(variantInventory.variantId, variantIds)));
    const total = allStock.reduce((s, r) => s + r.quantity, 0);

    const existing = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.productId, productId), eq(inventory.storeId, storeId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(inventory).set({ quantity: total }).where(
        and(eq(inventory.productId, productId), eq(inventory.storeId, storeId))
      );
    } else {
      await db.insert(inventory).values({ productId, storeId, quantity: total });
    }
  }
}

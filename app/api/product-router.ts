import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, inventory, categories, saleItems, productVariants, variantInventory } from "@db/schema";
import { eq, like, and, desc, count, inArray } from "drizzle-orm";
import { logAction } from "./queries/audit";

export const productRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        categoryId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.search) {
        conditions.push(like(products.name, `%${input.search}%`));
      }
      if (input.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select({
          id: products.id,
          name: products.name,
          categoryId: products.categoryId,
          categoryName: categories.name,
          price: products.price,
          imageUrl: products.imageUrl,
          createdAt: products.createdAt,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(products)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;

      // Get inventory + variants for each product
      const itemsWithStock = [];
      for (const item of items) {
        const stock = await db
          .select()
          .from(inventory)
          .where(eq(inventory.productId, item.id));

        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, item.id))
          .orderBy(productVariants.createdAt);

        const variantData = [];
        for (const v of variants) {
          const vStock = await db
            .select()
            .from(variantInventory)
            .where(eq(variantInventory.variantId, v.id));
          variantData.push({
            id: v.id,
            colorName: v.colorName,
            colorHex: v.colorHex,
            yaoundeQty: vStock.find((s) => s.storeId === 1)?.quantity ?? 0,
            kribiQty: vStock.find((s) => s.storeId === 2)?.quantity ?? 0,
            totalQty: vStock.reduce((s, r) => s + r.quantity, 0),
          });
        }

        const yaoundeQty = stock.find((s) => s.storeId === 1)?.quantity ?? 0;
        const kribiQty = stock.find((s) => s.storeId === 2)?.quantity ?? 0;

        itemsWithStock.push({
          ...item,
          yaoundeQty,
          kribiQty,
          totalQty: yaoundeQty + kribiQty,
          variants: variantData,
        });
      }

      return {
        items: itemsWithStock,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const product = await db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, input.id))
        .limit(1);

      if (product.length === 0) return null;

      const stock = await db
        .select()
        .from(inventory)
        .where(eq(inventory.productId, input.id));

      return {
        ...product[0].products,
        categoryName: product[0].categories?.name,
        yaoundeQty: stock.find((s) => s.storeId === 1)?.quantity ?? 0,
        kribiQty: stock.find((s) => s.storeId === 2)?.quantity ?? 0,
      };
    }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        categoryId: z.number(),
        price: z.number().min(0),
        imageUrl: z.string().optional(),
        yaoundeStock: z.number().default(0),
        kribiStock: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const result = await db
        .insert(products)
        .values({
          name: input.name,
          categoryId: input.categoryId,
          price: input.price,
          imageUrl: input.imageUrl,
        })
        .returning({ id: products.id });

      const productId = result[0].id;

      // Create inventory for both stores
      await db.insert(inventory).values([
        { productId, storeId: 1, quantity: input.yaoundeStock },
        { productId, storeId: 2, quantity: input.kribiStock },
      ]);

      const newProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "PRODUCT_CREATED",
        description: `Product "${input.name}" created`,
      });

      return newProduct[0];
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        categoryId: z.number().optional(),
        price: z.number().min(0).optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;

      await db.update(products).set(updateData).where(eq(products.id, id));

      const updated = await db.select().from(products).where(eq(products.id, id)).limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "PRODUCT_UPDATED",
        description: `Product "${updated[0]?.name}" updated`,
      });

      return updated[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const hasSales = await db
        .select({ count: count() })
        .from(saleItems)
        .where(eq(saleItems.productId, input.id));

      if ((hasSales[0]?.count ?? 0) > 0) {
        throw new Error("Cannot delete product with existing sales");
      }

      const product = await db.select().from(products).where(eq(products.id, input.id)).limit(1);

      // Delete variants and their inventory
      const variants = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, input.id));
      if (variants.length > 0) {
        const variantIds = variants.map((v) => v.id);
        await db.delete(variantInventory).where(inArray(variantInventory.variantId, variantIds));
        await db.delete(productVariants).where(eq(productVariants.productId, input.id));
      }
      // Delete base inventory and product
      await db.delete(inventory).where(eq(inventory.productId, input.id));
      await db.delete(products).where(eq(products.id, input.id));

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "PRODUCT_DELETED",
        description: `Product "${product[0]?.name}" deleted`,
      });

      return { success: true };
    }),
});

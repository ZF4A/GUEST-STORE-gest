import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sales, saleItems, inventory, products, employees, stores } from "@db/schema";
import { eq, and, gte, lt, desc, count } from "drizzle-orm";
import { logAction } from "./queries/audit";
import { TRPCError } from "@trpc/server";

export const salesRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().min(1),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Employee must have a store
      const storeId = ctx.employee.storeId;
      if (!storeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Employee not assigned to a store",
        });
      }

      // Validate products and check stock
      const productDetails = [];
      for (const item of input.items) {
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Product ${item.productId} not found`,
          });
        }

        const stock = await db
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.productId, item.productId),
              eq(inventory.storeId, storeId)
            )
          )
          .limit(1);

        const availableQty = stock[0]?.quantity ?? 0;
        if (availableQty < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient stock for "${product[0].name}". Available: ${availableQty}, Requested: ${item.quantity}`,
          });
        }

        productDetails.push({
          ...product[0],
          requestedQty: item.quantity,
          unitPrice: product[0].price,
        });
      }

      // Calculate total
      const totalAmount = productDetails.reduce(
        (sum, p) => sum + p.unitPrice * p.requestedQty,
        0
      );

      // Execute transaction
      const saleResult = await db.insert(sales).values({
        employeeId: ctx.employee.id,
        storeId,
        totalAmount,
      }).returning({ id: sales.id });

      const saleId = saleResult[0].id;

      for (const item of input.items) {
        const product = productDetails.find((p) => p.id === item.productId)!;

        await db.insert(saleItems).values({
          saleId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.unitPrice,
        });

        // Decrement stock
        const currentStock = await db
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.productId, item.productId),
              eq(inventory.storeId, storeId)
            )
          )
          .limit(1);

        if (currentStock.length > 0) {
          await db
            .update(inventory)
            .set({ quantity: currentStock[0].quantity - item.quantity })
            .where(
              and(
                eq(inventory.productId, item.productId),
                eq(inventory.storeId, storeId)
              )
            );
        }
      }

      // Log the sale
      const itemDescriptions = productDetails
        .map((p) => `${p.requestedQty}x ${p.name}`)
        .join(", ");

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "SALE",
        description: `${ctx.employee.name} (${ctx.employee.employeeId}) sold: ${itemDescriptions}`,
        storeId,
      });

      return {
        saleId,
        totalAmount,
        items: productDetails.map((p) => ({
          productName: p.name,
          quantity: p.requestedQty,
          unitPrice: p.unitPrice,
          subtotal: p.unitPrice * p.requestedQty,
        })),
      };
    }),

  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        storeId: z.number().optional(),
        employeeId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.storeId) conditions.push(eq(sales.storeId, input.storeId));
      if (input.employeeId) conditions.push(eq(sales.employeeId, input.employeeId));
      if (input.startDate) conditions.push(gte(sales.createdAt, input.startDate));
      if (input.endDate) conditions.push(lt(sales.createdAt, input.endDate));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select({
          id: sales.id,
          createdAt: sales.createdAt,
          totalAmount: sales.totalAmount,
          employeeId: sales.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeId,
          storeName: stores.name,
        })
        .from(sales)
        .leftJoin(employees, eq(sales.employeeId, employees.id))
        .leftJoin(stores, eq(sales.storeId, stores.id))
        .where(whereClause)
        .orderBy(desc(sales.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(sales)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;

      return {
        items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  mySales: authedQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [eq(sales.employeeId, ctx.employee.id)];
      if (input.startDate) conditions.push(gte(sales.createdAt, input.startDate));
      if (input.endDate) conditions.push(lt(sales.createdAt, input.endDate));

      const items = await db
        .select({
          id: sales.id,
          createdAt: sales.createdAt,
          totalAmount: sales.totalAmount,
          storeName: stores.name,
        })
        .from(sales)
        .leftJoin(stores, eq(sales.storeId, stores.id))
        .where(and(...conditions))
        .orderBy(desc(sales.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(sales)
        .where(and(...conditions));
      const total = totalResult[0]?.count ?? 0;

      return {
        items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const sale = await db
        .select()
        .from(sales)
        .leftJoin(employees, eq(sales.employeeId, employees.id))
        .leftJoin(stores, eq(sales.storeId, stores.id))
        .where(eq(sales.id, input.id))
        .limit(1);

      if (sale.length === 0) return null;

      const items = await db
        .select({
          productName: products.name,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
        })
        .from(saleItems)
        .leftJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, input.id));

      return {
        ...sale[0].sales,
        employeeName: sale[0].employees?.name,
        employeeCode: sale[0].employees?.employeeId,
        storeName: sale[0].stores?.name,
        items,
      };
    }),
});

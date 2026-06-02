import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { auditLogs, stores } from "@db/schema";
import { eq, and, gte, lt, desc, count } from "drizzle-orm";

export const auditRouter = createRouter({
  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        action: z.string().optional(),
        employeeId: z.number().optional(),
        storeId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.action) conditions.push(eq(auditLogs.action, input.action));
      if (input.employeeId) conditions.push(eq(auditLogs.actorId, input.employeeId));
      if (input.storeId) conditions.push(eq(auditLogs.storeId, input.storeId));
      if (input.startDate) conditions.push(gte(auditLogs.createdAt, input.startDate));
      if (input.endDate) conditions.push(lt(auditLogs.createdAt, input.endDate));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select({
          id: auditLogs.id,
          actorId: auditLogs.actorId,
          actorName: auditLogs.actorName,
          actorRole: auditLogs.actorRole,
          action: auditLogs.action,
          description: auditLogs.description,
          storeName: stores.name,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(stores, eq(auditLogs.storeId, stores.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(auditLogs)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;

      return { items, total, page: input.page, totalPages: Math.ceil(total / input.limit) };
    }),
});

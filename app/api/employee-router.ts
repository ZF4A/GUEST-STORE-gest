import { z } from "zod";
import { hash } from "bcryptjs";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { employees, stores, sales } from "@db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { logAction } from "./queries/audit";

function generateEmployeeId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${year}-${random}`;
}

export const employeeRouter = createRouter({
  list: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        storeId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [eq(employees.isActive, 1)];
      if (input.search) {
        conditions.push(
          sql`${employees.name} LIKE ${`%${input.search}%`} OR ${employees.employeeId} LIKE ${`%${input.search}%`}`
        );
      }
      if (input.storeId) {
        conditions.push(eq(employees.storeId, input.storeId));
      }

      const emps = await db
        .select({
          id: employees.id,
          employeeId: employees.employeeId,
          name: employees.name,
          email: employees.email,
          storeId: employees.storeId,
          storeName: stores.name,
          isActive: employees.isActive,
          createdAt: employees.createdAt,
        })
        .from(employees)
        .leftJoin(stores, eq(employees.storeId, stores.id))
        .where(and(...conditions))
        .orderBy(desc(employees.createdAt));

      const result = [];
      for (const emp of emps) {
        const salesCount = await db
          .select({ count: count() })
          .from(sales)
          .where(eq(sales.employeeId, emp.id));

        result.push({
          ...emp,
          salesCount: salesCount[0]?.count ?? 0,
        });
      }

      return result;
    }),

  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const emp = await db
        .select()
        .from(employees)
        .leftJoin(stores, eq(employees.storeId, stores.id))
        .where(eq(employees.id, input.id))
        .limit(1);

      if (emp.length === 0) return null;

      const employee = emp[0];

      // Recent sales
      const recentSales = await db
        .select()
        .from(sales)
        .where(eq(sales.employeeId, input.id))
        .orderBy(desc(sales.createdAt))
        .limit(10);

      return {
        ...employee.employees,
        storeName: employee.stores?.name ?? null,
        recentSales,
      };
    }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email(),
        password: z.string().min(8),
        storeId: z.number(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Check email uniqueness
      const existing = await db
        .select()
        .from(employees)
        .where(eq(employees.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Email already in use");
      }

      // Generate unique employee ID
      let employeeId = generateEmployeeId();
      let idExists = true;
      let attempts = 0;
      while (idExists && attempts < 10) {
        const check = await db
          .select()
          .from(employees)
          .where(eq(employees.employeeId, employeeId))
          .limit(1);
        idExists = check.length > 0;
        if (idExists) {
          employeeId = generateEmployeeId();
        }
        attempts++;
      }

      const passwordHash = await hash(input.password, 12);

      const result = await db.insert(employees).values({
        employeeId,
        name: input.name,
        email: input.email,
        passwordHash,
        role: "EMPLOYEE",
        storeId: input.storeId,
        phone: input.phone ?? null,
        language: "EN",
        isActive: 1,
      }).returning({ id: employees.id });

      const newEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, result[0].id))
        .limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "EMPLOYEE_CREATED",
        description: `Employee ${employeeId} (${input.name}) created`,
        storeId: input.storeId,
      });

      return newEmployee[0];
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        storeId: z.number().optional(),
        phone: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;

      await db.update(employees).set(updateData).where(eq(employees.id, id));

      const updated = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id))
        .limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "EMPLOYEE_UPDATED",
        description: `Employee ${updated[0]?.employeeId} (${updated[0]?.name}) updated`,
      });

      return updated[0];
    }),

  resetPassword: adminQuery
    .input(z.object({ id: z.number(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const newHash = await hash(input.newPassword, 12);
      await db
        .update(employees)
        .set({ passwordHash: newHash })
        .where(eq(employees.id, input.id));

      const emp = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.id))
        .limit(1);

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "PASSWORD_CHANGED",
        description: `Password reset for employee ${emp[0]?.employeeId} (${emp[0]?.name})`,
      });

      return { success: true };
    }),
});

import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { employees } from "@db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "./lib/jwt";
import { TRPCError } from "@trpc/server";
import { logAction } from "./queries/audit";

export const employeeAuthRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const emp = await db
        .select()
        .from(employees)
        .where(eq(employees.email, input.email))
        .limit(1);

      if (emp.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const employee = emp[0];

      if (!employee.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Account deactivated",
        });
      }

      const valid = await compare(input.password, employee.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = await signToken({
        id: employee.id,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
      });

      await logAction({
        actorId: employee.id,
        actorName: employee.name,
        actorRole: employee.role as "ADMIN" | "EMPLOYEE",
        action: "LOGIN",
        description: `${employee.name} (${employee.employeeId}) logged in`,
        storeId: employee.storeId ?? undefined,
      });

      return {
        token,
        user: {
          id: employee.id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          storeId: employee.storeId,
          language: employee.language,
        },
      };
    }),

  me: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const emp = await db
      .select()
      .from(employees)
      .where(eq(employees.id, ctx.employee.id))
      .limit(1);

    if (emp.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const e = emp[0];
    return {
      id: e.id,
      employeeId: e.employeeId,
      name: e.name,
      email: e.email,
      role: e.role,
      storeId: e.storeId,
      language: e.language,
      phone: e.phone,
    };
  }),

  changePassword: authedQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const emp = await db
        .select()
        .from(employees)
        .where(eq(employees.id, ctx.employee.id))
        .limit(1);

      if (emp.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const valid = await compare(input.currentPassword, emp[0].passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect",
        });
      }

      const newHash = await hash(input.newPassword, 12);
      await db
        .update(employees)
        .set({ passwordHash: newHash })
        .where(eq(employees.id, ctx.employee.id));

      await logAction({
        actorId: ctx.employee.id,
        actorName: ctx.employee.name,
        actorRole: ctx.employee.role,
        action: "PASSWORD_CHANGED",
        description: `${ctx.employee.name} changed their password`,
        storeId: ctx.employee.storeId ?? undefined,
      });

      return { success: true };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    await logAction({
      actorId: ctx.employee.id,
      actorName: ctx.employee.name,
      actorRole: ctx.employee.role,
      action: "LOGOUT",
      description: `${ctx.employee.name} (${ctx.employee.employeeId}) logged out`,
      storeId: ctx.employee.storeId ?? undefined,
    });
    return { success: true };
  }),

  updateLanguage: authedQuery
    .input(z.object({ language: z.enum(["EN", "FR"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(employees)
        .set({ language: input.language })
        .where(eq(employees.id, ctx.employee.id));

      return { success: true };
    }),
});

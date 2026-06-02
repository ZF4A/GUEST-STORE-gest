import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { employees } from "@db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => {
    return opts.ctx.employee;
  }),
  logout: authedQuery.mutation(async () => {
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

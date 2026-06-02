import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/jwt";
import { getDb } from "./queries/connection";
import { employees, stores } from "@db/schema";
import { eq } from "drizzle-orm";

export type EmployeeContext = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  storeId: number | null;
  storeName: string | null;
  language: "EN" | "FR";
  phone: string | null;
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  employee?: EmployeeContext;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  try {
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = await verifyToken(token);
      if (payload) {
        const db = getDb();
        const emp = await db
          .select()
          .from(employees)
          .where(eq(employees.id, payload.id))
          .limit(1);

        if (emp.length > 0 && emp[0].isActive) {
          const store = emp[0].storeId
            ? await db
                .select()
                .from(stores)
                .where(eq(stores.id, emp[0].storeId))
                .limit(1)
            : [];

          ctx.employee = {
            id: emp[0].id,
            employeeId: emp[0].employeeId,
            name: emp[0].name,
            email: emp[0].email,
            role: emp[0].role as "ADMIN" | "EMPLOYEE",
            storeId: emp[0].storeId ?? null,
            storeName: store.length > 0 ? store[0].name : null,
            language: emp[0].language as "EN" | "FR",
            phone: emp[0].phone ?? null,
          };
        }
      }
    }
  } catch {
    // Authentication is optional
  }

  return ctx;
}

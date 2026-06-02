import { getDb } from "./connection";
import { auditLogs } from "@db/schema";

export async function logAction(data: {
  actorId?: number;
  actorName: string;
  actorRole: "ADMIN" | "EMPLOYEE";
  action: string;
  description: string;
  storeId?: number;
}) {
  const db = getDb();
  await db.insert(auditLogs).values({
    actorId: data.actorId ?? null,
    actorName: data.actorName,
    actorRole: data.actorRole,
    action: data.action,
    description: data.description,
    storeId: data.storeId ?? null,
  });
}

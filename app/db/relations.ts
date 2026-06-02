import { relations } from "drizzle-orm";
import { stores, categories, employees, products, inventory, sales, saleItems, auditLogs } from "./schema";

export const storesRelations = relations(stores, ({ many }) => ({
  employees: many(employees),
  inventory: many(inventory),
  sales: many(sales),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  store: one(stores, { fields: [employees.storeId], references: [stores.id] }),
  sales: many(sales),
  auditLogs: many(auditLogs),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  inventory: many(inventory),
  saleItems: many(saleItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
  store: one(stores, { fields: [inventory.storeId], references: [stores.id] }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  employee: one(employees, { fields: [sales.employeeId], references: [employees.id] }),
  store: one(stores, { fields: [sales.storeId], references: [stores.id] }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(employees, { fields: [auditLogs.actorId], references: [employees.id] }),
  store: one(stores, { fields: [auditLogs.storeId], references: [stores.id] }),
}));

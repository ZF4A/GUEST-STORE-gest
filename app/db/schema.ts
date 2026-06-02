import {
  pgTable, text, integer, serial, timestamp, uniqueIndex, index,
} from "drizzle-orm/pg-core";

const now = () => new Date();

export const stores = pgTable("stores", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull().unique(),
  city:      text("city").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(now),
});
export type Store = typeof stores.$inferSelect;

export const categories = pgTable("categories", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().$defaultFn(now),
});
export type Category = typeof categories.$inferSelect;

export const employees = pgTable("employees", {
  id:           serial("id").primaryKey(),
  employeeId:   text("employee_id").notNull().unique(),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role:         text("role").default("EMPLOYEE").notNull(),
  storeId:      integer("store_id"),
  phone:        text("phone"),
  language:     text("language").default("EN").notNull(),
  isActive:     integer("is_active").default(1).notNull(),
  createdAt:    timestamp("created_at").notNull().$defaultFn(now),
  updatedAt:    timestamp("updated_at").notNull().$defaultFn(now).$onUpdate(now),
}, (t) => [
  uniqueIndex("employee_id_idx").on(t.employeeId),
  index("email_idx").on(t.email),
  index("store_id_idx").on(t.storeId),
]);
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export const products = pgTable("products", {
  id:         serial("id").primaryKey(),
  name:       text("name").notNull(),
  categoryId: integer("category_id").notNull(),
  price:      integer("price").notNull(),
  imageUrl:   text("image_url"),
  createdAt:  timestamp("created_at").notNull().$defaultFn(now),
  updatedAt:  timestamp("updated_at").notNull().$defaultFn(now).$onUpdate(now),
}, (t) => [
  index("product_name_idx").on(t.name),
  index("product_category_idx").on(t.categoryId),
]);
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const inventory = pgTable("inventory", {
  id:        serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  storeId:   integer("store_id").notNull(),
  quantity:  integer("quantity").default(0).notNull(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(now).$onUpdate(now),
}, (t) => [uniqueIndex("inventory_product_store_idx").on(t.productId, t.storeId)]);
export type Inventory = typeof inventory.$inferSelect;

export const productVariants = pgTable("product_variants", {
  id:        serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  colorName: text("color_name").notNull(),
  colorHex:  text("color_hex").default("#888888").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(now),
}, (t) => [index("variant_product_idx").on(t.productId)]);
export type ProductVariant = typeof productVariants.$inferSelect;

export const variantInventory = pgTable("variant_inventory", {
  id:        serial("id").primaryKey(),
  variantId: integer("variant_id").notNull(),
  storeId:   integer("store_id").notNull(),
  quantity:  integer("quantity").default(0).notNull(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(now).$onUpdate(now),
}, (t) => [uniqueIndex("variant_inv_idx").on(t.variantId, t.storeId)]);
export type VariantInventory = typeof variantInventory.$inferSelect;

export const sales = pgTable("sales", {
  id:          serial("id").primaryKey(),
  employeeId:  integer("employee_id").notNull(),
  storeId:     integer("store_id").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt:   timestamp("created_at").notNull().$defaultFn(now),
}, (t) => [
  index("sale_employee_idx").on(t.employeeId),
  index("sale_store_idx").on(t.storeId),
  index("sale_created_idx").on(t.createdAt),
]);
export type Sale = typeof sales.$inferSelect;

export const saleItems = pgTable("sale_items", {
  id:        serial("id").primaryKey(),
  saleId:    integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity:  integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
}, (t) => [index("sale_item_sale_idx").on(t.saleId)]);
export type SaleItem = typeof saleItems.$inferSelect;

export const auditLogs = pgTable("audit_logs", {
  id:          serial("id").primaryKey(),
  actorId:     integer("actor_id"),
  actorName:   text("actor_name").notNull(),
  actorRole:   text("actor_role").notNull(),
  action:      text("action").notNull(),
  description: text("description").notNull(),
  storeId:     integer("store_id"),
  createdAt:   timestamp("created_at").notNull().$defaultFn(now),
}, (t) => [
  index("audit_created_idx").on(t.createdAt),
  index("audit_action_idx").on(t.action),
  index("audit_actor_idx").on(t.actorId),
  index("audit_store_idx").on(t.storeId),
]);
export type AuditLog = typeof auditLogs.$inferSelect;

/**
 * Seeds the Neon database: stores, admin account, and all 55 categories.
 *
 * Usage:
 *   ADMIN_EMAIL="your@email.com" ADMIN_PASSWORD="YourPassword123!" npx tsx scripts/seed.ts
 *
 * Or set them in .env:
 *   ADMIN_EMAIL=your@email.com
 *   ADMIN_PASSWORD=YourPassword123!
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { hash } from "bcryptjs";
import * as schema from "../db/schema";

// ── Validate required env vars ────────────────────────────────────────────────
const DATABASE_URL   = process.env.DATABASE_URL;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "Mich@2.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "GUESS#Real1";

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (ADMIN_PASSWORD.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

const client = postgres(DATABASE_URL, { prepare: false });
const db     = drizzle(client, { schema });

// ── Stores ────────────────────────────────────────────────────────────────────
await db.insert(schema.stores).values([
  { name: "Yaoundé", city: "Yaoundé" },
  { name: "Kribi",   city: "Kribi" },
]).onConflictDoNothing();
console.log("✓ Stores");

// ── Admin ─────────────────────────────────────────────────────────────────────
const passwordHash = await hash(ADMIN_PASSWORD, 12);
await db.insert(schema.employees).values({
  employeeId:   "ADM-001",
  name:         "Admin",
  email:        ADMIN_EMAIL,
  passwordHash,
  role:         "ADMIN",
  language:     "FR",
  isActive:     1,
}).onConflictDoNothing();
console.log(`✓ Admin created — email: ${ADMIN_EMAIL}`);

// ── Categories ────────────────────────────────────────────────────────────────
const cats = [
  "Anklets","Arm Warmers","Baby Accessories","Backpacks",
  "Bags & Purses","Belts","Body Jewelry","Bonnets & Beanies",
  "Boots & Ankle Boots","Bracelets","Brooches & Pins",
  "Clutches & Evening Bags","Coin Purses","Compact Mirrors",
  "Crossbody Bags","Cufflinks","Earrings","Face Masks & Veils",
  "Glasses Frames","Gloves","Hair Accessories","Hair Clips & Pins",
  "Hair Extensions & Wigs","Hats & Caps","Headbands & Tiaras",
  "Heels & Pumps","Jewellery Boxes","Jewelry Organizers","Jewelry Sets",
  "Keychains","Laptop Bags & Sleeves","Leg Warmers","Luggage & Travel",
  "Makeup Bags & Pouches","Necklaces & Pendants","Perfume & Fragrance",
  "Phone Cases","Pocket Squares","Rings","Sandals & Flip-Flops",
  "Scarves & Wraps","Shoe Accessories","Shoe Care & Accessories",
  "Shoes & Sneakers","Socks & Stockings","Sports Accessories",
  "Sunglasses","Sunglasses Cases","Suspenders","Swim & Beach Accessories",
  "Ties & Bow Ties","Tote Bags","Umbrellas","Wallets & Card Holders","Watches",
];

await db.insert(schema.categories)
  .values(cats.map((name) => ({ name })))
  .onConflictDoNothing();
console.log(`✓ ${cats.length} categories`);

console.log("\n✅ Seed complete. Login with:");
console.log(`   Email:    ${ADMIN_EMAIL}`);
console.log(`   Password: ${ADMIN_PASSWORD}`);
process.exit(0);

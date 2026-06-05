import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./employee-context";
import { env } from "./lib/env";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ── Image upload via Supabase Storage ─────────────────────────────────────
app.post("/api/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] as File;
    if (!file || !file.name) return c.json({ error: "No file provided" }, 400);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      return c.json({ error: "Invalid file type" }, 400);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return c.json({ error: "Image upload not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, 500);
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);

    const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from("gs-images")
      .upload(fileName, arrayBuffer, { contentType: file.type, upsert: false });

    if (error) return c.json({ error: "Upload to Supabase failed: " + error.message }, 500);

    const { data: { publicUrl } } = supabase.storage
      .from("gs-images")
      .getPublicUrl(fileName);

    return c.json({ url: publicUrl });
  } catch (err) {
    return c.json({ error: "Upload failed" }, 500);
  }
});

// ── Health check ──────────────────────────────────────────────────────────
app.get("/api/health", async (c) => {
  try {
    const { getDb } = await import("./queries/connection") as any;
    await getDb().execute("SELECT 1");
    return c.json({ ok: true, db: "connected", env: !!process.env.DATABASE_URL });
  } catch (err: any) {
    return c.json({ ok: false, error: err?.message ?? String(err), env: !!process.env.DATABASE_URL }, 500);
  }
});

// ── tRPC ───────────────────────────────────────────────────────────────────
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

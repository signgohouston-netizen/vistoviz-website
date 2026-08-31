// Password-protected endpoint that returns saved leads for the admin page.
// Requires the ADMIN_KEY environment variable (set it in Vercel).

const { MongoClient } = require("mongodb");

let cached = global.__vistovizMongo;
if (!cached) cached = global.__vistovizMongo = { conn: null, promise: null };

async function getDb() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");
  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, { maxPoolSize: 5 }).then((client) => ({
      client,
      db: client.db("vistoviz"),
    }));
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const provided = String(req.headers["x-admin-key"] || "");
  const expected = process.env.ADMIN_KEY || "";
  if (!expected || provided !== expected) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  try {
    const { db } = await getDb();
    const leads = await db
      .collection("leads")
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();
    res.status(200).json({ ok: true, count: leads.length, leads });
  } catch (err) {
    console.error("[leads] error:", err && err.message);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

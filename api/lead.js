// Vercel serverless function: receives a contact/quote submission and stores it
// in MongoDB Atlas. Set the MONGODB_URI environment variable in Vercel
// (Project → Settings → Environment Variables) — never hard-code it here.

const { MongoClient } = require("mongodb");

// Reuse the connection across warm invocations (important for serverless).
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

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    // Spam honeypot: real users leave this empty.
    if (body.company_website) {
      res.status(200).json({ ok: true });
      return;
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const message = String(body.message || "").trim();

    if (name.length < 2 || !emailRe.test(email) || message.length < 5) {
      res.status(422).json({
        ok: false,
        error: "Please include your name, a valid email, and a short message.",
      });
      return;
    }

    const { db } = await getDb();
    await db.collection("leads").insertOne({
      name,
      email,
      phone,
      message,
      source: "vistoviz.com",
      status: "new",
      createdAt: new Date(),
      ip: String(req.headers["x-forwarded-for"] || "").split(",")[0] || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.status(200).json({ ok: true, message: "Thanks! We'll be in touch within 24 hours." });
  } catch (err) {
    console.error("[lead] error:", err && err.message);
    res.status(500).json({ ok: false, error: "Server error. Please email order@vistoviz.com." });
  }
};

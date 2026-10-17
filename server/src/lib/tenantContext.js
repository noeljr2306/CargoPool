const prisma = require("./prisma");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Runs `callback` inside a transaction with app.current_tenant_id set
// for that connection, so the RLS policies (which read that setting)
// actually filter rows to this tenant. `callback` receives the
// transaction client (`tx`) — every query inside it MUST use `tx`,
// not the global `prisma` object, or it runs on a different
// connection where the setting was never applied.
async function withTenant(tenantId, callback) {
  // tenantId always comes from our own signed JWT, but we validate
  // its shape anyway before string-interpolating it into raw SQL,
  // since SET doesn't support normal query parameters.
  if (!UUID_RE.test(tenantId)) {
    throw new Error("Invalid tenant id");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`,
    );
    return callback(tx);
  });
}

module.exports = { withTenant };

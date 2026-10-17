const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prismaAdmin = require("../lib/prismaAdmin");

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "8h";

function signToken(user) {
  return jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

// POST /api/auth/register
// Creates a tenant + its first user. No tenant context can exist yet
// (the tenant doesn't exist until this runs), so this is a genuine,
// necessary RLS bypass — not a tenant-scoped read.
async function register(req, res) {
  const { tenantName, tenantType, email, password } = req.body;

  if (!tenantName || !tenantType || !email || !password) {
    return res
      .status(400)
      .json({
        error: "tenantName, tenantType, email and password are required",
      });
  }
  if (!["SHIPPER", "FORWARDER"].includes(tenantType)) {
    return res
      .status(400)
      .json({ error: "tenantType must be SHIPPER or FORWARDER" });
  }

  const existing = await prismaAdmin.user.findUnique({ where: { email } });
  if (existing) {
    return res
      .status(409)
      .json({ error: "A user with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { tenant, user } = await prismaAdmin.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: tenantName, type: tenantType },
    });
    const user = await tx.user.create({
      data: { tenantId: tenant.id, email, passwordHash, role: tenantType },
    });
    return { tenant, user };
  });

  const token = signToken(user);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    tenant: { id: tenant.id, name: tenant.name, type: tenant.type },
  });
}

// POST /api/auth/login
// Looking up a user by email, pre-authentication, is inherently
// cross-tenant — there's no tenant context to scope by yet.
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prismaAdmin.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  });
}

// GET /api/auth/me
async function me(req, res) {
  const user = await prismaAdmin.user.findUnique({
    where: { id: req.user.userId },
    include: { tenant: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      type: user.tenant.type,
    },
  });
}

module.exports = { register, login, me };

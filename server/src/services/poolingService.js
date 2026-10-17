const DEFAULT_DEADLINE_DAYS = 7;

// `db` is a Prisma client — either the global client for
// non-tenant-scoped reads, or a `tx` from withTenant() for anything
// that must respect RLS.
async function matchOrCreateContainer(db, weightVolume) {
  const openContainers = await db.container.findMany({
    where: { status: "OPEN" },
    orderBy: { id: "asc" },
  });

  const fitting = openContainers.find(
    (c) => c.capacity - c.filledCapacity >= weightVolume,
  );

  if (fitting) {
    return fitting;
  }

  const forwarderTenant = await db.tenant.findFirst({
    where: { type: "FORWARDER" },
  });

  if (!forwarderTenant) {
    throw Object.assign(
      new Error("No forwarder is available yet to hold this shipment"),
      { status: 409 },
    );
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + DEFAULT_DEADLINE_DAYS);

  return db.container.create({
    data: {
      forwarderTenantId: forwarderTenant.id,
      capacity: 100,
      filledCapacity: 0,
      status: "OPEN",
      departureDeadline: deadline,
    },
  });
}

async function addToContainer(db, containerId, weightVolume) {
  return db.container.update({
    where: { id: containerId },
    data: { filledCapacity: { increment: weightVolume } },
  });
}

function fillPercentage(container) {
  if (container.capacity <= 0) return 0;
  return Math.min(
    100,
    Math.round((container.filledCapacity / container.capacity) * 100),
  );
}

module.exports = { matchOrCreateContainer, addToContainer, fillPercentage };

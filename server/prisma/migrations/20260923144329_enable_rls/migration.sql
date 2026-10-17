-- This is an empty migration.
-- Enable RLS on every tenant-scoped table
ALTER TABLE "tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "container" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manifest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tracking_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
-- hs_code_mapping is intentionally excluded (shared reference table)

-- The app will SET app.current_tenant_id at the start of each request
-- (built from the JWT's tenant claim). Policies compare rows against it.

CREATE POLICY tenant_isolation_user ON "user"
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_container ON "container"
  USING (forwarder_tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_shipment ON "shipment"
  USING (shipper_tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_manifest ON "manifest"
  USING (container_id IN (
    SELECT id FROM "container"
    WHERE forwarder_tenant_id::text = current_setting('app.current_tenant_id', true)
  ));

CREATE POLICY tenant_isolation_tracking_event ON "tracking_event"
  USING (container_id IN (
    SELECT id FROM "container"
    WHERE forwarder_tenant_id::text = current_setting('app.current_tenant_id', true)
  ));

CREATE POLICY tenant_isolation_audit_log ON "audit_log"
  USING (user_id IN (
    SELECT id FROM "user" WHERE tenant_id::text = current_setting('app.current_tenant_id', true)
  ));
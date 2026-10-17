-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('SHIPPER', 'FORWARDER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SHIPPER', 'FORWARDER', 'CUSTOMS_AGENT', 'TRANSPORT_PERSONNEL');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('OPEN', 'CLOSED', 'IN_TRANSIT', 'DELIVERED');

-- CreateEnum
CREATE TYPE "ManifestStatus" AS ENUM ('PENDING', 'GENERATED');

-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TenantType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "container" (
    "id" TEXT NOT NULL,
    "forwarder_tenant_id" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "filled_capacity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ContainerStatus" NOT NULL DEFAULT 'OPEN',
    "departure_deadline" TIMESTAMP(3),

    CONSTRAINT "container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" TEXT NOT NULL,
    "shipper_tenant_id" TEXT NOT NULL,
    "container_id" TEXT,
    "product_description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight_volume" DOUBLE PRECISION NOT NULL,
    "hs_code" TEXT,
    "destination" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hs_code_mapping" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "hs_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "hs_code_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest" (
    "id" TEXT NOT NULL,
    "container_id" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3),
    "pdf_url" TEXT,
    "status" "ManifestStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "manifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_event" (
    "id" TEXT NOT NULL,
    "container_id" TEXT NOT NULL,
    "scanned_by_user_id" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "table_affected" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container" ADD CONSTRAINT "container_forwarder_tenant_id_fkey" FOREIGN KEY ("forwarder_tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_shipper_tenant_id_fkey" FOREIGN KEY ("shipper_tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "container"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest" ADD CONSTRAINT "manifest_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_event" ADD CONSTRAINT "tracking_event_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_event" ADD CONSTRAINT "tracking_event_scanned_by_user_id_fkey" FOREIGN KEY ("scanned_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

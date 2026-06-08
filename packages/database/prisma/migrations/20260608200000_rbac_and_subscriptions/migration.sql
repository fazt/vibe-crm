-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('PLATFORM', 'WORKSPACE');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('SOLO', 'STUDIO', 'AGENCY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'SOLO',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "hadTrial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- AlterTable WorkspaceMember
ALTER TABLE "WorkspaceMember" ADD COLUMN "roleId" TEXT;

-- Seed system roles with fixed UUIDs
INSERT INTO "Role" ("id", "slug", "name", "description", "scope", "isSystem", "createdAt", "updatedAt") VALUES
('00000000-0000-4000-8000-000000000001', 'user', 'User', 'Free tier with limits', 'PLATFORM', true, NOW(), NOW()),
('00000000-0000-4000-8000-000000000002', 'subscriber', 'Subscriber', 'Paid subscriber', 'PLATFORM', true, NOW(), NOW()),
('00000000-0000-4000-8000-000000000003', 'superadmin', 'Super Admin', 'Platform administrator', 'PLATFORM', true, NOW(), NOW()),
('00000000-0000-4000-8000-000000000010', 'owner', 'Owner', 'Workspace owner', 'WORKSPACE', true, NOW(), NOW()),
('00000000-0000-4000-8000-000000000011', 'admin', 'Admin', 'Workspace admin', 'WORKSPACE', true, NOW(), NOW()),
('00000000-0000-4000-8000-000000000012', 'member', 'Member', 'Workspace member', 'WORKSPACE', true, NOW(), NOW());

-- Backfill User.roleId
UPDATE "User" SET "roleId" = '00000000-0000-4000-8000-000000000001' WHERE "roleId" IS NULL;

-- Backfill WorkspaceMember.roleId from MemberRole enum
UPDATE "WorkspaceMember" wm SET "roleId" = r.id
FROM "Role" r
WHERE wm."roleId" IS NULL
  AND r.scope = 'WORKSPACE'
  AND r.slug = LOWER(wm.role::text);

-- Enforce NOT NULL
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "WorkspaceMember" ALTER COLUMN "roleId" SET NOT NULL;

-- Drop legacy column and enum
ALTER TABLE "WorkspaceMember" DROP COLUMN "role";
DROP TYPE "MemberRole";

-- CreateIndex
CREATE UNIQUE INDEX "Role_scope_slug_key" ON "Role"("scope", "slug");
CREATE INDEX "Role_scope_idx" ON "Role"("scope");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_plan_idx" ON "Subscription"("plan");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE INDEX "WorkspaceMember_roleId_idx" ON "WorkspaceMember"("roleId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

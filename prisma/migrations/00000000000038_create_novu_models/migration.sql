BEGIN;

CREATE TABLE "novu_workflows" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "novu_workflows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "novu_workflows_workflowId_key" ON "novu_workflows"("workflowId");

CREATE TABLE "novu_variable_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "novu_variable_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "novu_variables" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',
    "label" TEXT,
    "description" TEXT,
    "exampleValue" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "validationRules" JSONB,
    "aliases" TEXT[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "novu_variables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "novu_variables_groupId_key_key" ON "novu_variables"("groupId", "key");

ALTER TABLE "novu_variables" ADD CONSTRAINT "novu_variables_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "novu_variable_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

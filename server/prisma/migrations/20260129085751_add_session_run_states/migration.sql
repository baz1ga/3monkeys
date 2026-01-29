-- CreateTable
CREATE TABLE "SessionRunState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "front" TEXT NOT NULL DEFAULT 'offline',
    "gm" TEXT NOT NULL DEFAULT 'offline',
    "lastFrontPing" DATETIME,
    "lastGmPing" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SessionRunState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionRunState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SessionRunState_tenantId_sessionId_updatedAt_idx" ON "SessionRunState"("tenantId", "sessionId", "updatedAt");

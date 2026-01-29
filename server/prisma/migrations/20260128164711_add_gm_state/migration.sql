-- CreateTable
CREATE TABLE "SessionGmState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timerRunning" BOOLEAN NOT NULL DEFAULT false,
    "timerElapsedMs" INTEGER NOT NULL DEFAULT 0,
    "timerStartedAt" DATETIME,
    "hourglassDuration" INTEGER NOT NULL DEFAULT 60,
    "hourglassShowTimer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SessionGmState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionGmState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionGmState_sessionId_key" ON "SessionGmState"("sessionId");

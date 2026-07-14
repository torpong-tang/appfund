-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "txId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberName" TEXT NOT NULL,
    "income" REAL NOT NULL DEFAULT 0,
    "expense" REAL NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "slipUrl" TEXT NOT NULL DEFAULT '',
    "recordedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Transaction" ("createdAt", "expense", "id", "income", "memberName", "note", "slipUrl", "timestamp", "txId") SELECT "createdAt", "expense", "id", "income", "memberName", "note", "slipUrl", "timestamp", "txId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_txId_key" ON "Transaction"("txId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

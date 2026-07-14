-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'เป๋าเรา Acc BA 34',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT 'กรุงเทพฯ (BBL)',
    "accountNumber" TEXT NOT NULL DEFAULT '123-4-56789-0',
    "incomeTarget" REAL NOT NULL DEFAULT 500000,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Setting" ("accountNumber", "bankName", "id", "subtitle", "title", "updatedAt") SELECT "accountNumber", "bankName", "id", "subtitle", "title", "updatedAt" FROM "Setting";
DROP TABLE "Setting";
ALTER TABLE "new_Setting" RENAME TO "Setting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

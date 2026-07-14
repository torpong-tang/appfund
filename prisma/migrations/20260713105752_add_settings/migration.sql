-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'เป๋าเรา Acc BA 34',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT 'กรุงเทพฯ (BBL)',
    "accountNumber" TEXT NOT NULL DEFAULT '123-4-56789-0',
    "updatedAt" DATETIME NOT NULL
);

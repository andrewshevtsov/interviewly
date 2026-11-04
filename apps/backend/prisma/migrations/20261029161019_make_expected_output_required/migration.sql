/*
  Warnings:

  - Made the column `expectedOutput` on table `ProgrammingTaskCase` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProgrammingTaskCase" ALTER COLUMN "expectedOutput" SET NOT NULL;

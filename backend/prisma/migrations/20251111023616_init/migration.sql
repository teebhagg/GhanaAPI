-- CreateEnum
CREATE TYPE "SchoolCategory" AS ENUM ('UNIVERSITY', 'COLLEGE', 'SHS', 'JHS', 'TECHNICAL_VOCATIONAL');

-- CreateEnum
CREATE TYPE "SchoolGrade" AS ENUM ('A', 'B', 'C', 'D', 'UNGRADED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'MIXED');

-- CreateEnum
CREATE TYPE "Residency" AS ENUM ('DAY', 'BOARDING', 'DAY_BOARDING');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SchoolCategory" NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "location" TEXT,
    "grade" "SchoolGrade" NOT NULL DEFAULT 'UNGRADED',
    "gender" "Gender" NOT NULL DEFAULT 'MIXED',
    "residency" "Residency" NOT NULL DEFAULT 'DAY',
    "email" TEXT,
    "website" TEXT,
    "programsOffered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schools_region_idx" ON "schools"("region");

-- CreateIndex
CREATE INDEX "schools_district_idx" ON "schools"("district");

-- CreateIndex
CREATE INDEX "schools_category_idx" ON "schools"("category");

-- CreateIndex
CREATE INDEX "schools_grade_idx" ON "schools"("grade");

-- CreateIndex
CREATE INDEX "schools_name_idx" ON "schools"("name");

-- CreateIndex
CREATE INDEX "schools_region_district_idx" ON "schools"("region", "district");

-- CreateIndex
CREATE INDEX "schools_category_grade_idx" ON "schools"("category", "grade");

-- CreateTable
CREATE TABLE "public"."DrugLog" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DrugLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Medication" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "timesPerDay" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doseTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoseLog" (
    "id" SERIAL NOT NULL,
    "medicationId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "takenCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DoseLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoseLog_medicationId_date_key" ON "public"."DoseLog"("medicationId", "date");

-- AddForeignKey
ALTER TABLE "public"."DoseLog" ADD CONSTRAINT "DoseLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

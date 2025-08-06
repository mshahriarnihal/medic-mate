-- CreateTable
CREATE TABLE "public"."DrugLog" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DrugLog_pkey" PRIMARY KEY ("id")
);

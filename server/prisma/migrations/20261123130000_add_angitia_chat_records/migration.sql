-- CreateTable AngitiaChatRecord
CREATE TABLE IF NOT EXISTS "AngitiaChatRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AngitiaChatRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AngitiaChatRecord_userId_idx" ON "AngitiaChatRecord"("userId");
CREATE INDEX IF NOT EXISTS "AngitiaChatRecord_createdAt_idx" ON "AngitiaChatRecord"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AngitiaChatRecord_userId_fkey'
    ) THEN
        ALTER TABLE "AngitiaChatRecord" ADD CONSTRAINT "AngitiaChatRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

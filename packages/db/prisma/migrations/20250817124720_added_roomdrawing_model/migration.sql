-- CreateTable
CREATE TABLE "RoomDrawing" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "strokeData" JSONB NOT NULL DEFAULT '[]',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomDrawing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomDrawing_roomId_key" ON "RoomDrawing"("roomId");

-- AddForeignKey
ALTER TABLE "RoomDrawing" ADD CONSTRAINT "RoomDrawing_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

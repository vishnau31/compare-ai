-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Response_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Metrics_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ModelResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comparisonId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModelResponse_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResponseMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "cost" REAL NOT NULL,
    CONSTRAINT "ResponseMetrics_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ModelResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComparisonMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comparisonId" TEXT NOT NULL,
    "totalLatencyMs" INTEGER NOT NULL,
    "totalCost" REAL NOT NULL,
    "fastestModel" TEXT NOT NULL,
    "mostCostEffectiveModel" TEXT NOT NULL,
    CONSTRAINT "ComparisonMetrics_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Metrics_responseId_key" ON "Metrics"("responseId");

-- CreateIndex
CREATE INDEX "ModelResponse_comparisonId_idx" ON "ModelResponse"("comparisonId");

-- CreateIndex
CREATE INDEX "ModelResponse_modelName_idx" ON "ModelResponse"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseMetrics_responseId_key" ON "ResponseMetrics"("responseId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonMetrics_comparisonId_key" ON "ComparisonMetrics"("comparisonId");

// backend/src/lib/prisma.js
// PrismaClient 싱글턴 인스턴스
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;

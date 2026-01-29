// Temporarily using mock while Prisma client generation has issues
// import { PrismaClient } from '@prisma/client';
import { PrismaClient } from './prisma-mock';

const prisma = new PrismaClient();

export default prisma;

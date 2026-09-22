import "dotenv/config"
import {PrismaClient} from  '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to Prisma");
    } catch (error) {
        console.error(`Error connecting database ${error}`);
        process.exit(1);
    }
};

export const disconnectDB = async () => {
    try {
        await prisma.$disconnect();
    } catch (error) {
        console.error(`Error disconnect database ${error}`);
    }
};

export { prisma, adapter, pool };
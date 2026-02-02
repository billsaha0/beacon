import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
}

const caCert = process.env.DATABASE_CA;

const adapter = new PrismaPg({
    connectionString,
    ssl: {
        rejectUnauthorized: true,
        ca: caCert,
    }
})
const prisma = new PrismaClient({ adapter })

export default prisma;
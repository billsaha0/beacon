import prisma from "../src/config/prisma";

async function main() {
    console.log("Seeding Beacon plan...");

    await prisma.plan.upsert({
        where: {
            name: "Free"
        },
        update: {},
        create: {
            name: "Free",
            price: 0,
            maxEndpoints: 1,
            checkInterval: 5,
            retentionHrs: 24
        }   
    });

    await prisma.plan.upsert({
        where: {
            name: "Pro"
        },
        update: {},
        create: {
            name: "Pro",
            price: 1500,
            maxEndpoints: 999,
            checkInterval: 1,
            retentionHrs: 0
        }
    });

    console.log("Plans seeded.");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
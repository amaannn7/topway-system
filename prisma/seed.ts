import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("TopwayAdmin2026!", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@topway.lk" },
    update: {},
    create: {
      name: "Topway Admin",
      email: "admin@topway.lk",
      passwordHash: adminPassword,
      role: "OWNER",
    },
  });
  console.log(`Admin ready: ${admin.email} / TopwayAdmin2026!`);

  const agentPassword = await bcrypt.hash("AgentDemo2026!", 10);
  const agent = await prisma.agent.upsert({
    where: { username: "demoagency" },
    update: {},
    create: {
      name: "Demo Contact",
      company: "Demo Recruitment Agency",
      country: "Saudi Arabia",
      username: "demoagency",
      passwordHash: agentPassword,
      active: true,
    },
  });
  console.log(`Agent ready: ${agent.username} / AgentDemo2026!`);

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", allowAgentBrowse: false },
  });
  console.log("Org settings row ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

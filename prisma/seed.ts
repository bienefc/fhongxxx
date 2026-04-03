import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Amateur", slug: "amateur", description: "User-generated amateur content" },
  { name: "Asian", slug: "asian" },
  { name: "BBW", slug: "bbw" },
  { name: "BDSM", slug: "bdsm" },
  { name: "Blonde", slug: "blonde" },
  { name: "Brunette", slug: "brunette" },
  { name: "Compilation", slug: "compilation" },
  { name: "Creampie", slug: "creampie" },
  { name: "Ebony", slug: "ebony" },
  { name: "European", slug: "european" },
  { name: "Fetish", slug: "fetish" },
  { name: "Hardcore", slug: "hardcore" },
  { name: "Latina", slug: "latina" },
  { name: "Lesbian", slug: "lesbian" },
  { name: "MILF", slug: "milf" },
  { name: "POV", slug: "pov" },
  { name: "Redhead", slug: "redhead" },
  { name: "Solo", slug: "solo" },
  { name: "Threesome", slug: "threesome" },
  { name: "Vintage", slug: "vintage" },
];

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fhongxxx.com" },
    update: {},
    create: {
      email: "admin@fhongxxx.com",
      username: "admin",
      displayName: "Administrator",
      passwordHash: adminHash,
      role: "ADMIN",
      verified: true,
    },
  });
  console.log("Admin user:", admin.username);

  // Create categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Created ${CATEGORIES.length} categories`);

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

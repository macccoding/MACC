import { prisma } from "../src/lib/prisma";

const HEALTH_HABITS = [
  {
    title: "Sleep 8 Hours",
    type: "quantity",
    targetValue: 8,
    healthKey: "sleep",
    color: "#3B82F6",
    icon: "\u{1F634}",
    sortOrder: 1,
  },
  {
    title: "10K Steps",
    type: "quantity",
    targetValue: 10000,
    healthKey: "steps",
    color: "#22C55E",
    icon: "\u{1F6B6}",
    sortOrder: 2,
  },
  {
    title: "30min Exercise",
    type: "quantity",
    targetValue: 30,
    healthKey: "exerciseMinutes",
    color: "#D03A2C",
    icon: "\u{1F4AA}",
    sortOrder: 3,
  },
  {
    title: "500 Active Calories",
    type: "quantity",
    targetValue: 500,
    healthKey: "calories",
    color: "#C9A84C",
    icon: "\u{1F525}",
    sortOrder: 4,
  },
  {
    title: "12 Stand Hours",
    type: "quantity",
    targetValue: 12,
    healthKey: "standHours",
    color: "#A855F7",
    icon: "\u{1F9CD}",
    sortOrder: 5,
  },
];

async function main() {
  // Fix existing workout habit: change from negative to daily
  const workout = await prisma.habit.findFirst({
    where: { title: { contains: "workout" } },
  });
  if (workout) {
    await prisma.habit.update({
      where: { id: workout.id },
      data: { type: "daily", sortOrder: 0 },
    });
    console.log("Fixed workout habit -> daily type");
  }

  // Seed health habits (skip if already exist by healthKey)
  for (const h of HEALTH_HABITS) {
    const exists = await prisma.habit.findFirst({
      where: { healthKey: h.healthKey },
    });
    if (exists) {
      console.log(`Skipping ${h.title} -- already exists`);
      continue;
    }
    await prisma.habit.create({ data: h });
    console.log(`Created: ${h.title}`);
  }

  await prisma.$disconnect();
}

main();

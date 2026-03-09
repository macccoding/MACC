import { prisma } from "@/lib/prisma";

export async function getPreference<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined> {
  const pref = await prisma.kemiPreference.findUnique({ where: { key } });
  return pref ? (pref.value as T) : defaultValue;
}

export async function setPreference(key: string, value: unknown) {
  await prisma.kemiPreference.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any },
  });
}

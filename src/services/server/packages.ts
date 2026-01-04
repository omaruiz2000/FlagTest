import { prisma } from '@/src/db/prisma';
import { DEFAULT_PACKAGES, SCHOOL_PACKAGE_SLUG } from '@/src/constants/packages';

export async function ensureDefaultPackages() {
  const legacySchool = await prisma.testPackage.findUnique({ where: { slug: 'school-bundle' } });
  const existingSchool = await prisma.testPackage.findUnique({ where: { slug: SCHOOL_PACKAGE_SLUG } });

  if (!existingSchool && legacySchool) {
    await prisma.testPackage.update({
      where: { id: legacySchool.id },
      data: { slug: SCHOOL_PACKAGE_SLUG, title: 'School Bundle', isActive: true },
    });
  }

  await Promise.all(
    DEFAULT_PACKAGES.map((pkg) =>
      prisma.testPackage.upsert({
        where: { slug: pkg.slug },
        update: { title: pkg.title, description: pkg.description, isActive: true },
        create: { slug: pkg.slug, title: pkg.title, description: pkg.description, isActive: true },
      }),
    ),
  );
}

export async function listActivePackagesWithItems() {
  await ensureDefaultPackages();
  return prisma.testPackage.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          testDefinition: { select: { id: true, title: true, description: true } },
        },
      },
    },
  });
}

export async function listPackagesWithCounts() {
  await ensureDefaultPackages();
  return prisma.testPackage.findMany({
    orderBy: { title: 'asc' },
    include: { _count: { select: { items: true } } },
  });
}

export function getPackageWithItems(packageId: string) {
  return prisma.testPackage.findUnique({
    where: { id: packageId },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { testDefinition: { select: { id: true, title: true, description: true } } },
      },
    },
  });
}

export async function addTestToPackage(testPackageId: string, testDefinitionId: string) {
  const last = await prisma.testPackageItem.findFirst({
    where: { testPackageId },
    orderBy: { sortOrder: 'desc' },
  });
  const sortOrder = typeof last?.sortOrder === 'number' ? last.sortOrder + 1 : 0;
  await prisma.testPackageItem.upsert({
    where: { testPackageId_testDefinitionId: { testPackageId, testDefinitionId } },
    update: {},
    create: { testPackageId, testDefinitionId, sortOrder },
  });
}

export function removePackageItem(id: string) {
  return prisma.testPackageItem.delete({ where: { id } });
}

export function togglePackageItemFree(id: string, isFree: boolean) {
  return prisma.testPackageItem.update({ where: { id }, data: { isFree } });
}

export async function movePackageItem(itemId: string, direction: 'up' | 'down') {
  const item = await prisma.testPackageItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  const neighbor = await prisma.testPackageItem.findFirst({
    where: {
      testPackageId: item.testPackageId,
      sortOrder: direction === 'up' ? { lt: item.sortOrder } : { gt: item.sortOrder },
    },
    orderBy: { sortOrder: direction === 'up' ? 'desc' : 'asc' },
  });

  if (!neighbor) return;

  await prisma.$transaction([
    prisma.testPackageItem.update({ where: { id: item.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.testPackageItem.update({ where: { id: neighbor.id }, data: { sortOrder: item.sortOrder } }),
  ]);
}

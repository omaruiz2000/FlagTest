import { prisma } from '../prisma';

export const CORE_PACKAGE_SLUGS = ['school', 'friends', 'couples'] as const;

export const CORE_PACKAGES = [
  { slug: CORE_PACKAGE_SLUGS[0], title: 'School' },
  { slug: CORE_PACKAGE_SLUGS[1], title: 'Friends' },
  { slug: CORE_PACKAGE_SLUGS[2], title: 'Couples' },
] as const;

function corePackageOrder(slug: string) {
  const index = CORE_PACKAGE_SLUGS.indexOf(slug);
  return index === -1 ? CORE_PACKAGE_SLUGS.length : index;
}

export async function ensureCorePackages() {
  await Promise.all(
    CORE_PACKAGES.map((pkg) =>
      prisma.testPackage.upsert({
        where: { slug: pkg.slug },
        update: {},
        create: { slug: pkg.slug, title: pkg.title },
      }),
    ),
  );
}

export async function listCorePackagesWithItems() {
  await ensureCorePackages();
  const packages = await prisma.testPackage.findMany({
    where: { slug: { in: CORE_PACKAGE_SLUGS } },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { testDefinition: { select: { id: true, title: true, description: true } } },
      },
    },
  });

  return [...packages].sort((a, b) => corePackageOrder(a.slug) - corePackageOrder(b.slug));
}

export async function findCorePackageBySlug(slug: string) {
  if (!CORE_PACKAGE_SLUGS.includes(slug)) return null;
  await ensureCorePackages();
  return prisma.testPackage.findUnique({ where: { slug } });
}

export async function findCorePackageWithItems(slug: string) {
  if (!CORE_PACKAGE_SLUGS.includes(slug)) return null;
  await ensureCorePackages();
  return prisma.testPackage.findUnique({
    where: { slug },
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

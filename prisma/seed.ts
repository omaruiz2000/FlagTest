import { PrismaClient, OrgRole, EvaluationStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const password = 'changeme123';
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'FlagTest Demo',
      createdById: user.id,
    },
  });

  await prisma.orgMember.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { role: OrgRole.OWNER },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: OrgRole.OWNER,
    },
  });

  const testDefinition = await prisma.testDefinition.upsert({
    where: {
      slug_version: { slug: 'scenario-demo', version: 1 },
    },
    update: {},
    create: {
      slug: 'scenario-demo',
      version: 1,
      title: 'Sample Scenario Choice',
      description: 'A minimal scenario choice example for the runner.',
      styleId: 'classic',
      definition: {
        version: 1,
        slug: 'scenario-demo',
        title: 'Sample Scenario Choice',
        styleId: 'classic',
        items: [
          {
            id: 'scenario-1',
            widgetType: 'scenario_choice',
            prompt: 'Pick the reaction that feels right to you.',
            scenario: 'Imagine you are solving a puzzle with a friend.',
            options: [
              { id: 'a', label: 'Try a new idea', description: 'Suggest a different way to start.' },
              { id: 'b', label: 'Ask for help', description: 'Pause and ask your friend what they think.' },
              { id: 'c', label: 'Take the lead', description: 'Guide the team with a clear next step.' },
            ],
            scoring: [
              { dimension: 'collaboration', delta: 1 },
              { dimension: 'initiative', delta: 1 },
            ],
          },
          {
            id: 'scenario-2',
            widgetType: 'scenario_choice',
            prompt: 'How do you react when a teammate is stuck?',
            scenario: 'Your classmate is unsure how to move forward on a shared assignment.',
            options: [
              { id: 'a', label: 'Encourage them', description: 'Offer encouragement and ask guiding questions.' },
              { id: 'b', label: 'Jump in', description: 'Quickly outline the next steps for them.' },
              { id: 'c', label: 'Wait', description: 'Let them figure it out on their own for a bit.' },
            ],
            scoring: [
              { dimension: 'collaboration', delta: 1 },
            ],
          },
          {
            id: 'scenario-3',
            widgetType: 'scenario_choice',
            prompt: 'What describes your approach to new projects?',
            scenario: 'You are starting a brand new activity with friends.',
            options: [
              { id: 'a', label: 'Plan together', description: 'Propose a quick plan to get aligned.' },
              { id: 'b', label: 'Start experimenting', description: 'Try something small to see what works.' },
              { id: 'c', label: 'Look for a leader', description: 'Ask who wants to lead and follow their direction.' },
            ],
            scoring: [
              { dimension: 'initiative', delta: 1 },
            ],
          },
        ],
      },
    },
  });

  await prisma.evaluation.upsert({
    where: { id: 'demo-evaluation' },
    update: {},
    create: {
      id: 'demo-evaluation',
      name: 'Demo Evaluation',
      description: 'Example evaluation seeded for development.',
      status: EvaluationStatus.DRAFT,
      organizationId: organization.id,
      testDefinitionId: testDefinition.id,
    },
  });

  await prisma.studentRecord.upsert({
    where: { code: 'CODE123' },
    update: {},
    create: {
      code: 'CODE123',
      grade: '5',
      section: 'A',
      organizationId: organization.id,
      metadata: { seed: true },
    },
  });

  await prisma.studentRecord.upsert({
    where: { code: 'CODE456' },
    update: {},
    create: {
      code: 'CODE456',
      grade: '5',
      section: 'B',
      organizationId: organization.id,
      metadata: { seed: true },
    },
  });

  console.log('Seed data created:', { adminEmail });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

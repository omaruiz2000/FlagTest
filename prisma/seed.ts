import { PrismaClient, OrgRole, EvaluationStatus, ParticipantFeedbackMode } from '@prisma/client';
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
    update: {
      organizationId: organization.id,
      participantFeedbackMode: ParticipantFeedbackMode.CAMOUFLAGE,
    },
    create: {
      id: 'demo-evaluation',
      name: 'Demo Evaluation',
      description: 'Example evaluation seeded for development.',
      status: EvaluationStatus.DRAFT,
      organizationId: organization.id,
      participantFeedbackMode: ParticipantFeedbackMode.CAMOUFLAGE,
    },
  });

  await prisma.evaluationTest.upsert({
    where: {
      evaluationId_testDefinitionId: {
        evaluationId: 'demo-evaluation',
        testDefinitionId: testDefinition.id,
      },
    },
    update: {
      sortOrder: 1,
    },
    create: {
      evaluationId: 'demo-evaluation',
      testDefinitionId: testDefinition.id,
      sortOrder: 1,
    },
  });

  const demoInvites = [
    { code: 'INVDEMO1', label: 'Pedro' },
    { code: 'INVDEMO2', label: 'Alexia' },
    { code: 'INVDEMO3', label: 'Jordan' },
  ];

  await Promise.all(
    demoInvites.map((invite) =>
      prisma.evaluationInvite.upsert({
        where: { code: invite.code },
        update: { label: invite.label, evaluationId: 'demo-evaluation' },
        create: { evaluationId: 'demo-evaluation', code: invite.code, label: invite.label },
      }),
    ),
  );

  const friendsPackage = await prisma.testPackage.upsert({
    where: { slug: 'friends' },
    update: {},
    create: {
      slug: 'friends',
      title: 'Friends Bundle',
      description: 'Curated activities for friends.',
      context: 'friends',
    },
  });

  const couplesPackage = await prisma.testPackage.upsert({
    where: { slug: 'couples' },
    update: {},
    create: {
      slug: 'couples',
      title: 'Couples Bundle',
      description: 'Conversation starters for couples.',
      context: 'couples',
    },
  });

  await prisma.testPackageItem.upsert({
    where: {
      testPackageId_testDefinitionId: {
        testPackageId: friendsPackage.id,
        testDefinitionId: testDefinition.id,
      },
    },
    update: {
      sortOrder: 1,
      isFree: true,
    },
    create: {
      testPackageId: friendsPackage.id,
      testDefinitionId: testDefinition.id,
      sortOrder: 1,
      isFree: true,
    },
  });

  await prisma.testPackageItem.upsert({
    where: {
      testPackageId_testDefinitionId: {
        testPackageId: couplesPackage.id,
        testDefinitionId: testDefinition.id,
      },
    },
    update: {
      sortOrder: 1,
      isFree: false,
    },
    create: {
      testPackageId: couplesPackage.id,
      testDefinitionId: testDefinition.id,
      sortOrder: 1,
      isFree: false,
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

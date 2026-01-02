import { PrismaClient, OrgRole, EvaluationStatus, ParticipantFeedbackMode } from '@prisma/client';
import argon2 from 'argon2';
import { generateInviteToken, hashInviteToken } from '../src/auth/inviteTokens';

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
        dimensions: [
          { id: 'collaboration', title: 'Colaboración' },
          { id: 'initiative', title: 'Iniciativa' },
        ],
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

  const valuesTestDefinition = await prisma.testDefinition.upsert({
    where: {
      slug_version: { slug: 'scenario-values', version: 1 },
    },
    update: {},
    create: {
      slug: 'scenario-values',
      version: 1,
      title: 'Values Reflection',
      description: 'Short prompts to reflect on everyday choices.',
      styleId: 'classic',
      definition: {
        version: 1,
        slug: 'scenario-values',
        title: 'Values Reflection',
        styleId: 'classic',
        dimensions: [
          { id: 'empathy', title: 'Empatía' },
          { id: 'responsibility', title: 'Responsabilidad' },
        ],
        items: [
          {
            id: 'values-1',
            widgetType: 'scenario_choice',
            prompt: 'A friend forgot their lunch. What do you do?',
            scenario: 'You notice they are embarrassed and quiet.',
            options: [
              { id: 'a', label: 'Share yours', description: 'Offer half of what you brought.' },
              { id: 'b', label: 'Find help', description: 'Ask a teacher if there are extra snacks.' },
              { id: 'c', label: 'Do nothing', description: 'It is not your responsibility.' },
            ],
            scoring: [
              { dimension: 'empathy', delta: 1 },
              { dimension: 'responsibility', delta: 1 },
            ],
          },
          {
            id: 'values-2',
            widgetType: 'scenario_choice',
            prompt: 'A group project needs one last push.',
            scenario: 'Everyone is tired and wants to stop.',
            options: [
              { id: 'a', label: 'Suggest a break', description: 'Pause for five minutes then finish together.' },
              { id: 'b', label: 'Finish alone', description: 'Ask to take the work home and submit it.' },
              { id: 'c', label: 'Ignore it', description: 'Let someone else figure it out.' },
            ],
            scoring: [
              { dimension: 'responsibility', delta: 1 },
            ],
          },
        ],
      },
    },
  });

  const explorationSet = await prisma.camouflageSet.upsert({
    where: { slug: 'exploradores' },
    update: { title: 'Exploradores' },
    create: {
      slug: 'exploradores',
      title: 'Exploradores',
    },
  });

  const teamworkSet = await prisma.camouflageSet.upsert({
    where: { slug: 'aliados' },
    update: { title: 'Aliados' },
    create: {
      slug: 'aliados',
      title: 'Aliados',
    },
  });

  const explorationCharacters = [
    { key: 'farero', title: 'El Farero', imageUrl: 'https://example.com/farero.png', sortOrder: 0 },
    { key: 'cartografo', title: 'La Cartógrafa', imageUrl: 'https://example.com/cartografa.png', sortOrder: 1 },
    { key: 'vigia', title: 'El Vigía', imageUrl: 'https://example.com/vigia.png', sortOrder: 2 },
    { key: 'navegante', title: 'La Navegante', imageUrl: 'https://example.com/navegante.png', sortOrder: 3 },
  ];

  const teamworkCharacters = [
    { key: 'compas', title: 'La Brújula', imageUrl: 'https://example.com/brujula.png', sortOrder: 0 },
    { key: 'puente', title: 'El Puente', imageUrl: 'https://example.com/puente.png', sortOrder: 1 },
    { key: 'ancla', title: 'El Ancla', imageUrl: 'https://example.com/ancla.png', sortOrder: 2 },
    { key: 'guia', title: 'La Guía', imageUrl: 'https://example.com/guia.png', sortOrder: 3 },
  ];

  await Promise.all(
    explorationCharacters.map((character) =>
      prisma.camouflageCharacter.upsert({
        where: {
          setId_key: {
            setId: explorationSet.id,
            key: character.key,
          },
        },
        update: { title: character.title, imageUrl: character.imageUrl, sortOrder: character.sortOrder },
        create: { ...character, setId: explorationSet.id },
      }),
    ),
  );

  await Promise.all(
    teamworkCharacters.map((character) =>
      prisma.camouflageCharacter.upsert({
        where: {
          setId_key: {
            setId: teamworkSet.id,
            key: character.key,
          },
        },
        update: { title: character.title, imageUrl: character.imageUrl, sortOrder: character.sortOrder },
        create: { ...character, setId: teamworkSet.id },
      }),
    ),
  );

  await Promise.all(
    [
      { testDefinitionId: testDefinition.id, camouflageSetId: explorationSet.id, sortOrder: 0 },
      { testDefinitionId: testDefinition.id, camouflageSetId: teamworkSet.id, sortOrder: 1 },
    ].map((option) =>
      prisma.testCamouflageOption.upsert({
        where: {
          testDefinitionId_camouflageSetId: {
            testDefinitionId: option.testDefinitionId,
            camouflageSetId: option.camouflageSetId,
          },
        },
        update: { sortOrder: option.sortOrder, isActive: true },
        create: option,
      }),
    ),
  );

  const slots = [
    { key: 'LOW', rank: 1, title: 'Inicio' },
    { key: 'MID_LOW', rank: 2, title: 'Explorando' },
    { key: 'MID_HIGH', rank: 3, title: 'En marcha' },
    { key: 'HIGH', rank: 4, title: 'Dominio' },
  ];

  await Promise.all(
    slots.map((slot) =>
      prisma.testCamouflageSlot.upsert({
        where: { testDefinitionId_key: { testDefinitionId: testDefinition.id, key: slot.key } },
        update: { rank: slot.rank, title: slot.title },
        create: { ...slot, testDefinitionId: testDefinition.id },
      }),
    ),
  );

  const camouflageContent = [
    {
      setId: explorationSet.id,
      characters: {
        LOW: 'farero',
        MID_LOW: 'cartografo',
        MID_HIGH: 'vigia',
        HIGH: 'navegante',
      },
      copy: {
        LOW: {
          headline: 'Pasos iniciales',
          description: 'Estás tanteando el terreno y observando con calma.',
          tips: ['Tómate un momento para preguntar qué necesitan otros', 'Celebra cada pequeño avance'],
        },
        MID_LOW: {
          headline: 'Mirada atenta',
          description: 'Notas detalles y comienzas a conectar las piezas.',
          tips: ['Comparte tus hallazgos con el equipo', 'Prueba una acción pequeña y observa resultados'],
        },
        MID_HIGH: {
          headline: 'Ruta en construcción',
          description: 'Te atreves a proponer caminos y guiar a otras personas.',
          tips: ['Valida tus ideas con alguien más', 'Ajusta el rumbo si encuentras mejores señales'],
        },
        HIGH: {
          headline: 'Liderando la travesía',
          description: 'Tu iniciativa y curiosidad inspiran a quienes te acompañan.',
          tips: ['Da espacio para que otros exploren', 'Resume lo aprendido antes de seguir avanzando'],
        },
      },
    },
    {
      setId: teamworkSet.id,
      characters: {
        LOW: 'compas',
        MID_LOW: 'puente',
        MID_HIGH: 'ancla',
        HIGH: 'guia',
      },
      copy: {
        LOW: {
          headline: 'En sintonía',
          description: 'Prefieres observar y escuchar antes de moverte.',
          tips: ['Haz una pregunta que desbloquee al equipo', 'Comparte una idea sencilla para avanzar'],
        },
        MID_LOW: {
          headline: 'Aliado activo',
          description: 'Acompañas y conectas a quienes te rodean.',
          tips: ['Reconoce los aportes de cada persona', 'Resume acuerdos breves para mantener claridad'],
        },
        MID_HIGH: {
          headline: 'Ancla confiable',
          description: 'Das soporte y estabilidad al grupo.',
          tips: ['Comparte riesgos que ves en el camino', 'Pregunta cómo puedes destrabar a alguien'],
        },
        HIGH: {
          headline: 'Guía colaborativa',
          description: 'Inspirar y cuidar al equipo te sale natural.',
          tips: ['Invita a otras voces antes de decidir', 'Divide los siguientes pasos en acciones claras'],
        },
      },
    },
  ];

  for (const content of camouflageContent) {
    for (const slot of slots) {
      const characterKey = content.characters[slot.key as keyof typeof content.characters];
      if (characterKey) {
        const character = await prisma.camouflageCharacter.findUnique({
          where: { setId_key: { setId: content.setId, key: characterKey } },
        });

        if (character) {
          await prisma.testCamouflageMapping.upsert({
            where: {
              testDefinitionId_camouflageSetId_slotKey: {
                testDefinitionId: testDefinition.id,
                camouflageSetId: content.setId,
                slotKey: slot.key,
              },
            },
            update: { characterId: character.id },
            create: {
              testDefinitionId: testDefinition.id,
              camouflageSetId: content.setId,
              slotKey: slot.key,
              characterId: character.id,
            },
          });
        }
      }

      const slotCopy = content.copy[slot.key as keyof typeof content.copy];
      if (slotCopy) {
        await prisma.testCamouflageCopy.upsert({
          where: {
            testDefinitionId_camouflageSetId_slotKey: {
              testDefinitionId: testDefinition.id,
              camouflageSetId: content.setId,
              slotKey: slot.key,
            },
          },
          update: {
            headline: slotCopy.headline,
            description: slotCopy.description,
            tips: slotCopy.tips,
          },
          create: {
            testDefinitionId: testDefinition.id,
            camouflageSetId: content.setId,
            slotKey: slot.key,
            headline: slotCopy.headline,
            description: slotCopy.description,
            tips: slotCopy.tips,
          },
        });
      }
    }
  }

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
      camouflageSetId: explorationSet.id,
    },
    create: {
      evaluationId: 'demo-evaluation',
      testDefinitionId: testDefinition.id,
      sortOrder: 1,
      camouflageSetId: explorationSet.id,
    },
  });

  await prisma.evaluationTest.upsert({
    where: {
      evaluationId_testDefinitionId: {
        evaluationId: 'demo-evaluation',
        testDefinitionId: valuesTestDefinition.id,
      },
    },
    update: {
      sortOrder: 2,
      camouflageSetId: explorationSet.id,
    },
    create: {
      evaluationId: 'demo-evaluation',
      testDefinitionId: valuesTestDefinition.id,
      sortOrder: 2,
      camouflageSetId: explorationSet.id,
    },
  });

  const demoInvites = [
    { token: 'INVDEMO1TOKEN', alias: 'Pedro' },
    { token: 'INVDEMO2TOKEN', alias: 'Alexia' },
    { token: 'INVDEMO3TOKEN', alias: 'Jordan' },
  ];

  await Promise.all(
    demoInvites.map((invite) =>
      prisma.invite.upsert({
        where: { token: invite.token },
        update: { alias: invite.alias, evaluationId: 'demo-evaluation', tokenHash: hashInviteToken(invite.token) },
        create: {
          evaluationId: 'demo-evaluation',
          token: invite.token,
          tokenHash: hashInviteToken(invite.token),
          alias: invite.alias,
        },
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
        testPackageId: friendsPackage.id,
        testDefinitionId: valuesTestDefinition.id,
      },
    },
    update: {
      sortOrder: 2,
      isFree: true,
    },
    create: {
      testPackageId: friendsPackage.id,
      testDefinitionId: valuesTestDefinition.id,
      sortOrder: 2,
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

  await prisma.testPackageItem.upsert({
    where: {
      testPackageId_testDefinitionId: {
        testPackageId: couplesPackage.id,
        testDefinitionId: valuesTestDefinition.id,
      },
    },
    update: {
      sortOrder: 2,
      isFree: false,
    },
    create: {
      testPackageId: couplesPackage.id,
      testDefinitionId: valuesTestDefinition.id,
      sortOrder: 2,
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

export type CamouflageInput = Array<{ dimension: string; value: number }>;

export type CamouflageResult = {
  archetypeId: string;
  title: string;
  description: string;
  traits: string[];
  tips: string[];
};

const archetypes: CamouflageResult[] = [
  {
    archetypeId: 'estratega',
    title: 'El Estratega',
    description: 'Piensas a futuro y organizas tus pasos con calma.',
    traits: ['Planifica con claridad', 'Escucha antes de actuar', 'Prefiere decisiones informadas'],
    tips: ['Comparte tus ideas visualmente', 'Invita a otros a proponer alternativas', 'Date permiso para probar rápido'],
  },
  {
    archetypeId: 'aliado',
    title: 'El Aliado',
    description: 'Sueles cuidar al equipo y crear un ambiente seguro.',
    traits: ['Empatía visible', 'Busca acuerdos', 'Atento a las emociones del grupo'],
    tips: ['Pide apoyo cuando lo necesites', 'Celebra los pequeños avances del equipo', 'Propón rituales breves para alinear expectativas'],
  },
  {
    archetypeId: 'explorador',
    title: 'El Explorador',
    description: 'Prefieres aprender probando y descubriendo rutas nuevas.',
    traits: ['Curioso', 'Aprende haciendo', 'Abierto al cambio'],
    tips: ['Documenta tus hallazgos sencillos', 'Pregunta qué descubrieron otras personas', 'Define un tiempo corto para experimentar'],
  },
  {
    archetypeId: 'puente',
    title: 'El Puente',
    description: 'Conectas ideas y personas para que avancen juntas.',
    traits: ['Facilita conversaciones', 'Traduce necesidades', 'Promueve la colaboración'],
    tips: ['Resume acuerdos en pocas frases', 'Escucha las voces más silenciosas', 'Aclara próximos pasos antes de cerrar'],
  },
  {
    archetypeId: 'impulsor',
    title: 'El Impulsor',
    description: 'Te gusta activar la energía del grupo y mover las cosas.',
    traits: ['Inicia con rapidez', 'Motiva al equipo', 'Mantiene el ritmo'],
    tips: ['Acuerda prioridades antes de avanzar', 'Haz pausas cortas para escuchar', 'Comparte el plan con anticipación'],
  },
  {
    archetypeId: 'arquero',
    title: 'El Arquero',
    description: 'Apuntas a la meta y te concentras en alcanzar resultados claros.',
    traits: ['Enfoque en objetivos', 'Busca precisión', 'Evalúa el progreso con frecuencia'],
    tips: ['Divide la meta en hitos pequeños', 'Solicita retroalimentación concreta', 'Reconoce el esfuerzo de quienes te rodean'],
  },
  {
    archetypeId: 'farero',
    title: 'El Farero',
    description: 'Das dirección y compartes señales para que nadie se pierda.',
    traits: ['Aclara el propósito', 'Comunica con calma', 'Ofrece contexto'],
    tips: ['Pregunta qué necesita más claridad', 'Cuida que todos comprendan el porqué', 'Usa ejemplos sencillos al explicar'],
  },
  {
    archetypeId: 'guardian',
    title: 'El Guardián',
    description: 'Proteges la calidad y cuidas los detalles importantes.',
    traits: ['Atención a riesgos', 'Valora la consistencia', 'Revisa el trabajo con cuidado'],
    tips: ['Define criterios simples de calidad', 'Comparte alertas con anticipación', 'Equilibra el perfeccionismo con la entrega'],
  },
];

function chooseArchetypeIndex(key: string) {
  const seed = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return seed % archetypes.length;
}

export function resolveCamouflage(scores: CamouflageInput): CamouflageResult {
  const ordered = [...scores].sort((a, b) => b.value - a.value);
  const topOne = ordered[0]?.dimension ?? 'colaboración';
  const topTwo = ordered[1]?.dimension ?? 'iniciativa';
  const lowest = ordered[ordered.length - 1]?.dimension ?? 'balance';
  const signature = `${topOne}|${topTwo}|${lowest}`.toLowerCase();
  const selected = archetypes[chooseArchetypeIndex(signature)];

  const personalizedTraits = [
    `Te apoyas mucho en ${topOne}.`,
    `También brilla tu forma de trabajar en ${topTwo}.`,
    `Podrías explorar más ${lowest}.`,
  ];

  return {
    archetypeId: selected.archetypeId,
    title: selected.title,
    description: `${selected.description} Hoy destacaron ${topOne} y ${topTwo}.`,
    traits: [...selected.traits, ...personalizedTraits],
    tips: [
      ...selected.tips,
      `Comparte con alguien cómo fortaleces ${topOne} y ${topTwo}.`,
      `Prueba una acción pequeña para cuidar ${lowest}.`,
    ],
  };
}

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const offers = [
  {
    external_id: 'seed-001',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-001',
    source_type: 'jobboard',
    title: 'Data Engineer',
    description:
      "Construire et maintenir des pipelines de données pour des produits à forte audience. Collaboration étroite avec les équipes produit et data science. Tu seras responsable de la fiabilité des flux, de l'observabilité et de la qualité des données.",
    description_preview:
      'Pipelines de données, observabilité et qualité pour une scale-up santé en pleine croissance.',
    raw_description:
      "Stack: Python, SQL, BigQuery, dbt, Airflow. Suivi des SLAs, optimisation des coûts, documentation des datasets. Onboardings réguliers, pair programming, culture data-driven.",
    status: 'active',
    published_at: new Date('2026-05-02T09:12:00Z'),
    small_company: {
      create: {
        company_name: 'Alan',
        company_type_explicit: 'Assurance santé',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'alan.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Dès que possible',
        salary_min: 48000,
        salary_max: 65000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 65000,
        remote_policy_frequency: '2 jours/semaine',
        remote_policy_days_per_week: 2,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }, { contract_type: 'Temps plein' }],
    },
    skills: {
      create: [
        { skill_name: 'Python' },
        { skill_name: 'SQL' },
        { skill_name: 'BigQuery' },
        { skill_name: 'Airflow' },
        { skill_name: 'dbt' },
      ],
    },
    tags: {
      create: [
        { tag: 'Data' },
        { tag: 'Engineering' },
        { tag: 'Analytics' },
        { tag: 'Cloud' },
      ],
    },
    formatted_places: {
      create: [{ place: 'Paris', position: 1 }],
    },
  },
  {
    external_id: 'seed-002',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-002',
    source_type: 'jobboard',
    title: 'Backend Engineer Node.js',
    description:
      "Développement d’API performantes et sécurisées pour une plateforme fintech B2B. Forte exigence de qualité, performances et robustesse. Tu travailleras avec les équipes produit et sécurité.",
    description_preview:
      'Node.js, TypeScript, microservices, haute disponibilité.',
    raw_description:
      'Responsable des endpoints critiques, sécurité JWT, monitoring Datadog, CI/CD GitHub Actions. Scalabilité et observabilité au cœur des enjeux.',
    status: 'active',
    published_at: new Date('2026-05-01T08:30:00Z'),
    small_company: {
      create: {
        company_name: 'Qonto',
        company_type_explicit: 'Fintech',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'qonto.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Octobre 2026',
        salary_min: 55000,
        salary_max: 75000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 75000,
        remote_policy_frequency: '3 jours/semaine',
        remote_policy_days_per_week: 3,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }, { contract_type: 'Temps plein' }],
    },
    skills: {
      create: [
        { skill_name: 'Node.js' },
        { skill_name: 'TypeScript' },
        { skill_name: 'PostgreSQL' },
        { skill_name: 'Redis' },
        { skill_name: 'Docker' },
      ],
    },
    tags: {
      create: [{ tag: 'Backend' }, { tag: 'API' }, { tag: 'Fintech' }],
    },
    formatted_places: {
      create: [{ place: 'Paris', position: 1 }],
    },
  },
  {
    external_id: 'seed-003',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-003',
    source_type: 'jobboard',
    title: 'Frontend React',
    description:
      "Créer des interfaces fluides et accessibles pour une app e-santé. Travail étroit avec UX/UI, mise en place d'un design system et d'animations soignées.",
    description_preview: 'React 19, design system, accessibilité, performance.',
    raw_description:
      'Tu implémenteras des parcours patients, tests e2e et animations framer-motion. Stack : React, Vite, Tailwind, Playwright.',
    status: 'active',
    published_at: new Date('2026-05-03T10:15:00Z'),
    small_company: {
      create: {
        company_name: 'Doctolib',
        company_type_explicit: 'E-santé',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'doctolib.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Septembre 2026',
        salary_min: 42000,
        salary_max: 60000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 60000,
        remote_policy_frequency: '2 jours/semaine',
        remote_policy_days_per_week: 2,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }, { contract_type: 'Temps plein' }],
    },
    skills: {
      create: [
        { skill_name: 'React' },
        { skill_name: 'TypeScript' },
        { skill_name: 'Tailwind' },
        { skill_name: 'Accessibilité' },
        { skill_name: 'Framer Motion' },
      ],
    },
    tags: {
      create: [{ tag: 'Frontend' }, { tag: 'Design system' }, { tag: 'UX' }],
    },
    formatted_places: {
      create: [{ place: 'Nantes', position: 1 }],
    },
  },
  {
    external_id: 'seed-004',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-004',
    source_type: 'jobboard',
    title: 'Product Designer',
    description:
      "Concevoir des expériences utilisateurs centrées sur les besoins, du research aux tests utilisateurs. Tu travailleras avec les PM et l'équipe technique.",
    description_preview: 'Design system, Figma, recherche utilisateur, prototypage.',
    raw_description:
      "Tu mèneras des interviews clients, prototypage rapide, tests d'usabilité et ateliers de co-conception.",
    status: 'active',
    published_at: new Date('2026-05-04T13:45:00Z'),
    small_company: {
      create: {
        company_name: 'Mirakl',
        company_type_explicit: 'Marketplace B2B',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'mirakl.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Novembre 2026',
        salary_min: 40000,
        salary_max: 54000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 54000,
        remote_policy_frequency: '2 jours/semaine',
        remote_policy_days_per_week: 2,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }],
    },
    skills: {
      create: [
        { skill_name: 'Figma' },
        { skill_name: 'User Research' },
        { skill_name: 'Design System' },
        { skill_name: 'Prototypage' },
      ],
    },
    tags: {
      create: [{ tag: 'Design' }, { tag: 'Produit' }, { tag: 'UX Research' }],
    },
    formatted_places: {
      create: [{ place: 'Bordeaux', position: 1 }],
    },
  },
  {
    external_id: 'seed-005',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-005',
    source_type: 'jobboard',
    title: 'DevOps Engineer',
    description:
      "Automatiser les déploiements et la supervision d’une plateforme e-commerce circulaire. Tu participeras aux choix d'architecture cloud.",
    description_preview: 'Terraform, Kubernetes, observabilité, SRE.',
    raw_description:
      'Stack : GCP, Terraform, ArgoCD, Prometheus. Participation aux astreintes 1 fois/mois.',
    status: 'active',
    published_at: new Date('2026-04-28T07:50:00Z'),
    small_company: {
      create: {
        company_name: 'Back Market',
        company_type_explicit: 'E-commerce circulaire',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'backmarket.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Remote',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Août 2026',
        salary_min: 60000,
        salary_max: 82000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 82000,
        remote_policy_frequency: 'Full remote',
        remote_policy_days_per_week: 5,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }, { contract_type: 'Remote' }],
    },
    skills: {
      create: [
        { skill_name: 'Terraform' },
        { skill_name: 'Kubernetes' },
        { skill_name: 'GCP' },
        { skill_name: 'Prometheus' },
        { skill_name: 'ArgoCD' },
      ],
    },
    tags: {
      create: [{ tag: 'DevOps' }, { tag: 'SRE' }, { tag: 'Cloud' }],
    },
    formatted_places: {
      create: [{ place: 'Remote', position: 1 }],
    },
  },
  {
    external_id: 'seed-006',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-006',
    source_type: 'jobboard',
    title: 'Data Analyst',
    description:
      "Analyser les données pour guider les décisions produit et marketing. Focus sur les KPIs d’acquisition et de rétention.",
    description_preview: 'SQL, Looker, cohortes, dashboards, ROI campagnes.',
    raw_description:
      'Tu créeras des dashboards self-service et des analyses ad hoc. Stack : BigQuery, dbt, Looker.',
    status: 'active',
    published_at: new Date('2026-05-05T11:20:00Z'),
    small_company: {
      create: {
        company_name: 'PayFit',
        company_type_explicit: 'HR Tech',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'payfit.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Juillet 2026',
        salary_min: 38000,
        salary_max: 50000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 50000,
        remote_policy_frequency: '2 jours/semaine',
        remote_policy_days_per_week: 2,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }],
    },
    skills: {
      create: [
        { skill_name: 'SQL' },
        { skill_name: 'Looker' },
        { skill_name: 'dbt' },
        { skill_name: 'BigQuery' },
      ],
    },
    tags: {
      create: [{ tag: 'Data' }, { tag: 'Analytics' }, { tag: 'Marketing' }],
    },
    formatted_places: {
      create: [{ place: 'Lyon', position: 1 }],
    },
  },
  {
    external_id: 'seed-007',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-007',
    source_type: 'jobboard',
    title: 'Full-stack Engineer',
    description:
      "Développer des fonctionnalités end-to-end sur une stack JS (React + Node). Ownership complet des features, de la discovery à la livraison.",
    description_preview: 'React, Node, PostgreSQL, ownership complet sur features.',
    raw_description:
      'Tu livreras des features de bout en bout, avec tests unitaires et monitoring. Stack : TS, Prisma, Postgres.',
    status: 'active',
    published_at: new Date('2026-05-06T09:05:00Z'),
    small_company: {
      create: {
        company_name: 'Swile',
        company_type_explicit: 'Benefits & payroll',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'swile.co',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Septembre 2026',
        salary_min: 48000,
        salary_max: 65000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 65000,
        remote_policy_frequency: '2 jours/semaine',
        remote_policy_days_per_week: 2,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }, { contract_type: 'Temps plein' }],
    },
    skills: {
      create: [
        { skill_name: 'React' },
        { skill_name: 'Node.js' },
        { skill_name: 'Prisma' },
        { skill_name: 'PostgreSQL' },
        { skill_name: 'Monitoring' },
      ],
    },
    tags: {
      create: [{ tag: 'Fullstack' }, { tag: 'SaaS' }, { tag: 'Fintech' }],
    },
    formatted_places: {
      create: [{ place: 'Montpellier', position: 1 }],
    },
  },
  {
    external_id: 'seed-008',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-008',
    source_type: 'jobboard',
    title: 'QA Engineer',
    description:
      "Garantir la qualité logicielle et automatiser les tests sur une app mobile internationale. Définir les scénarios critiques et la stratégie QA.",
    description_preview: 'Automatisation E2E, Playwright, CI/CD.',
    raw_description:
      'Tu renforceras la suite de tests et la stratégie qualité (unit, integration, E2E).',
    status: 'active',
    published_at: new Date('2026-05-06T15:40:00Z'),
    small_company: {
      create: {
        company_name: 'BlaBlaCar',
        company_type_explicit: 'Mobilité',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'blablacar.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Hybride',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Septembre 2026',
        salary_min: 42000,
        salary_max: 56000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 56000,
        remote_policy_frequency: '2 jours/semaine',
        remote_policy_days_per_week: 2,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }],
    },
    skills: {
      create: [
        { skill_name: 'Playwright' },
        { skill_name: 'Cypress' },
        { skill_name: 'Test Strategy' },
        { skill_name: 'QA Automation' },
      ],
    },
    tags: {
      create: [{ tag: 'QA' }, { tag: 'Mobile' }, { tag: 'Automation' }],
    },
    formatted_places: {
      create: [{ place: 'Paris', position: 1 }],
    },
  },
  {
    external_id: 'seed-009',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-009',
    source_type: 'jobboard',
    title: 'Product Manager',
    description:
      "Piloter la roadmap et coordonner les équipes pour une app banking grand public. Tu travailleras sur la discovery, la data et la delivery.",
    description_preview: 'Discovery, roadmap, delivery, analytics, growth.',
    raw_description:
      "Définition de la vision produit, mise en place d’OKR, mesure d’impact et coordination multi-squad.",
    status: 'active',
    published_at: new Date('2026-05-02T12:10:00Z'),
    small_company: {
      create: {
        company_name: 'Lydia',
        company_type_explicit: 'Banque mobile',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'lydia-app.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Remote',
        contract_permanent: true,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Octobre 2026',
        salary_min: 58000,
        salary_max: 78000,
        salary_currency: 'EUR',
        salary_recurrence: 'année',
        salary_max_per_year: 78000,
        remote_policy_frequency: 'Full remote',
        remote_policy_days_per_week: 5,
      },
    },
    contract_types: {
      create: [{ contract_type: 'CDI' }, { contract_type: 'Remote' }],
    },
    skills: {
      create: [
        { skill_name: 'Product Discovery' },
        { skill_name: 'Roadmap' },
        { skill_name: 'Analytics' },
        { skill_name: 'Growth' },
      ],
    },
    tags: {
      create: [{ tag: 'Produit' }, { tag: 'Leadership' }, { tag: 'Fintech' }],
    },
    formatted_places: {
      create: [{ place: 'Remote', position: 1 }],
    },
  },
  {
    external_id: 'seed-010',
    source: 'seed',
    source_reference: 'https://example.com/jobs/seed-010',
    source_type: 'jobboard',
    title: 'Stage Développeur Front',
    description:
      "Participer au développement d’une app web moderne et apprendre les bonnes pratiques. Encadrement par un lead front et des revues de code régulières.",
    description_preview: 'Stage 6 mois, React, TypeScript, mentorat senior.',
    raw_description:
      "Tu participeras aux features UI, aux tests et à l’intégration d’API. Encadrement par un lead front, onboarding structuré.",
    status: 'active',
    published_at: new Date('2026-05-07T09:00:00Z'),
    small_company: {
      create: {
        company_name: 'Orange',
        company_type_explicit: 'Telecom',
        fallback_gallery_url: 'https://placehold.co/64x64',
        handle: 'orange.com',
      },
    },
    details: {
      create: {
        accept_remote: 'Sur site',
        contract_permanent: false,
        currency: 'EUR',
        locale: 'fr-FR',
        start: 'Juin 2026',
        salary_min: 1100,
        salary_max: 1200,
        salary_currency: 'EUR',
        salary_recurrence: 'mois',
        salary_max_per_year: 14400,
        remote_policy_frequency: 'Sur site',
        remote_policy_days_per_week: 0,
      },
    },
    contract_types: {
      create: [{ contract_type: 'Stage' }],
    },
    skills: {
      create: [
        { skill_name: 'React' },
        { skill_name: 'TypeScript' },
        { skill_name: 'Testing' },
        { skill_name: 'UI' },
      ],
    },
    tags: {
      create: [{ tag: 'Stage' }, { tag: 'Frontend' }, { tag: 'Junior' }],
    },
    formatted_places: {
      create: [{ place: 'Toulouse', position: 1 }],
    },
  },
];

const main = async () => {
  await Promise.all(
    offers.map((offer) =>
      prisma.offer.create({ data: offer as unknown as Prisma.OfferCreateInput })
    )
  );
  console.log('✅ 10 offres seedées');
};

main()
  .catch((error) => {
    console.error('❌ Erreur seed offers:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

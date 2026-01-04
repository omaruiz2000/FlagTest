export const SCHOOL_PACKAGE_SLUG = 'school';

export const DEFAULT_PACKAGES = [
  { slug: SCHOOL_PACKAGE_SLUG, title: 'School Bundle', description: 'Roster-based flow with one link per evaluation.' },
  { slug: 'friends', title: 'Friends', description: 'Great for small groups of friends.' },
  { slug: 'couples', title: 'Couples', description: 'Invite-based experience for couples.' },
];

export const DEFAULT_PACKAGE_SLUGS = DEFAULT_PACKAGES.map((pkg) => pkg.slug);

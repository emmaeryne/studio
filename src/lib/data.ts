export type CaseDocument = {
  name: string;
  url: string;
  summary?: string;
  'data-ai-hint'?: string;
};

export type Appointment = {
  date: string;
  time: string;
  notes: string;
};

export type Deadline = {
  date: string;
  description: string;
};

export type Case = {
  id: string;
  caseNumber: string;
  clientName: string;
  caseType: 'Litige civil' | 'Droit pénal' | 'Droit de la famille' | 'Droit des sociétés';
  status: 'Nouveau' | 'En cours' | 'Clôturé';
  submittedDate: string;
  lastUpdate: string;
  description: string;
  documents: CaseDocument[];
  appointments: Appointment[];
  keyDeadlines: Deadline[];
};

export const cases: Case[] = [
  {
    id: '1',
    caseNumber: 'CASE-001',
    clientName: 'Alice Martin',
    caseType: 'Droit de la famille',
    status: 'En cours',
    submittedDate: '2023-10-15',
    lastUpdate: '2024-05-20',
    description: 'Affaire de divorce et de garde d\'enfants. La cliente souhaite la garde exclusive et une pension alimentaire.',
    documents: [
      { name: 'Contrat de mariage.pdf', url: '#' },
      { name: 'Preuves de revenus.pdf', url: '#' },
    ],
    appointments: [{ date: '2024-07-10', time: '10:00', notes: 'Préparation audience' }],
    keyDeadlines: [{ date: '2024-07-20', description: 'Audience principale' }],
  },
  {
    id: '2',
    caseNumber: 'CASE-002',
    clientName: 'Bernard Petit',
    caseType: 'Litige civil',
    status: 'Nouveau',
    submittedDate: '2024-05-10',
    lastUpdate: '2024-05-10',
    description: 'Litige avec un voisin concernant une délimitation de propriété. Le client a reçu une mise en demeure.',
    documents: [{ name: 'Mise en demeure.pdf', url: '#' }, { name: 'Plan cadastral.png', url: '#', 'data-ai-hint': 'map blueprint' }],
    appointments: [],
    keyDeadlines: [{ date: '2024-06-15', description: 'Réponse à la mise en demeure' }],
  },
  {
    id: '3',
    caseNumber: 'CASE-003',
    clientName: 'Société Innovatech',
    caseType: 'Droit des sociétés',
    status: 'En cours',
    submittedDate: '2024-02-01',
    lastUpdate: '2024-04-25',
    description: 'Rédaction des statuts et immatriculation d\'une nouvelle filiale à l\'étranger.',
    documents: [{ name: 'Projet de statuts.docx', url: '#' }],
    appointments: [],
    keyDeadlines: [{ date: '2024-08-01', description: 'Finalisation immatriculation' }],
  },
  {
    id: '4',
    caseNumber: 'CASE-004',
    clientName: 'Carole Duval',
    caseType: 'Droit pénal',
    status: 'Clôturé',
    submittedDate: '2023-01-20',
    lastUpdate: '2024-03-15',
    description: 'Défense dans une affaire de vol simple. Le client a été relaxé.',
    documents: [],
    appointments: [],
    keyDeadlines: [],
  },
  {
    id: '5',
    caseNumber: 'CASE-005',
    clientName: 'David Moreau',
    caseType: 'Litige civil',
    status: 'Nouveau',
    submittedDate: '2024-05-22',
    lastUpdate: '2024-05-22',
    description: 'Contestation d\'une facture d\'artisan pour malfaçons sur des travaux de rénovation.',
    documents: [{ name: 'Devis signé.pdf', url: '#' }, { name: 'Photos malfaçons.zip', url: '#' }],
    appointments: [{ date: '2024-06-05', time: '14:00', notes: 'Premier rendez-vous' }],
    keyDeadlines: [],
  },
];

export const user = {
    name: 'Maître Dupont',
    email: 'm.dupont@cabinet-legal.fr',
    role: 'Avocat',
    avatar: 'https://placehold.co/100x100.png',
};

export const appointments: (Appointment & {clientName: string, caseId: string})[] = cases.flatMap(c => c.appointments.map(a => ({...a, clientName: c.clientName, caseId: c.id})))
  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export type CaseDocument = {
  name: string;
  url: string;
  summary?: string;
  'data-ai-hint'?: string;
};

export type Appointment = {
  id: string;
  date: string;
  time: string;
  notes: string;
  caseId: string;
  status: 'Confirmé' | 'En attente' | 'Annulé' | 'Reporté';
};

export type Deadline = {
  date: string;
  description: string;
};

export type Case = {
  id: string;
  caseNumber: string;
  clientName: string;
  clientAvatar: string;
  clientId: string;
  caseType: 'Litige civil' | 'Droit pénal' | 'Droit de la famille' | 'Droit des sociétés' | 'Autre';
  status: 'Nouveau' | 'En cours' | 'Clôturé' | 'En attente du client';
  submittedDate: string;
  lastUpdate: string;
  description: string;
  documents: CaseDocument[];
  appointments: Omit<Appointment, 'caseId' | 'clientName'>[];
  keyDeadlines: Deadline[];
  _estimate?: CaseCostEstimate; // Temporary field for estimate
};

export type CaseCostEstimate = {
  estimatedCost: string;
  justification: string;
}

export type Message = {
    id: string;
    senderId: string; // email
    content: string;
    timestamp: string;
    read?: boolean;
};

export type Conversation = {
    id: string;
    caseId: string;
    caseNumber: string;
    clientName: string;
    clientAvatar: string;
    unreadCount: number;
    messages: Message[];
};

export type Lawyer = {
    name:string;
    email: string;
    role: string;
    avatar: string;
    specialty?: string;
    phone?: string;
}

export type Client = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    address?: string;
    phone?: string;
};

export type Notification = {
    id: string;
    userId: string; // The ID of the user to notify
    message: string;
    read: boolean;
    date: string;
};

export type Invoice = {
  id: string;
  clientId: string;
  caseId: string;
  caseNumber: string;
  number: string;
  date: string;
  amount: number;
  status: 'Payée' | 'En attente';
}

const lawyer: Lawyer = {
    name: 'Maître Dupont',
    email: 'm.dupont@cabinet-legal.fr',
    role: 'Avocat',
    avatar: 'https://placehold.co/100x100.png',
};

const clients: Client[] = [
  {
    id: 'client-alice',
    name: 'Alice Martin',
    email: 'alice.martin@email.com',
    avatar: 'https://placehold.co/100x100.png?text=AM',
    address: '123 Rue de la Paix, 75001 Paris',
    phone: '06 12 34 56 78'
  },
  {
    id: 'client-bernard',
    name: 'Bernard Petit',
    email: 'bernard.petit@email.com',
    avatar: 'https://placehold.co/100x100.png?text=BP',
    address: '45 Avenue des Champs-Élysées, 75008 Paris',
    phone: '06 98 76 54 32'
  },
  {
    id: 'client-carole',
    name: 'Carole Duval',
    email: 'carole.duval@email.com',
    avatar: 'https://placehold.co/100x100.png?text=CD',
    address: '78 Boulevard Saint-Germain, 75005 Paris',
    phone: '06 11 22 33 44'
  },
  {
    id: 'client-david',
    name: 'David Moreau',
    email: 'david.moreau@email.com',
    avatar: 'https://placehold.co/100x100.png?text=DM',
    address: '5 Rue du Faubourg Saint-Honoré, 75008 Paris',
    phone: '06 55 66 77 88'
  },
  {
    id: 'client-innovatech',
    name: 'Société Innovatech',
    email: 'contact@innovatech.com',
    avatar: 'https://placehold.co/100x100.png?text=SI',
    address: '1 Place de la Bourse, 75002 Paris',
    phone: '01 23 45 67 89'
  }
];

export const user = {
  lawyer,
  clients,
  // We can imagine a login system would set the current user
  currentUser: clients[0], 
};

export const cases: Case[] = [
  {
    id: '1',
    caseNumber: 'CASE-001',
    clientName: 'Alice Martin',
    clientAvatar: 'https://placehold.co/100x100.png?text=AM',
    clientId: 'client-alice',
    caseType: 'Droit de la famille',
    status: 'En cours',
    submittedDate: '2023-10-15',
    lastUpdate: '2024-05-20',
    description: 'Affaire de divorce et de garde d\'enfants. La cliente souhaite la garde exclusive et une pension alimentaire.',
    documents: [
      { name: 'Contrat de mariage.pdf', url: '#' },
      { name: 'Preuves de revenus.pdf', url: '#' },
    ],
    appointments: [{ id: 'apt-1', date: '2024-07-10', time: '10:00', notes: 'Préparation audience', status: 'Confirmé' }],
    keyDeadlines: [{ date: '2024-07-20', description: 'Audience principale' }],
  },
  {
    id: '2',
    caseNumber: 'CASE-002',
    clientName: 'Bernard Petit',
    clientAvatar: 'https://placehold.co/100x100.png?text=BP',
    clientId: 'client-bernard',
    caseType: 'Litige civil',
    status: 'En attente du client',
    submittedDate: '2024-05-10',
    lastUpdate: '2024-05-10',
    description: 'Litige avec un voisin concernant une délimitation de propriété. Le client a reçu une mise en demeure.',
    documents: [{ name: 'Mise en demeure.pdf', url: '#' }, { name: 'Plan cadastral.png', url: '#', "data-ai-hint": 'map blueprint' }],
    appointments: [{ id: 'apt-3', date: '2024-07-12', time: '11:00', notes: 'Discuter de la réponse', status: 'En attente' }],
    keyDeadlines: [{ date: '2024-06-15', description: 'Réponse à la mise en demeure' }],
  },
  {
    id: '3',
    caseNumber: 'CASE-003',
    clientName: 'Société Innovatech',
    clientAvatar: 'https://placehold.co/100x100.png?text=SI',
    clientId: 'client-innovatech',
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
    clientAvatar: 'https://placehold.co/100x100.png?text=CD',
    clientId: 'client-carole',
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
    clientAvatar: 'https://placehold.co/100x100.png?text=DM',
    clientId: 'client-david',
    caseType: 'Litige civil',
    status: 'Nouveau',
    submittedDate: '2024-05-22',
    lastUpdate: '2024-05-22',
    description: 'Contestation d\'une facture d\'artisan pour malfaçons sur des travaux de rénovation.',
    documents: [{ name: 'Devis signé.pdf', url: '#' }, { name: 'Photos malfaçons.zip', url: '#' }],
    appointments: [{ id: 'apt-2', date: '2024-07-25', time: '14:00', notes: 'Premier rendez-vous', status: 'En attente' }],
    keyDeadlines: [],
  },
];

export const notifications: Notification[] = [
    { id: 'notif-1', userId: 'client-carole', message: 'Votre affaire CASE-004 a été clôturée.', read: false, date: '2024-03-15' },
    { id: 'notif-2', userId: 'client-alice', message: 'Rappel: Rendez-vous le 10/07/2024 à 10:00 avec Maître Dupont.', read: false, date: '2024-07-09' },
    { id: 'notif-3', userId: 'client-alice', message: 'Un nouveau document a été ajouté à votre affaire CASE-001.', read: true, date: '2024-05-18' },
];

export const invoices: Invoice[] = [
    { id: 'inv-1', clientId: 'client-alice', caseId: '1', caseNumber: 'CASE-001', number: 'FACT-2024-001', date: '2024-05-01', amount: 750.00, status: 'En attente' },
    { id: 'inv-2', clientId: 'client-alice', caseId: '1', caseNumber: 'CASE-001', number: 'FACT-2024-002', date: '2024-06-01', amount: 500.00, status: 'En attente' },
    { id: 'inv-3', clientId: 'client-carole', caseId: '4', caseNumber: 'CASE-004', number: 'FACT-2024-003', date: '2024-03-20', amount: 1500.00, status: 'Payée' },
];

export const appointments: (Appointment & {clientName: string})[] = cases.flatMap(c => c.appointments.map(a => ({...a, clientName: c.clientName, caseId: c.id})))
  .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const conversations: Conversation[] = [
    {
        id: 'conv-1',
        caseId: '1',
        caseNumber: 'CASE-001',
        clientName: 'Alice Martin',
        clientAvatar: 'https://placehold.co/100x100.png?text=AM',
        unreadCount: 1,
        messages: [
            { id: 'msg-1-1', senderId: 'alice.martin@email.com', content: "Bonjour Maître, avez-vous pu regarder les documents que je vous ai envoyés ?", timestamp: '2024-05-23T10:00:00Z' },
            { id: 'msg-1-2', senderId: user.lawyer.email, content: "Bonjour Madame Martin, oui je les ai bien reçus. Je reviens vers vous rapidement.", timestamp: '2024-05-23T10:05:00Z' },
        ]
    },
    {
        id: 'conv-2',
        caseId: '2',
        caseNumber: 'CASE-002',
        clientName: 'Bernard Petit',
        clientAvatar: 'https://placehold.co/100x100.png?text=BP',
        unreadCount: 0,
        messages: [
            { id: 'msg-2-1', senderId: user.lawyer.email, content: "Monsieur Petit, j'ai bien avancé sur votre dossier. Pourriez-vous me fournir une copie de l'acte de propriété ?", timestamp: '2024-05-22T11:00:00Z' },
            { id: 'msg-2-2', senderId: 'bernard.petit@email.com', content: "Bonjour Maître, oui bien sûr. Je vous envoie ça dans la journée. Merci.", timestamp: '2024-05-22T11:30:00Z' },
        ]
    },
    {
        id: 'conv-3',
        caseId: '5',
        caseNumber: 'CASE-005',
        clientName: 'David Moreau',
        clientAvatar: 'https://placehold.co/100x100.png?text=DM',
        unreadCount: 2,
        messages: [
            { id: 'msg-3-1', senderId: 'david.moreau@email.com', content: "Maître, l'artisan me relance pour le paiement. Que dois-je faire ?", timestamp: '2024-05-25T09:15:00Z' },
            { id: 'msg-3-2', senderId: 'david.moreau@email.com', content: "Avez-vous eu le temps de regarder les photos des malfaçons ?", timestamp: '2024-05-25T09:16:00Z' },
        ]
    }
];

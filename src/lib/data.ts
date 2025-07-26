// This file now only contains type definitions. 
// The data is fetched from Firebase Firestore.

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
  totalCost?: number;
  firstInstallment?: number;
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
    clientId: string;
    unreadCount: number;
    messages: Message[];
};

export type Lawyer = {
    id: string; // Using email as ID for simplicity
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

// Mock user data for demonstration purposes of a logged-in user.
// In a real app, this would come from an authentication context.
export const staticUserData = {
    lawyer: {
        id: 'm.dupont@cabinet-legal.fr',
        name: 'Maître Dupont',
        email: 'm.dupont@cabinet-legal.fr',
        role: 'Avocat',
        avatar: 'https://placehold.co/100x100.png',
    },
    clients: [
      {
        id: 'client-alice',
        name: 'Alice Martin',
        email: 'alice.martin@email.com',
        avatar: 'https://placehold.co/100x100.png?text=AM',
        address: '123 Rue de la Paix, 75001 Paris',
        phone: '06 12 34 56 78'
      }
    ],
    // We can imagine a login system would set the current user
    currentUser: {
        id: 'client-alice',
        name: 'Alice Martin',
        email: 'alice.martin@email.com',
        avatar: 'https://placehold.co/100x100.png?text=AM',
        address: '123 Rue de la Paix, 75001 Paris',
        phone: '06 12 34 56 78'
    }, 
};

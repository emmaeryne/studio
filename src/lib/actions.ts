
'use server'

import { db } from './firebase';
import { collection, getDocs, doc, addDoc, updateDoc, setDoc, getDoc, query, where, orderBy, writeBatch, Timestamp, limit, startAt } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { summarizeCaseDocuments } from '@/ai/flows/summarize-case-documents';
import type { SummarizeCaseDocumentsInput } from '@/ai/flows/summarize-case-documents';
import { askChatbot } from '@/ai/flows/chatbot';
import type { ChatbotInput } from '@/ai/flows/chatbot';
import { estimateCaseCost } from '@/ai/flows/estimate-case-cost';
import type { EstimateCaseCostInput, EstimateCaseCostOutput } from '@/ai/flows/estimate-case-cost';
import type { CaseDocument, Lawyer, Message, Client, Case, Appointment, Invoice, Conversation, Notification } from './data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'user_session';

// Helper function to convert Firestore Timestamps to strings
const convertTimestamps = (data: any) => {
    if (!data) return data;
    const newData = Array.isArray(data) ? [...data] : { ...data };
    for (const key in newData) {
        const value = (newData as any)[key];
        if (value instanceof Timestamp) {
            (newData as any)[key] = value.toDate().toISOString();
        } else if (typeof value === 'object' && value !== null) {
            (newData as any)[key] = convertTimestamps(value);
        }
    }
    return newData;
};

// --- AUTH / SESSION ACTIONS ---

export async function getCurrentUser(): Promise<(Client & { role: 'client' }) | (Lawyer & { role: 'lawyer' }) | null> {
    const session = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!session) return null;
    try {
        const { id, role } = JSON.parse(session);
        const collectionName = role === 'lawyer' ? 'users' : 'clients';
        const user = await getDocument<Client | Lawyer>(collectionName, id);
        if (!user) {
            await clearSession();
            return null;
        }
        return { ...user, role } as (Client & { role: 'client' }) | (Lawyer & { role: 'lawyer' });
    } catch (error) {
        await clearSession();
        return null;
    }
}


async function createSession(user: { id: string, role: 'client' | 'lawyer' }) {
    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });
}

export async function clearSession() {
    cookies().set(SESSION_COOKIE_NAME, '', { expires: new Date(0) });
}

export async function registerUser(userData: { name: string; email: string; role: 'client' | 'lawyer' }) {
    try {
        const { name, email, role } = userData;
        const collectionName = role === 'lawyer' ? 'users' : 'clients';
        
        const q = query(collection(db, collectionName), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, error: 'Cet email est déjà utilisé pour ce rôle.' };
        }

        const newUserRef = doc(collection(db, collectionName));
        const newUser: Omit<Client | Lawyer, 'id'> = {
            name,
            email,
            avatar: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
            ...(role === 'lawyer' && { role: 'Avocat', specialty: 'Droit Général' }),
        };

        await setDoc(newUserRef, newUser);
        await createSession({ id: newUserRef.id, role });
        
        redirect(role === 'lawyer' ? '/dashboard' : '/client/dashboard');

    } catch (error) {
        console.error("Error registering user: ", error);
        return { success: false, error: 'La création du compte a échoué.' };
    }
}


export async function loginUserByEmail(credentials: { email: string; password?: string; role: 'client' | 'lawyer' }) {
    try {
        const { email, role } = credentials;
        const collectionName = role === 'lawyer' ? 'users' : 'clients';
        const q = query(collection(db, collectionName), where("email", "==", email), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: `Aucun compte trouvé pour l'email ${email} avec le rôle ${role}.` };
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };

        await createSession({ id: user.id, role });
        return { success: true, role };

    } catch (error) {
        console.error("Login error: ", error);
        return { success: false, error: "Une erreur est survenue lors de la connexion." };
    }
}

export async function quickLogin(role: 'lawyer' | 'client') {
    try {
        const collectionName = role === 'lawyer' ? 'users' : 'clients';
        const q = query(collection(db, collectionName), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
             return { success: false, error: `Aucun utilisateur trouvé pour le rôle : ${role}` };
        }

        const userDoc = querySnapshot.docs[0];
        await createSession({ id: userDoc.id, role });
        
        return { success: true, role };
    } catch (error) {
        console.error("Quick login error:", error);
        return { success: false, error: "Erreur de connexion rapide." };
    }
}


// Generic function to fetch a collection
async function getCollection<T>(collectionName: string, q?: any): Promise<T[]> {
    const querySnapshot = await getDocs(q || collection(db, collectionName));
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
}

// Generic function to fetch a document by ID
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    if (!id) return null;
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return convertTimestamps({ id: docSnap.id, ...docSnap.data() } as any);
    }
    return null;
}

// --- Case Actions ---
export async function getCases(): Promise<Case[]> {
    const casesCollection = collection(db, 'cases');
    const q = query(casesCollection, orderBy('submittedDate', 'desc'));
    return getCollection<Case>('cases', q);
}

export async function getCaseById(id: string): Promise<Case | null> {
    return getDocument<Case>('cases', id);
}

export async function getClientCases(clientId: string): Promise<Case[]> {
    if (!clientId) return [];
    const casesCollection = collection(db, 'cases');
    const q = query(casesCollection, where('clientId', '==', clientId), orderBy('submittedDate', 'desc'));
    return getCollection<Case>('cases', q);
}

// Helper function to create a conversation
async function createConversation(caseData: { id: string, caseNumber: string, clientId: string, clientName: string, clientAvatar: string }) {
    // Check if a conversation for this case already exists to avoid duplicates
    const convosCollection = collection(db, 'conversations');
    const q = query(convosCollection, where('caseId', '==', caseData.id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newConversation: Omit<Conversation, 'id'> = {
            caseId: caseData.id,
            caseNumber: caseData.caseNumber,
            clientId: caseData.clientId,
            clientName: caseData.clientName,
            clientAvatar: caseData.clientAvatar,
            unreadCount: 0,
            messages: [],
        };
        await addDoc(collection(db, 'conversations'), newConversation);
    }
}


export async function addCase(newCaseData: { clientName: string; caseType: Case['caseType']; description: string }) {
    try {
        const clientsCollection = collection(db, 'clients');
        const q = query(clientsCollection, where("name", "==", newCaseData.clientName), limit(1));
        const querySnapshot = await getDocs(q);
        
        let client: Client;

        if (querySnapshot.empty) {
            const newClientRef = doc(collection(db, 'clients'));
            const newClientData: Omit<Client, 'id'> = {
                name: newCaseData.clientName,
                email: `${newCaseData.clientName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                avatar: `https://placehold.co/100x100.png?text=${newCaseData.clientName.charAt(0)}`
            };
            await setDoc(newClientRef, newClientData);
            client = { id: newClientRef.id, ...newClientData };
        } else {
            const clientDoc = querySnapshot.docs[0];
            client = { id: clientDoc.id, ...clientDoc.data() } as Client;
        }
        
        const casesCountSnapshot = await getDocs(collection(db, 'cases'));
        const nextCaseNumber = `CASE-${String(casesCountSnapshot.size + 1).padStart(3, '0')}`;
        const currentDate = new Date();

        const newCase: Omit<Case, 'id' | '_estimate'> = {
            caseNumber: nextCaseNumber,
            clientName: client.name,
            clientId: client.id,
            clientAvatar: client.avatar,
            caseType: newCaseData.caseType,
            status: 'Nouveau',
            submittedDate: currentDate.toISOString(),
            lastUpdate: currentDate.toISOString(),
            description: newCaseData.description,
            documents: [],
            appointments: [],
            keyDeadlines: [],
        };
        
        const docRef = await addDoc(collection(db, 'cases'), newCase);
        const addedCase = await getCaseById(docRef.id);

        if (addedCase) {
             await createConversation(addedCase);
        }
        
        revalidatePath('/dashboard/cases');
        revalidatePath('/dashboard/messages');
        return { success: true, newCase: addedCase };
    } catch (error) {
        console.error("Error adding case: ", error);
        return { success: false, error: 'Failed to add case.' };
    }
}

export async function addClientCase(newCase: { caseType: Case['caseType']; description: string }) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'client') {
        throw new Error("Utilisateur non autorisé.");
    }
    const currentDate = new Date();

    let caseEstimate: EstimateCaseCostOutput | null = null;
    try {
        caseEstimate = await estimateCaseCost(newCase);
    } catch(e) {
        console.error("AI cost estimation failed, proceeding without it.", e);
    }
    
    const casesCountSnapshot = await getDocs(collection(db, 'cases'));
    const nextCaseNumber = `CASE-${String(casesCountSnapshot.size + 1).padStart(3, '0')}`;

    const newCaseData: Omit<Case, 'id'> = {
        caseNumber: nextCaseNumber,
        clientName: currentUser.name,
        clientId: currentUser.id,
        clientAvatar: currentUser.avatar,
        caseType: newCase.caseType,
        status: 'Nouveau',
        submittedDate: currentDate.toISOString(),
        lastUpdate: currentDate.toISOString(),
        description: newCase.description,
        documents: [],
        appointments: [],
        keyDeadlines: [],
        ...(caseEstimate && { _estimate: caseEstimate })
    };
    
    const docRef = await addDoc(collection(db, 'cases'), newCaseData);
    const addedCase = await getCaseById(docRef.id);

    if (addedCase) {
        await createConversation(addedCase);
    }
    
    revalidatePath('/client/cases');
    revalidatePath(`/client/cases/${docRef.id}`);
    revalidatePath('/client/messages');
    
    redirect(`/client/cases/${docRef.id}`);
}


export async function updateCaseStatus(caseId: string, newStatus: Case['status']) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'lawyer') {
        return { success: false, error: "Non autorisé." };
    }
    try {
        const caseRef = doc(db, "cases", caseId);
        const caseItemSnap = await getDoc(caseRef);
        if (!caseItemSnap.exists()) return { success: false, error: "Affaire non trouvée."};
        const caseItem = caseItemSnap.data();

        await updateDoc(caseRef, {
            status: newStatus,
            lastUpdate: new Date().toISOString()
        });

        if (newStatus === 'Clôturé') {
            await addDoc(collection(db, "notifications"), {
                 userId: caseItem.clientId,
                 message: `Votre affaire ${caseItem.caseNumber} a été clôturée.`,
                 read: false,
                 date: new Date().toISOString()
            });
            revalidatePath(`/client/layout`);
        }
        
        revalidatePath('/dashboard/cases');
        revalidatePath(`/dashboard/cases/${caseId}`);
        revalidatePath('/client/cases');
        revalidatePath(`/client/cases/${caseId}`);

        const updatedCaseData = await getCaseById(caseId);
        return { success: true, updatedCase: updatedCaseData };
    } catch (error) {
        console.error(error);
        return { success: false, error: "La mise à jour du statut a échoué." };
    }
}

// --- Document Actions ---
export async function addDocumentToCase(caseId: string, documentData: CaseDocument) {
    try {
        const caseRef = doc(db, "cases", caseId);
        const caseSnap = await getDoc(caseRef);
        if (caseSnap.exists()) {
            const caseData = caseSnap.data() as Case;
            const updatedDocuments = [...(caseData.documents || []), documentData];
            await updateDoc(caseRef, { 
                documents: updatedDocuments,
                lastUpdate: new Date().toISOString()
            });
            revalidatePath(`/dashboard/cases/${caseId}`);
            revalidatePath(`/client/cases/${caseId}`);
            return { success: true };
        }
        return { success: false, error: 'Case not found.' };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add document.' };
    }
}

// --- Appointment Actions ---
export async function getAppointments(): Promise<(Appointment & { clientName: string })[]> {
    return getCollection<(Appointment & { clientName: string })>('appointments');
}


export async function requestAppointment(appointmentData: { caseId: string, date: string, time: string, notes: string }) {
     const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'client') {
        return { success: false, error: "Non autorisé." };
    }
    try {
        const caseItem = await getCaseById(appointmentData.caseId);
        if (!caseItem) return { success: false, error: "Affaire non trouvée" };

        const newAppointmentRef = doc(collection(db, 'appointments'));
        const newAppointment: Appointment & { clientName: string } = {
            id: newAppointmentRef.id,
            ...appointmentData,
            clientName: caseItem.clientName,
            status: 'En attente'
        };
        await setDoc(newAppointmentRef, newAppointment);
        
        const caseRef = doc(db, "cases", appointmentData.caseId);
        const caseSnap = await getDoc(caseRef);
        const existingAppointments = caseSnap.data()?.appointments || [];
        await updateDoc(caseRef, {
            appointments: [...existingAppointments, { id: newAppointment.id, date: newAppointment.date, time: newAppointment.time, notes: newAppointment.notes, status: newAppointment.status }]
        });
        
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard');
        revalidatePath(`/client/cases/${caseItem.id}`);
        return { success: true };
    } catch(error) {
        console.error(error);
        return { success: false, error: "La demande de rendez-vous a échoué" };
    }
}

export async function updateAppointmentStatus(appointmentId: string, status: Appointment['status']) {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, { status });

        const updatedAppointmentSnap = await getDoc(appointmentRef);
        if (!updatedAppointmentSnap.exists()) return { success: false, error: 'Appointment not found.' };
        const updatedAppointment = updatedAppointmentSnap.data() as Appointment;
        
        const caseRef = doc(db, "cases", updatedAppointment.caseId);
        const caseSnap = await getDoc(caseRef);
        if (caseSnap.exists()) {
            const caseAppointments = caseSnap.data().appointments.map((app: any) => 
                app.id === appointmentId ? { ...app, status } : app
            );
            await updateDoc(caseRef, { appointments: caseAppointments });

            const client = await getDocument<Client>('clients', caseSnap.data().clientId);
            if (client) {
                 await addDoc(collection(db, "notifications"), {
                    userId: client.id,
                    message: `Votre rendez-vous du ${new Date(updatedAppointment.date).toLocaleDateString('fr-FR')} à ${updatedAppointment.time} a été ${status.toLowerCase()}.`,
                    read: false,
                    date: new Date().toISOString()
                });
            }
        }

        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard');
        revalidatePath(`/client/cases/${updatedAppointment.caseId}`);
        revalidatePath(`/client/layout`);
        return { success: true, updatedAppointment: convertTimestamps({id: appointmentId, ...updatedAppointment}) };
    } catch(error) {
        console.error(error);
        return { success: false, error: 'Impossible de mettre à jour le statut du rendez-vous' };
    }
}

export async function rescheduleAppointment(appointmentData: { appointmentId: string, newDate: string, newTime: string }) {
    try {
        const { appointmentId, newDate, newTime } = appointmentData;
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
            date: newDate,
            time: newTime,
            status: 'Reporté'
        });

        const updatedAppointmentSnap = await getDoc(appointmentRef);
        if (!updatedAppointmentSnap.exists()) return { success: false, error: 'Appointment not found.' };
        const updatedAppointment = updatedAppointmentSnap.data() as Appointment;

        const caseRef = doc(db, "cases", updatedAppointment.caseId);
        const caseSnap = await getDoc(caseRef);
         if (caseSnap.exists()) {
            const caseAppointments = caseSnap.data().appointments.map((app: any) => 
                app.id === appointmentId ? { ...app, date: newDate, time: newTime, status: 'Reporté' } : app
            );
            await updateDoc(caseRef, { appointments: caseAppointments });

            const client = await getDocument<Client>('clients', caseSnap.data().clientId);
            if (client) {
                 await addDoc(collection(db, "notifications"), {
                    userId: client.id,
                    message: `Votre rendez-vous a été reporté au ${new Date(newDate).toLocaleDateString('fr-FR')} à ${newTime}.`,
                    read: false,
                    date: new Date().toISOString()
                });
            }
        }
        
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard');
        revalidatePath(`/client/cases/${updatedAppointment.caseId}`);
        revalidatePath(`/client/layout`);
        return { success: true, updatedAppointment: convertTimestamps({id: appointmentId, ...updatedAppointment}) };
    } catch (e) {
        console.error(e);
        return { success: false, error: "La modification du rendez-vous a échoué" };
    }
}

// --- User/Profile Actions ---
export async function getLawyerProfile(): Promise<Lawyer | null> {
    const q = query(collection(db, 'users'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return getDocument<Lawyer>('users', snapshot.docs[0].id);
}

export async function getAllClients(): Promise<Client[]> {
    return getCollection<Client>('clients');
}

export async function getClientProfile(id: string): Promise<Client | null> {
    return getDocument<Client>('clients', id);
}

export async function updateLawyerProfile(updatedLawyer: Omit<Lawyer, 'id'>) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'lawyer') {
        return { success: false, error: "Non autorisé." };
    }
    try {
        const lawyerRef = doc(db, "users", currentUser.id);
        await setDoc(lawyerRef, updatedLawyer, { merge: true });
        revalidatePath('/dashboard/profile');
        revalidatePath('/dashboard/layout');
        return { success: true }
    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to update profile." };
    }
}

export async function updateClientProfile(updatedClient: Omit<Client, 'id'>) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'client') {
        return { success: false, error: "Non autorisé." };
    }
    try {
        const clientRef = doc(db, "clients", currentUser.id);
        await setDoc(clientRef, updatedClient, { merge: true });

        // Update name in cases
        const casesQuery = query(collection(db, 'cases'), where('clientId', '==', currentUser.id));
        const casesSnapshot = await getDocs(casesQuery);
        const batch = writeBatch(db);
        casesSnapshot.docs.forEach(caseDoc => {
            batch.update(caseDoc.ref, { clientName: updatedClient.name });
        });
        await batch.commit();

        revalidatePath('/client/profile');
        revalidatePath('/client/layout');
        return { success: true };
    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to update profile." };
    }
}

// --- Message Actions ---
export async function getConversations(): Promise<Conversation[]> {
    return getCollection<Conversation>('conversations');
}
export async function getClientConversations(clientId: string): Promise<Conversation[]> {
    if (!clientId) return [];
    const convosCollection = collection(db, 'conversations');
    const q = query(convosCollection, where('clientId', '==', clientId));
    return getCollection<Conversation>('conversations', q);
}

export async function sendMessage(conversationId: string | undefined, content: string, senderId: string, clientId?: string) {
    try {
        let conversationRef;
        let finalConversationId = conversationId;

        if (!conversationId) {
            // This is a new conversation initiated by the lawyer.
            if (!clientId) return { success: false, error: "Client ID is required to start a new conversation." };
            
            const client = await getDocument<Client>('clients', clientId);
            if (!client) return { success: false, error: "Client not found." };
            
            const newConversationData: Omit<Conversation, 'id'> = {
                caseId: '', // No specific case yet
                caseNumber: 'Discussion générale',
                clientId: client.id,
                clientName: client.name,
                clientAvatar: client.avatar,
                unreadCount: 1, // Unread for the client
                messages: [],
            };
            const newDocRef = await addDoc(collection(db, 'conversations'), newConversationData);
            conversationRef = newDocRef;
            finalConversationId = newDocRef.id;
        } else {
            conversationRef = doc(db, "conversations", conversationId);
        }

        const conversationSnap = await getDoc(conversationRef);
        if(!conversationSnap.exists()) return { success: false, error: "Conversation not found" };
        
        const conversationData = conversationSnap.data() as Conversation;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId,
            content,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const existingMessages = conversationData.messages || [];
        const isClientSender = senderId === conversationData.clientId;
        const unreadCount = isClientSender ? conversationData.unreadCount : conversationData.unreadCount + 1;

        await updateDoc(conversationRef, {
            messages: [...existingMessages, newMessage],
            unreadCount: unreadCount,
        });

        revalidatePath('/dashboard/messages');
        revalidatePath('/client/messages');
        return { success: true, newMessage: convertTimestamps(newMessage), conversationId: finalConversationId };

    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to send message" };
    }
}


export async function markConversationAsRead(conversationId: string, currentUserId: string): Promise<boolean> {
    try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);

        if (conversationSnap.exists()) {
            const conversationData = conversationSnap.data() as Conversation;
            
            // We only care about the client's unread count.
            if (currentUserId === conversationData.clientId) {
                await updateDoc(conversationRef, {
                    unreadCount: 0
                });
                revalidatePath(`/client/layout`);
                revalidatePath(`/client/messages`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error marking conversation as read:", error);
        return false;
    }
}


// --- Invoice Actions ---
export async function getClientInvoices(clientId: string): Promise<Invoice[]> {
    if (!clientId) return [];
    const invoicesCollection = collection(db, 'invoices');
    const q = query(invoicesCollection, where('clientId', '==', clientId));
    return getCollection<Invoice>('invoices', q);
}

export async function makePayment(invoiceId: string) {
    try {
        const invoiceRef = doc(db, "invoices", invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if(!invoiceSnap.exists()) {
            return { success: false, error: "Facture non trouvée." };
        }
        
        await updateDoc(invoiceRef, { status: 'Payée' });
        const invoice = invoiceSnap.data() as Invoice;
        
        const lawyerQuery = query(collection(db, 'users'), limit(1));
        const lawyerSnap = await getDocs(lawyerQuery);
        if(!lawyerSnap.empty) {
            const lawyerId = lawyerSnap.docs[0].id;
            await addDoc(collection(db, "notifications"), {
                userId: lawyerId,
                message: `Paiement de ${invoice.amount.toFixed(2)}€ reçu pour la facture ${invoice.number} (${invoice.caseNumber}).`,
                read: false,
                date: new Date().toISOString()
            });
        }
        
        revalidatePath('/client/payments');
        revalidatePath('/dashboard/layout');
        return { success: true };

    } catch (error) {
        console.error(error);
        return { success: false, error: "Le paiement a échoué." };
    }
}

// --- Notification Actions ---
export async function getNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];
    const notifsCollection = collection(db, 'notifications');
    const q = query(notifsCollection, where('userId', '==', userId), orderBy('date', 'desc'));
    return getCollection<Notification>('notifications', q);
}

export async function markNotificationAsRead(notificationId: string) {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
    revalidatePath('/client/layout');
    revalidatePath('/dashboard/layout');
}

export async function markAllNotificationsAsRead(userId: string) {
    const notifsQuery = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    const notifsSnapshot = await getDocs(notifsQuery);
    const batch = writeBatch(db);
    notifsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    revalidatePath('/client/layout');
    revalidatePath('/dashboard/layout');
}


// --- AI Actions (no change needed) ---

export async function getSummary(input: SummarizeCaseDocumentsInput) {
  try {
    const result = await summarizeCaseDocuments(input);
    return { success: true, summary: result.summary };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'La génération du résumé a échoué.' };
  }
}

export async function getChatbotResponse(input: ChatbotInput) {
  try {
    const result = await askChatbot(input);
    return { success: true, response: result.response };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'La réponse du chatbot a échoué.' };
  }
}

export async function getCaseCostEstimate(input: EstimateCaseCostInput): Promise<{success: boolean, estimate?: EstimateCaseCostOutput, error?: string}> {
    try {
        const result = await estimateCaseCost(input);
        return { success: true, estimate: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'L\'estimation du coût a échoué.' };
    }
}


'use server'

import { db } from './firebase';
import { collection, getDocs, doc, addDoc, updateDoc, setDoc, getDoc, query, where, orderBy, writeBatch, deleteDoc, Timestamp } from 'firebase/firestore';

import { summarizeCaseDocuments } from '@/ai/flows/summarize-case-documents';
import type { SummarizeCaseDocumentsInput } from '@/ai/flows/summarize-case-documents';
import { askChatbot } from '@/ai/flows/chatbot';
import type { ChatbotInput } from '@/ai/flows/chatbot';
import { estimateCaseCost } from '@/ai/flows/estimate-case-cost';
import type { EstimateCaseCostInput, EstimateCaseCostOutput } from '@/ai/flows/estimate-case-cost';
import { staticUserData, type CaseDocument, type Lawyer, type Message, type Client, type Case, type Appointment, type Invoice, type Conversation, type Notification } from './data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Helper function to convert Firestore Timestamps to strings
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            convertTimestamps(data[key]);
        }
    }
    return data;
};


// Generic function to fetch a collection
async function getCollection<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
}

// Generic function to fetch a document by ID
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
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
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
}

export async function getCaseById(id: string): Promise<Case | null> {
    return getDocument<Case>('cases', id);
}

export async function getClientCases(clientId: string): Promise<Case[]> {
    const casesCollection = collection(db, 'cases');
    const q = query(casesCollection, where('clientId', '==', clientId), orderBy('submittedDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
}

export async function addCase(newCaseData: { clientName: string; caseType: Case['caseType']; description: string }) {
    try {
        const clientsCollection = collection(db, 'clients');
        const q = query(clientsCollection, where("name", "==", newCaseData.clientName));
        const querySnapshot = await getDocs(q);
        
        let client: Client;

        if (querySnapshot.empty) {
            const newClientRef = doc(collection(db, 'clients'));
            const newClientData = {
                id: newClientRef.id,
                name: newCaseData.clientName,
                email: `${newCaseData.clientName.toLowerCase().replace(/\s/g, '.')}@example.com`,
                avatar: `https://placehold.co/100x100.png?text=${newCaseData.clientName.charAt(0)}`
            };
            await setDoc(newClientRef, newClientData);
            client = newClientData;
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
        
        revalidatePath('/dashboard/cases');
        return { success: true, newCase: {id: docRef.id, ...newCase } };
    } catch (error) {
        console.error("Error adding case: ", error);
        return { success: false, error: 'Failed to add case.' };
    }
}

export async function addClientCase(newCase: { caseType: Case['caseType']; description: string }) {
    const currentUser = staticUserData.currentUser;
    const currentDate = new Date();

    let caseEstimate: EstimateCaseCostOutput | null = null;
    try {
        caseEstimate = await estimateCaseCost(newCase);
    } catch(e) {
        console.error("AI cost estimation failed, proceeding without it.", e);
        // Continue without the estimate if the AI call fails
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
        ...(caseEstimate && { _estimate: caseEstimate }),
    };
    
    const docRef = await addDoc(collection(db, 'cases'), newCaseData);
    
    revalidatePath('/client/cases');
    revalidatePath(`/client/cases/${docRef.id}`);

    return { success: true, newCaseId: docRef.id };
}


export async function updateCaseStatus(caseId: string, newStatus: Case['status']) {
    try {
        const caseRef = doc(db, "cases", caseId);
        await updateDoc(caseRef, {
            status: newStatus,
            lastUpdate: new Date().toISOString()
        });
        
        const caseItem = await getDoc(caseRef);
        if (!caseItem.exists()) return { success: false, error: "Case not found."};

        if (newStatus === 'Clôturé') {
            await addDoc(collection(db, "notifications"), {
                 userId: caseItem.data().clientId,
                 message: `Votre affaire ${caseItem.data().caseNumber} a été clôturée.`,
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
export async function getLawyerProfile(id: string): Promise<Lawyer | null> {
    return getDocument<Lawyer>('users', id);
}

export async function getClientProfile(id: string): Promise<Client | null> {
    return getDocument<Client>('clients', id);
}

export async function updateLawyerProfile(updatedLawyer: Omit<Lawyer, 'id'>) {
    try {
        const lawyerId = staticUserData.lawyer.id;
        const lawyerRef = doc(db, "users", lawyerId);
        await setDoc(lawyerRef, updatedLawyer, { merge: true });
        revalidatePath('/dashboard/profile');
        return { success: true }
    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to update profile." };
    }
}

export async function updateClientProfile(updatedClient: Omit<Client, 'id'>) {
    try {
        const clientId = staticUserData.currentUser.id;
        const clientRef = doc(db, "clients", clientId);
        await setDoc(clientRef, updatedClient, { merge: true });

        // Update name in cases
        const casesQuery = query(collection(db, 'cases'), where('clientId', '==', clientId));
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
     const convosCollection = collection(db, 'conversations');
    const q = query(convosCollection, where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
}

export async function sendMessage(conversationId: string, content: string, senderId: string) {
    try {
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationSnap = await getDoc(conversationRef);
        if(!conversationSnap.exists()) return { success: false, error: "Conversation not found" };

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId,
            content,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const existingMessages = conversationSnap.data().messages || [];
        await updateDoc(conversationRef, {
            messages: [...existingMessages, newMessage]
        });

        revalidatePath('/dashboard/messages');
        revalidatePath('/client/messages');
        return { success: true, newMessage };

    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to send message" };
    }
}

// --- Invoice Actions ---
export async function getClientInvoices(clientId: string): Promise<Invoice[]> {
    const invoicesCollection = collection(db, 'invoices');
    const q = query(invoicesCollection, where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
}

export async function makePayment(invoiceId: string) {
    try {
        const invoiceRef = doc(db, "invoices", invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        if(!invoiceSnap.exists()) {
            return { success: false, error: "Facture non trouvée." };
        }
        
        await updateDoc(invoiceRef, { status: 'Payée' });
        const invoice = invoiceSnap.data();
        
        await addDoc(collection(db, "notifications"), {
            userId: staticUserData.lawyer.id,
            message: `Paiement de ${invoice.amount.toFixed(2)}€ reçu pour la facture ${invoice.number} (${invoice.caseNumber}).`,
            read: false,
            date: new Date().toISOString()
        });

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
    const notifsCollection = collection(db, 'notifications');
    const q = query(notifsCollection, where('userId', '==', userId), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() } as any));
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

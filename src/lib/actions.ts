'use server'

import { summarizeCaseDocuments } from '@/ai/flows/summarize-case-documents';
import type { SummarizeCaseDocumentsInput } from '@/ai/flows/summarize-case-documents';
import { askChatbot } from '@/ai/flows/chatbot';
import type { ChatbotInput } from '@/ai/flows/chatbot';
import { estimateCaseCost } from '@/ai/flows/estimate-case-cost';
import type { EstimateCaseCostInput, EstimateCaseCostOutput } from '@/ai/flows/estimate-case-cost';
import { cases, user, type CaseDocument, conversations, type Lawyer, type Message, type Client, appointments as allAppointments, type Case, type Appointment, invoices, notifications } from './data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getSummary(input: SummarizeCaseDocumentsInput) {
  try {
    const result = await summarizeCaseDocuments(input);
    return { success: true, summary: result.summary };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'La génération du résumé a échoué.' };
  }
}

export async function addCase(newCase: { clientName: string; caseType: Case['caseType']; description: string }) {
    try {
        const nextId = (Math.max(0, ...cases.map(c => parseInt(c.id))) + 1).toString();
        const nextCaseNumber = `CASE-${String(cases.length + 1).padStart(3, '0')}`;
        const currentDate = new Date().toISOString().split('T')[0];

        // This is a mock association. In a real app, you'd link to a real client ID.
        const client = user.clients.find(c => c.name === newCase.clientName) || {
            id: `client-${newCase.clientName.toLowerCase().replace(/\s/g, '-')}`,
            name: newCase.clientName,
            email: `${newCase.clientName.toLowerCase().replace(/\s/g, '.')}@email.com`,
            avatar: `https://placehold.co/100x100.png?text=${newCase.clientName.charAt(0)}`
        };


        cases.push({
            id: nextId,
            caseNumber: nextCaseNumber,
            clientName: newCase.clientName,
            clientId: client.id,
            clientAvatar: client.avatar,
            caseType: newCase.caseType,
            status: 'Nouveau',
            submittedDate: currentDate,
            lastUpdate: currentDate,
            description: newCase.description,
            documents: [],
            appointments: [],
            keyDeadlines: [],
        });
        revalidatePath('/dashboard/cases');
        revalidatePath('/client/cases');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add case.' };
    }
}

export async function addClientCase(newCase: { caseType: Case['caseType']; description: string }) {
    // In a real app, current user would come from session
    const currentUser = user.currentUser;

    const nextId = (Math.max(0, ...cases.map(c => parseInt(c.id))) + 1).toString();
    const nextCaseNumber = `CASE-${String(cases.length + 1).padStart(3, '0')}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    let caseEstimate: EstimateCaseCostOutput | null = null;
    try {
        caseEstimate = await estimateCaseCost(newCase);
    } catch(e) {
        console.error("Failed to get estimate", e);
    }

    const newCaseData: Case = {
        id: nextId,
        caseNumber: nextCaseNumber,
        clientName: currentUser.name,
        clientId: currentUser.id,
        clientAvatar: currentUser.avatar,
        caseType: newCase.caseType,
        status: 'Nouveau',
        submittedDate: currentDate,
        lastUpdate: currentDate,
        description: newCase.description,
        documents: [],
        appointments: [],
        keyDeadlines: [],
        // Temporary store the estimate to show on the detail page
        _estimate: caseEstimate ?? undefined,
    };
    cases.push(newCaseData);
    
    revalidatePath('/client/cases');
    revalidatePath(`/client/cases/${nextId}`);

    redirect(`/client/cases/${nextId}`);
}


export async function addDocumentToCase(caseId: string, document: CaseDocument) {
    try {
        const caseItem = cases.find(c => c.id === caseId);
        if (caseItem) {
            caseItem.documents.push(document);
            caseItem.lastUpdate = new Date().toISOString().split('T')[0];
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

export async function sendMessage(conversationId: string, content: string) {
    try {
        const conversation = conversations.find(c => c.id === conversationId);
        if(!conversation) return { success: false, error: "Conversation not found" };

        const newMessage: Message = {
            id: `msg-${conversationId}-${conversation.messages.length + 1}`,
            // In a real app, we'd get the sender from the session
            senderId: user.lawyer.email,
            content,
            timestamp: new Date().toISOString(),
            read: undefined
        }
        conversation.messages.push(newMessage);
        revalidatePath('/dashboard/messages');
        return { success: true, newMessage };

    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to send message" };
    }
}


export async function updateLawyerProfile(updatedLawyer: Lawyer) {
    try {
        user.lawyer = updatedLawyer;
        revalidatePath('/dashboard/profile');
        return { success: true }
    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to update profile." };
    }
}

export async function updateClientProfile(updatedClient: Client) {
    try {
        const clientIndex = user.clients.findIndex(c => c.id === updatedClient.id);
        if (clientIndex > -1) {
            user.clients[clientIndex] = updatedClient;
            user.currentUser = updatedClient; // Update the "session" user
            
            // Also update the name in any associated cases
            cases.forEach(c => {
                if (c.clientId === updatedClient.id) {
                    c.clientName = updatedClient.name;
                }
            });

            revalidatePath('/client/profile');
            revalidatePath('/client/layout'); // To update header
            return { success: true };
        }
        return { success: false, error: "Client not found." };
    } catch(error) {
        console.error(error);
        return { success: false, error: "Failed to update profile." };
    }
}

export async function requestAppointment(appointmentData: { caseId: string, date: string, time: string, notes: string }) {
    try {
        const caseItem = cases.find(c => c.id === appointmentData.caseId);
        if (!caseItem) return { success: false, error: "Affaire non trouvée" };

        const newAppointment: Appointment = {
            id: `apt-${Date.now()}`,
            ...appointmentData,
            status: 'En attente'
        };

        caseItem.appointments.push(newAppointment);
        allAppointments.push({ ...newAppointment, clientName: caseItem.clientName });
        
        revalidatePath('/dashboard/calendar');
        revalidatePath('/dashboard');
        revalidatePath(`/client/cases/${caseItem.id}`);
        return { success: true }
    } catch(error) {
        console.error(error);
        return { success: false, error: "La demande de rendez-vous a échoué" };
    }
}

export async function updateAppointmentStatus(appointmentId: string, status: Appointment['status']) {
    try {
        let updatedAppointment: (Appointment & {clientName?: string}) | undefined;
        let caseToUpdate: Case | undefined;

        // Find in global list
        const globalAppointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);
        if(globalAppointmentIndex > -1) {
            allAppointments[globalAppointmentIndex].status = status;
            updatedAppointment = allAppointments[globalAppointmentIndex];
        }

        // Find in case-specific list
        for (const caseItem of cases) {
            const caseAppointmentIndex = caseItem.appointments.findIndex(a => a.id === appointmentId);
            if (caseAppointmentIndex > -1) {
                caseItem.appointments[caseAppointmentIndex].status = status;
                caseToUpdate = caseItem;
                break;
            }
        }

        if (updatedAppointment && caseToUpdate) {
            // Create a notification for the client
            const client = user.clients.find(c => c.id === caseToUpdate?.clientId);
            if (client) {
                 notifications.push({
                    id: `notif-${Date.now()}`,
                    userId: client.id,
                    message: `Votre rendez-vous du ${new Date(updatedAppointment.date).toLocaleDateString('fr-FR')} à ${updatedAppointment.time} a été ${status.toLowerCase()}.`,
                    read: false,
                    date: new Date().toISOString()
                });
            }

            revalidatePath('/dashboard/calendar');
            revalidatePath('/dashboard');
            revalidatePath(`/client/cases/${caseToUpdate.id}`);
            revalidatePath(`/client/layout`); // To update notification bell
            return { success: true, updatedAppointment };
        }

        return { success: false, error: 'Rendez-vous non trouvé' };
    } catch(error) {
        console.error(error);
        return { success: false, error: 'Impossible de mettre à jour le statut du rendez-vous' };
    }
}

export async function rescheduleAppointment(appointmentData: { appointmentId: string, newDate: string, newTime: string }) {
    try {
        const { appointmentId, newDate, newTime } = appointmentData;
        let updatedAppointment: Appointment | undefined;
        let caseToUpdate: Case | undefined;

        // Find and update in global list
        const globalAppointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);
        if(globalAppointmentIndex > -1) {
            allAppointments[globalAppointmentIndex].date = newDate;
            allAppointments[globalAppointmentIndex].time = newTime;
            allAppointments[globalAppointmentIndex].status = 'Reporté';
            updatedAppointment = allAppointments[globalAppointmentIndex];
        }

        // Find and update in case-specific list
        for (const caseItem of cases) {
            const caseAppointmentIndex = caseItem.appointments.findIndex(a => a.id === appointmentId);
            if (caseAppointmentIndex > -1) {
                caseItem.appointments[caseAppointmentIndex].date = newDate;
                caseItem.appointments[caseAppointmentIndex].time = newTime;
                caseItem.appointments[caseAppointmentIndex].status = 'Reporté';
                caseToUpdate = caseItem;
                break;
            }
        }

        if (updatedAppointment && caseToUpdate) {
             const client = user.clients.find(c => c.id === caseToUpdate?.clientId);
            if (client) {
                 notifications.push({
                    id: `notif-${Date.now()}`,
                    userId: client.id,
                    message: `Votre rendez-vous a été reporté au ${new Date(newDate).toLocaleDateString('fr-FR')} à ${newTime}.`,
                    read: false,
                    date: new Date().toISOString()
                });
            }
            revalidatePath('/dashboard/calendar');
            revalidatePath('/dashboard');
            revalidatePath(`/client/cases/${caseToUpdate.id}`);
            revalidatePath(`/client/layout`); // To update notification bell
            return { success: true, updatedAppointment };
        }
        
        return { success: false, error: "Rendez-vous non trouvé" };
    } catch (e) {
        console.error(e);
        return { success: false, error: "La modification du rendez-vous a échoué" };
    }
}

export async function makePayment(invoiceId: string) {
    try {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if(!invoice) {
            return { success: false, error: "Facture non trouvée." };
        }
        invoice.status = 'Payée';
        
        // Notify the lawyer
        const lawyerId = user.lawyer.email; // In a real app this might be an ID.
        notifications.push({
            id: `notif-${Date.now()}`,
            userId: lawyerId,
            message: `Paiement de ${invoice.amount.toFixed(2)}€ reçu pour la facture ${invoice.number} (${invoice.caseNumber}).`,
            read: false,
            date: new Date().toISOString()
        });

        revalidatePath('/client/payments');
        revalidatePath('/dashboard/layout'); // To update lawyer's notification bell
        return { success: true };

    } catch (error) {
        console.error(error);
        return { success: false, error: "Le paiement a échoué." };
    }
}

export async function updateCaseStatus(caseId: string, newStatus: Case['status']) {
    try {
        const caseItemIndex = cases.findIndex(c => c.id === caseId);
        if (caseItemIndex === -1) {
            return { success: false, error: "Affaire non trouvée." };
        }

        const caseItem = cases[caseItemIndex];
        caseItem.status = newStatus;
        caseItem.lastUpdate = new Date().toISOString().split('T')[0];

        // If the case is closed, notify the client.
        if (newStatus === 'Clôturé') {
            notifications.push({
                id: `notif-${Date.now()}`,
                userId: caseItem.clientId,
                message: `Votre affaire ${caseItem.caseNumber} a été clôturée.`,
                read: false,
                date: new Date().toISOString()
            });
            // Revalidate client layout to update their notification bell
            revalidatePath(`/client/layout`);
        }
        
        // Revalidate paths to reflect the status change
        revalidatePath('/dashboard/cases');
        revalidatePath(`/dashboard/cases/${caseId}`);
        revalidatePath(`/client/cases`);
        revalidatePath(`/client/cases/${caseId}`);

        return { success: true, updatedCase: caseItem };
    } catch (error) {
        console.error(error);
        return { success: false, error: "La mise à jour du statut a échoué." };
    }
}

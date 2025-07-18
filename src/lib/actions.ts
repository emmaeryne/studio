'use server'

import { summarizeCaseDocuments } from '@/ai/flows/summarize-case-documents';
import type { SummarizeCaseDocumentsInput } from '@/ai/flows/summarize-case-documents';
import { askChatbot } from '@/ai/flows/chatbot';
import type { ChatbotInput } from '@/ai/flows/chatbot';
import { cases, user, type CaseDocument, conversations, type Lawyer, type Message, type Client } from './data';
import { revalidatePath } from 'next/cache';

export async function getSummary(input: SummarizeCaseDocumentsInput) {
  try {
    const result = await summarizeCaseDocuments(input);
    return { success: true, summary: result.summary };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'La génération du résumé a échoué.' };
  }
}

export async function addCase(newCase: { clientName: string; caseType: 'Litige civil' | 'Droit pénal' | 'Droit de la famille' | 'Droit des sociétés'; description: string }) {
    try {
        const nextId = (Math.max(...cases.map(c => parseInt(c.id))) + 1).toString();
        const nextCaseNumber = `CASE-${String(cases.length + 1).padStart(3, '0')}`;
        const currentDate = new Date().toISOString().split('T')[0];

        // This is a mock association. In a real app, you'd link to a real client ID.
        const client = user.clients.find(c => c.name === newCase.clientName) || {
            id: `client-${newCase.clientName.toLowerCase().split(' ')[0]}`,
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

export async function addClientCase(newCase: { caseType: 'Litige civil' | 'Droit pénal' | 'Droit de la famille' | 'Droit des sociétés'; description: string }) {
    try {
        // In a real app, current user would come from session
        const currentUser = user.currentUser;

        const nextId = (Math.max(...cases.map(c => parseInt(c.id))) + 1).toString();
        const nextCaseNumber = `CASE-${String(cases.length + 1).padStart(3, '0')}`;
        const currentDate = new Date().toISOString().split('T')[0];

        cases.push({
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
        });
        revalidatePath('/dashboard/cases');
        revalidatePath('/client/cases');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to add case.' };
    }
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

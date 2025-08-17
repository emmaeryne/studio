import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Cache the admin instance to avoid re-importing and re-initializing
let adminInstance: typeof import('firebase-admin') | null = null;

function getAdmin() {
  if (!adminInstance) {
    adminInstance = admin;
  }
  return adminInstance;
}

function getAdminApp(): App {
  const adminSDK = getAdmin();
  if (adminSDK.apps.length > 0) {
    return adminSDK.app();
  }

  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccount) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
  }

  return adminSDK.initializeApp({
    credential: adminSDK.credential.cert(JSON.parse(serviceAccount)),
  });
}

export function getAdminAuth() {
  getAdminApp(); // Ensure app is initialized before getting auth
  const adminSDK = getAdmin();
  return adminSDK.auth();
}

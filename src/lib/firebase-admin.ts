import type { App } from 'firebase-admin/app';

// Cache the admin instance to avoid re-importing and re-initializing
let admin: typeof import('firebase-admin') | null = null;

async function getAdmin() {
  if (!admin) {
    admin = await import('firebase-admin');
  }
  return admin;
}

async function getAdminApp(): Promise<App> {
  const adminSDK = await getAdmin();
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

export async function getAdminAuth() {
  const adminSDK = await getAdmin();
  await getAdminApp(); // Ensure app is initialized before getting auth
  return adminSDK.auth();
}

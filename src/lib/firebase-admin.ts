import admin from 'firebase-admin';
import { App, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccount) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
  }

  return initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
  });
}

function getAdminAuth() {
  return getAuth(getAdminApp());
}

export const adminAuth = getAdminAuth();

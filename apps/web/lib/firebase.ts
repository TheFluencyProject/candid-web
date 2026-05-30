/**
 * Firebase Web SDK initialization + Apple/Google sign-in helpers.
 *
 * Uses the same Firebase project as iOS (NEXT_PUBLIC_FIREBASE_PROJECT_ID).
 * Same project = same UID for the same Apple/Google identity, so when a web
 * signup later opens iOS and signs in with the same provider, users.id
 * (== Firebase UID on iOS) trivially matches the web_signups row.
 *
 * signInWithPopup routes OAuth through Firebase's hosted auth handler URL
 * (e.g. {project}.firebaseapp.com/__/auth/handler) — Apple/Google only need
 * that one handler URL registered, not every custom domain. But Firebase
 * does require each origin the SDK runs on to be in the Auth → Authorized
 * domains list. We auto-register those server-side from the same callsites
 * that touch tutors.custom_domain.
 */
"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type Auth,
} from "firebase/auth";

let cached_app: FirebaseApp | null = null;

function get_app(): FirebaseApp {
  if (cached_app) return cached_app;
  const apps = getApps();
  if (apps.length > 0) {
    cached_app = apps[0]!;
    return cached_app;
  }
  cached_app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return cached_app;
}

function get_auth_instance(): Auth {
  return getAuth(get_app());
}

export interface SignInResult {
  id_token: string;
  email: string | null;
  display_name: string | null;
  provider: 'apple' | 'google';
}

export async function sign_in_with_apple(): Promise<SignInResult> {
  // OAuthProvider('apple.com') is the Firebase-Web equivalent of iOS's native
  // Sign In with Apple. The popup hits Firebase's handler, not each tutor domain.
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  const cred = await signInWithPopup(get_auth_instance(), provider);
  const id_token = await cred.user.getIdToken();
  return {
    id_token,
    email: cred.user.email,
    display_name: cred.user.displayName,
    provider: 'apple',
  };
}

export async function sign_in_with_google(): Promise<SignInResult> {
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  const cred = await signInWithPopup(get_auth_instance(), provider);
  const id_token = await cred.user.getIdToken();
  return {
    id_token,
    email: cred.user.email,
    display_name: cred.user.displayName,
    provider: 'google',
  };
}

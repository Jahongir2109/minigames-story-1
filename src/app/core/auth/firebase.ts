import { Injectable } from '@angular/core';
import type { FirebaseOptions } from 'firebase/app';
import type { Auth } from 'firebase/auth';

import { FIREBASE_ENV } from '../../../environments/firebase.env';

export type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

type ConfigOption =
  'apiKey' | 'authDomain' | 'projectId' | 'storageBucket' | 'messagingSenderId' | 'appId';

// Firebase option -> env variable (see .env.example and scripts/write-environment.mjs).
const CONFIG_VARIABLES: Readonly<Record<ConfigOption, string>> = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID',
};

/**
 * Builds the Firebase web config from the env variables; a missing value is a setup error, so it
 * names the variable instead of failing later inside the SDK.
 */
export function readFirebaseConfig(environment: EnvironmentVariables): FirebaseOptions {
  const config: Record<string, string> = {};

  for (const [option, variable] of Object.entries(CONFIG_VARIABLES)) {
    const value: string | undefined = environment[variable]?.trim();

    if (value === undefined || value === '') {
      throw new Error(`Firebase is not configured: ${variable} is missing (see .env.example).`);
    }

    config[option] = value;
  }

  return config;
}

/**
 * Firebase Authentication only proves who the user is; the app session (5 minutes) is kept by
 * the app itself. The SDK is downloaded and initialized on first use, so guests never load it.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseAuth {
  private auth: Promise<Auth> | undefined;

  private async create(): Promise<Auth> {
    const [app, authModule] = await Promise.all([import('firebase/app'), import('firebase/auth')]);

    return authModule.getAuth(app.initializeApp(readFirebaseConfig(FIREBASE_ENV)));
  }

  get(): Promise<Auth> {
    this.auth ??= this.create();

    return this.auth;
  }
}

import { type FirebaseOptions, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';

export type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

type ConfigOption =
  'apiKey' | 'authDomain' | 'projectId' | 'storageBucket' | 'messagingSenderId' | 'appId';

// Firebase option -> Vite env variable (see .env.example).
const CONFIG_VARIABLES: Readonly<Record<ConfigOption, string>> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
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

const instance: { auth?: Auth } = {};

/**
 * Firebase Authentication only proves who the user is; the app session (5 minutes) is kept by
 * the app itself. The SDK is initialized on first use.
 */
export function getFirebaseAuth(environment: EnvironmentVariables = import.meta.env): Auth {
  instance.auth ??= getAuth(initializeApp(readFirebaseConfig(environment)));

  return instance.auth;
}

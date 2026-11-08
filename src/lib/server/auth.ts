import { getRequestEvent } from '$app/server';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { createAuth } from './auth-core';
import { client, db } from './db';

export const auth = createAuth(db, client, [sveltekitCookies(getRequestEvent)]);

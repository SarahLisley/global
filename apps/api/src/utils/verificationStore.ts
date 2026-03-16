/**
 * In-memory store for email verification codes and password reset tokens.
 */
import { sendVerificationEmail } from './mailer';
import crypto from 'crypto';

type PendingRegistration = {
    cnpj: string;
    name: string;
    email: string;
    password: string;
    code: string;
    expiresAt: number;
    attempts: number;
};

const store = new Map<string, PendingRegistration>();

// Cleaner for expired entries
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.expiresAt < now) store.delete(key);
    }
}, 5 * 60 * 1000);

function generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createPendingRegistration(data: {
    cnpj: string;
    name: string;
    email: string;
    password: string;
}): Promise<string> {
    const code = generateCode();
    const key = data.email.toLowerCase().trim();

    store.set(key, {
        ...data,
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
    });

    await sendVerificationEmail(key, code, data.name);
    return code;
}

export function verifyCode(email: string, code: string): {
    ok: true;
    data: { cnpj: string; name: string; email: string; password: string };
} | {
    ok: false;
    reason: 'not_found' | 'expired' | 'invalid_code' | 'too_many_attempts';
} {
    const key = email.toLowerCase().trim();
    const entry = store.get(key);

    if (!entry) return { ok: false, reason: 'not_found' };
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return { ok: false, reason: 'expired' };
    }
    if (entry.attempts >= 5) {
        store.delete(key);
        return { ok: false, reason: 'too_many_attempts' };
    }
    if (entry.code !== code.trim()) {
        entry.attempts++;
        return { ok: false, reason: 'invalid_code' };
    }

    store.delete(key);
    return {
        ok: true,
        data: {
            cnpj: entry.cnpj,
            name: entry.name,
            email: entry.email,
            password: entry.password,
        },
    };
}

export async function resendCode(email: string): Promise<string | null> {
    const key = email.toLowerCase().trim();
    const entry = store.get(key);
    if (!entry) return null;

    const newCode = generateCode();
    entry.code = newCode;
    entry.expiresAt = Date.now() + 10 * 60 * 1000;
    entry.attempts = 0;

    await sendVerificationEmail(key, newCode, entry.name);
    return newCode;
}

type PasswordReset = {
    email: string;
    token: string;
    expiresAt: number;
    attempts: number;
};

const resetStore = new Map<string, PasswordReset>();

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of resetStore.entries()) {
        if (entry.expiresAt < now) resetStore.delete(key);
    }
}, 5 * 60 * 1000);

export async function createPasswordResetToken(email: string, name?: string): Promise<string> {
    const token = crypto.randomBytes(16).toString('hex');
    const key = email.toLowerCase().trim();

    resetStore.set(key, {
        email: key,
        token,
        expiresAt: Date.now() + 30 * 60 * 1000,
        attempts: 0,
    });

    const { sendPasswordResetEmail } = await import('./mailer');
    await sendPasswordResetEmail(key, token, name);

    return token;
}

export function verifyPasswordResetToken(token: string): {
    ok: true;
    email: string;
} | {
    ok: false;
    reason: 'not_found' | 'expired' | 'too_many_attempts';
} {
    let foundEntry: PasswordReset | undefined;

    for (const [, entry] of resetStore.entries()) {
        if (entry.token === token) {
            foundEntry = entry;
            break;
        }
    }

    if (!foundEntry) return { ok: false, reason: 'not_found' };
    const key = foundEntry.email;

    if (Date.now() > foundEntry.expiresAt) {
        resetStore.delete(key);
        return { ok: false, reason: 'expired' };
    }
    if (foundEntry.attempts >= 5) {
        resetStore.delete(key);
        return { ok: false, reason: 'too_many_attempts' };
    }

    resetStore.delete(key);
    return { ok: true, email: key };
}

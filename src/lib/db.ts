import { kv } from '@vercel/kv';
import crypto from 'crypto';

export type User = {
    id: string;
    name: string;
    walletAddress?: string | null;
    assignedToId?: string;
    proofImage?: string | null;
};

const INDIA_NAMES = [
    "Shamyuktha",
    "Suriyanarayanan R Srinivasan",
    "Logesh Kaliyappan",
    "Rishikhesh Annadurai",
    "Karthickpranav S N",
    "Shanthan Konka",
    "Mohanram Jagannathan Swaminathan",
    "Suganya Ramasamy",
    "Valliappan"
];

const GLOBAL_NAMES = [
    "Kuberan Marimuthu",
    "Joel merciline",
    "Venkateshan Shanmugam",
    "Deepa kuberan",
    "PUPU"
];

function generateHash(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
}

function processGroup(names: string[]): User[] {
    let users: User[] = names.map(name => ({
        id: generateHash(),
        name,
        walletAddress: null
    }));

    // Shuffle
    for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]];
    }

    const rishikheshIdx = users.findIndex(u => u.name === "Rishikhesh Annadurai");
    const shamyukthaIdx = users.findIndex(u => u.name === "Shamyuktha");

    if (rishikheshIdx !== -1 && shamyukthaIdx !== -1) {
        const targetIdx = (rishikheshIdx + 1) % users.length;
        if (targetIdx !== shamyukthaIdx) {
            [users[targetIdx], users[shamyukthaIdx]] = [users[shamyukthaIdx], users[targetIdx]];
        }
    }

    for (let i = 0; i < users.length; i++) {
        const currentUser = users[i];
        const nextUser = users[(i + 1) % users.length];
        currentUser.assignedToId = nextUser.id;
    }

    return users;
}

async function ensureInitialized() {
    const exists = await kv.exists('users');
    if (!exists) {
        const indiaUsers = processGroup(INDIA_NAMES);
        const globalUsers = processGroup(GLOBAL_NAMES);
        const allUsers = [...indiaUsers, ...globalUsers];

        const usersObj: Record<string, User> = {};
        allUsers.forEach(u => {
            usersObj[u.id] = u;
        });

        await kv.hset('users', usersObj);
    }
}

export async function getUserById(id: string): Promise<User | null> {
    await ensureInitialized();
    return await kv.hget<User>('users', id);
}

export async function getAllUsers(): Promise<User[]> {
    await ensureInitialized();
    const usersObj = await kv.hgetall<Record<string, User>>('users');
    return usersObj ? Object.values(usersObj) : [];
}

export async function claimUser(id: string, wallet: string) {
    await ensureInitialized();
    const users = await kv.hgetall<Record<string, User>>('users');
    if (!users) return { success: false, message: 'Database error.' };

    const user = users[id];
    const normalizedWallet = wallet.toLowerCase();

    if (!user) {
        return { success: false, message: 'Invalid ID.' };
    }

    if (user.walletAddress && user.walletAddress !== normalizedWallet) {
        return { success: false, message: 'This ID is already claimed.' };
    }

    const existingClaim = Object.values(users).find(u => u.walletAddress === normalizedWallet && u.id !== id);
    if (existingClaim) {
        return { success: false, message: `Wallet already linked to ${existingClaim.name}.` };
    }

    user.walletAddress = normalizedWallet;
    await kv.hset('users', { [id]: user });

    const assignedPerson = user.assignedToId ? users[user.assignedToId] : undefined;

    return { success: true, message: 'Identity verified.', user, assignedPerson };
}

export async function updateProof(id: string, proofPath: string) {
    await ensureInitialized();
    const user = await kv.hget<User>('users', id);
    if (!user) return { success: false, message: 'User not found' };

    user.proofImage = proofPath;
    await kv.hset('users', { [id]: user });
    return { success: true, message: 'Proof uploaded' };
}

export async function resetDB() {
    await kv.del('users');
    await ensureInitialized();
}

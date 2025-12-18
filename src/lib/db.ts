import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'users-db.json');

export type User = {
    id: string;
    name: string;
    walletAddress?: string | null;
    assignedToId?: string;
    proofImage?: string | null;
};

// Demographic Groups
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

let usersCache: Record<string, User> = {};

function generateHash(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 char hex
}

function processGroup(names: string[]): User[] {
    // Create users
    let users: User[] = names.map(name => ({
        id: generateHash(),
        name,
        walletAddress: null
    }));

    // Shuffle (Fisher-Yates)
    for (let i = users.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [users[i], users[j]] = [users[j], users[i]];
    }

    // Enforce Rishikhesh Annadurai -> Shamyuktha if both are in this group
    const rishikheshIdx = users.findIndex(u => u.name === "Rishikhesh Annadurai");
    const shamyukthaIdx = users.findIndex(u => u.name === "Shamyuktha");

    if (rishikheshIdx !== -1 && shamyukthaIdx !== -1) {
        // We want the person at (rishikheshIdx + 1) to be Shamyuktha
        const targetIdx = (rishikheshIdx + 1) % users.length;
        if (targetIdx !== shamyukthaIdx) {
            // Swap whoever is at targetIdx with Shamyuktha
            [users[targetIdx], users[shamyukthaIdx]] = [users[shamyukthaIdx], users[targetIdx]];
        }
    }

    // Circular Assignment
    for (let i = 0; i < users.length; i++) {
        const currentUser = users[i];
        const nextUser = users[(i + 1) % users.length];
        currentUser.assignedToId = nextUser.id;
    }

    return users;
}

function loadDB() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            usersCache = JSON.parse(data);
        } else {
            const indiaUsers = processGroup(INDIA_NAMES);
            const globalUsers = processGroup(GLOBAL_NAMES);

            // Merge into cache
            [...indiaUsers, ...globalUsers].forEach(u => {
                usersCache[u.id] = u;
            });

            saveDB();
        }
    } catch (e) {
        console.error("Failed to load DB", e);
    }
}

const CSV_PATH = path.join(process.cwd(), 'assignments.csv');

function saveCSV() {
    try {
        const headers = ['User ID', 'User Name', 'Wallet Address', 'Assigned ID', 'Assigned Name', 'Proof Status'];
        const rows = Object.values(usersCache).map(user => {
            const assignedTo = user.assignedToId ? usersCache[user.assignedToId] : null;
            return [
                user.id,
                user.name,
                user.walletAddress || 'Not Claimed',
                assignedTo?.id || 'N/A',
                assignedTo?.name || 'N/A',
                user.proofImage ? 'Uploaded' : 'Pending'
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        fs.writeFileSync(CSV_PATH, csvContent);
    } catch (e) {
        console.error("Failed to save CSV", e);
    }
}

function saveDB() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(usersCache, null, 2));
        saveCSV();
    } catch (e) {
        console.error("Failed to save DB", e);
    }
}

loadDB();

export function getUserById(id: string): User | null {
    return usersCache[id] || null;
}

export function getAllUsers(): User[] {
    return Object.values(usersCache);
}

export function claimUser(id: string, wallet: string): { success: boolean; message: string; user?: User; assignedPerson?: User } {
    const user = usersCache[id];
    const normalizedWallet = wallet.toLowerCase();

    if (!user) {
        return { success: false, message: 'Invalid ID.' };
    }

    if (user.walletAddress && user.walletAddress !== normalizedWallet) {
        return { success: false, message: 'This ID is already claimed.' };
    }

    const existingClaim = Object.values(usersCache).find(u => u.walletAddress === normalizedWallet && u.id !== id);
    if (existingClaim) {
        return { success: false, message: `Wallet already linked to ${existingClaim.name}.` };
    }

    user.walletAddress = normalizedWallet;
    saveDB();

    const assignedPerson = user.assignedToId ? usersCache[user.assignedToId] : undefined;

    return { success: true, message: 'Identity verified.', user, assignedPerson };
}

export function updateProof(id: string, proofPath: string): { success: boolean; message: string } {
    const user = usersCache[id];
    if (!user) return { success: false, message: 'User not found' };

    user.proofImage = proofPath;
    saveDB();
    return { success: true, message: 'Proof uploaded' };
}

export function resetDB() {
    try {
        if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
        if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH);

        // Clear uploads
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        if (fs.existsSync(uploadDir)) {
            fs.rmSync(uploadDir, { recursive: true, force: true });
        }

        usersCache = {};
        loadDB(); // Re-initialize with shuffle
    } catch (e) {
        console.error("Failed to reset DB", e);
    }
}

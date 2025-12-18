import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'soul-db.json');

export type Persona = 'Christ Mom' | 'Christ Child';

export type Soul = {
  id: string;
  recoveryPhrase: string;
  persona: Persona;
  wallets: string[];
  createdAt: number;
};

// In-memory cache
let soulCache: Record<string, Soul> = {};
let walletIndex: Record<string, string> = {}; // wallet -> soulId

// Load DB
function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const db = JSON.parse(data);
      soulCache = db.souls || {};
      walletIndex = db.walletIndex || {};
    }
  } catch (e) {
    console.error("Failed to load DB", e);
  }
}

// Save DB
function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify({ souls: soulCache, walletIndex }, null, 2));
  } catch (e) {
    console.error("Failed to save DB", e);
  }
}

// Initialize
loadDB();

export function getSoulByWallet(wallet: string): Soul | null {
  const normalizedWallet = wallet.toLowerCase();
  const soulId = walletIndex[normalizedWallet];
  if (soulId) {
    return soulCache[soulId] || null;
  }
  return null;
}

export function createSoul(wallet: string): Soul {
  const normalizedWallet = wallet.toLowerCase();
  
  // Check if already exists (shouldn't happen if called correctly)
  if (walletIndex[normalizedWallet]) {
    return soulCache[walletIndex[normalizedWallet]];
  }

  const id = crypto.randomUUID();
  // Simple recovery phrase generation (in real app use BIP-39)
  const recoveryPhrase = Array.from({ length: 4 }, () => 
    Math.random().toString(36).substring(2, 8)
  ).join('-');

  // Random assignment
  const persona: Persona = Math.random() > 0.5 ? 'Christ Mom' : 'Christ Child';

  const newSoul: Soul = {
    id,
    recoveryPhrase,
    persona,
    wallets: [normalizedWallet],
    createdAt: Date.now(),
  };

  soulCache[id] = newSoul;
  walletIndex[normalizedWallet] = id;
  saveDB();

  return newSoul;
}

export function linkWalletToSoul(wallet: string, recoveryPhrase: string): { success: boolean; message: string; soul?: Soul } {
  const normalizedWallet = wallet.toLowerCase();

  // Check if wallet is already linked
  if (walletIndex[normalizedWallet]) {
    return { success: false, message: 'Wallet already linked to a Soul' };
  }

  // Find soul by recovery phrase
  const soul = Object.values(soulCache).find(s => s.recoveryPhrase === recoveryPhrase);

  if (!soul) {
    return { success: false, message: 'Invalid Recovery Phrase' };
  }

  // Link
  soul.wallets.push(normalizedWallet);
  walletIndex[normalizedWallet] = soul.id;
  saveDB();

  return { success: true, message: 'Wallet linked successfully', soul };
}

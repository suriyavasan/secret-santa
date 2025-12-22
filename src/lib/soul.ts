import { kv } from '@vercel/kv';
import crypto from 'crypto';

export type Persona = 'Christ Mom' | 'Christ Child';

export type Soul = {
  id: string;
  recoveryPhrase: string;
  persona: Persona;
  wallets: string[];
  createdAt: number;
};

export async function getSoulByWallet(wallet: string): Promise<Soul | null> {
  const normalizedWallet = wallet.toLowerCase();
  const soulId = await kv.hget<string>('walletIndex', normalizedWallet);
  if (soulId) {
    return await kv.hget<Soul>('souls', soulId);
  }
  return null;
}

export async function createSoul(wallet: string): Promise<Soul> {
  const normalizedWallet = wallet.toLowerCase();

  // Check if already exists
  const existingSoulId = await kv.hget<string>('walletIndex', normalizedWallet);
  if (existingSoulId) {
    const existingSoul = await kv.hget<Soul>('souls', existingSoulId);
    if (existingSoul) return existingSoul;
  }

  const id = crypto.randomUUID();
  const recoveryPhrase = Array.from({ length: 4 }, () =>
    Math.random().toString(36).substring(2, 8)
  ).join('-');

  const persona: Persona = Math.random() > 0.5 ? 'Christ Mom' : 'Christ Child';

  const newSoul: Soul = {
    id,
    recoveryPhrase,
    persona,
    wallets: [normalizedWallet],
    createdAt: Date.now(),
  };

  await kv.hset('souls', { [id]: newSoul });
  await kv.hset('walletIndex', { [normalizedWallet]: id });

  return newSoul;
}

export async function linkWalletToSoul(wallet: string, recoveryPhrase: string): Promise<{ success: boolean; message: string; soul?: Soul }> {
  const normalizedWallet = wallet.toLowerCase();

  const linkedId = await kv.hget<string>('walletIndex', normalizedWallet);
  if (linkedId) {
    return { success: false, message: 'Wallet already linked to a Soul' };
  }

  // Find soul by recovery phrase - this is expensive in Redis without an index.
  // For now, get all souls and search.
  const allSouls = await kv.hgetall<Record<string, Soul>>('souls');
  if (!allSouls) return { success: false, message: 'No souls found' };

  const soul = Object.values(allSouls).find(s => s.recoveryPhrase === recoveryPhrase);

  if (!soul) {
    return { success: false, message: 'Invalid Recovery Phrase' };
  }

  soul.wallets.push(normalizedWallet);
  await kv.hset('souls', { [soul.id]: soul });
  await kv.hset('walletIndex', { [normalizedWallet]: soul.id });

  return { success: true, message: 'Wallet linked successfully', soul };
}

import { NextResponse } from 'next/server';
import { linkWalletToSoul } from '@/lib/soul';

export async function POST(request: Request) {
    try {
        const { wallet, recoveryPhrase } = await request.json();

        if (!wallet || !recoveryPhrase) {
            return NextResponse.json({ error: 'Wallet and Recovery Phrase required' }, { status: 400 });
        }

        const result = await linkWalletToSoul(wallet, recoveryPhrase);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ soul: result.soul });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

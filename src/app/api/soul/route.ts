import { NextResponse } from 'next/server';
import { createSoul, getSoulByWallet } from '@/lib/soul';

export async function POST(request: Request) {
    try {
        const { wallet } = await request.json();

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        let soul = await getSoulByWallet(wallet);

        if (!soul) {
            soul = await createSoul(wallet);
        }

        return NextResponse.json({ soul });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

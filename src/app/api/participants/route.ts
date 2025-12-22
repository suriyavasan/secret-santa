import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET() {
    try {
        const users = await getAllUsers();
        // Return only necessary info
        const safeUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            isClaimed: !!u.walletAddress,
            proofImage: u.proofImage
        }));

        // Sort alphabetically for UI display
        safeUsers.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { claimUser, getUserById } from '@/lib/db'; // Assuming getUserById is now available

export async function POST(request: Request) {
    try {
        const { id, wallet } = await request.json();

        if (!id || !wallet) {
            return NextResponse.json({ error: 'ID and Wallet required' }, { status: 400 });
        }

        const user = getUserById(id); // Fetch user first

        if (!user) {
            // If user doesn't exist, proceed to claim for the first time
            const result = claimUser(id, wallet);

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({
                user: result.user,
                assignedPerson: result.assignedPerson
            });
        }

        // Enforce Wallet Persistence if user exists
        if (user.walletAddress) {
            if (user.walletAddress.toLowerCase() !== wallet.toLowerCase()) {
                const first5 = user.walletAddress.slice(0, 5);
                const last5 = user.walletAddress.slice(-5);
                return NextResponse.json({
                    error: `ID already claimed. Connect with: ${first5}...${last5}`
                }, { status: 403 });
            } else {
                // Wallet matches, user is already claimed by this wallet.
                // We might want to return the existing user info or re-claim/update.
                // For now, let's assume if wallet matches, it's a successful "claim" or verification.
                // If claimUser updates existing user, call it. Otherwise, just return existing user.
                // Assuming claimUser can handle updates or re-claiming if wallet matches.
                const result = claimUser(id, wallet);

                if (!result.success) {
                    return NextResponse.json({ error: result.message }, { status: 400 });
                }

                return NextResponse.json({
                    user: result.user,
                    assignedPerson: result.assignedPerson
                });
            }
        } else {
            // User exists but has no walletAddress (first time claim for an existing ID)
            const result = claimUser(id, wallet);

            if (!result.success) {
                return NextResponse.json({ error: result.message }, { status: 400 });
            }

            return NextResponse.json({
                user: result.user,
                assignedPerson: result.assignedPerson
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

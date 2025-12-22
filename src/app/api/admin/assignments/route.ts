import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET() {
    try {
        const users = await getAllUsers();

        // Create a simple list of Name -> ID
        const assignments = users.map(user => ({
            name: user.name,
            hashId: user.id,
            assignedTo: user.assignedToId ? users.find(u => u.id === user.assignedToId)?.name : 'None'
        }));

        return NextResponse.json({
            count: assignments.length,
            assignments: assignments
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

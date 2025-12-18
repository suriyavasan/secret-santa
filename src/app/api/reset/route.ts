import { NextResponse } from 'next/server';
import { resetDB } from '@/lib/db';

export async function POST() {
    try {
        resetDB();
        return NextResponse.json({ success: true, message: 'Database reset and remixed.' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

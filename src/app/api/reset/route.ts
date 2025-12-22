import { NextResponse } from 'next/server';
import { resetDB } from '@/lib/db';

export async function GET() {
    return handleReset();
}

export async function POST() {
    return handleReset();
}

async function handleReset() {
    try {
        console.log("Starting database reset...");
        await resetDB();
        return NextResponse.json({ success: true, message: 'Database reset and remixed.' });
    } catch (error: any) {
        console.error('Reset Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to reset database',
            details: error.message || String(error)
        }, { status: 500 });
    }
}

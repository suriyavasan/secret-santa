import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getUserById, claimUser } from '@/lib/db';
import fs from 'fs';

// Helper to update proof in DB (since we don't have a direct update function exposed yet, we'll modify the cache directly via a new helper or just use what we have. 
// Actually, let's add an updateProof function to db.ts first? 
// Or just read/write directly here? No, better to keep DB logic in db.ts.
// For now, I'll add a simple update function to db.ts in the next step or just import the cache if I exported it (I didn't).
// I'll modify db.ts to export an updateProof function.
// Wait, I can't modify db.ts in the middle of this write. 
// I will write this file assuming updateProof exists, then go add it.

import { updateProof } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file || !userId) {
            return NextResponse.json({ error: 'File and User ID required' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure upload dir exists
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file
        const ext = path.extname(file.name);
        const filename = `${userId}-${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Update DB
        const publicPath = `/uploads/${filename}`;
        const result = await updateProof(userId, publicPath);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, path: publicPath });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    // Simple secret-based authentication
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Check secret (use a random string)
    if (secret !== 'download_db_temp_2026') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Path to your SQLite database on Render
        const dbPath = '/opt/render/project/database/locations.db';

        // Check if file exists
        if (!fs.existsSync(dbPath)) {
            return new NextResponse('Database not found at: ' + dbPath, { status: 404 });
        }

        // Read the database file
        const dbFile = fs.readFileSync(dbPath);

        // Return as downloadable file
        return new NextResponse(dbFile, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="render-database.db"',
                'Content-Length': dbFile.length.toString(),
            },
        });
    } catch (error: any) {
        return new NextResponse('Error: ' + error.message, { status: 500 });
    }
}

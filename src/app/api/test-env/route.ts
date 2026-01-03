import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_SOURCE: getDatabaseSource(),
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    return Response.json(envInfo);
}

function getDatabaseSource() {
    const url = process.env.DATABASE_URL || '';
    if (url.includes('ep-solitary-waterfall')) {
        return 'DEVELOPMENT DB (ep-solitary-waterfall)';
    } else if (url.includes('ep-cool-star')) {
        return 'PRODUCTION DB (ep-cool-star)';
    }
    return 'UNKNOWN';
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Seeding OAuth2 clients...');

    // Create iOS app OAuth client
    const iosClient = await prisma.oAuthClient.upsert({
        where: { clientId: 'fotolokashen-ios' },
        update: {
            redirectUris: [
                'fotolokashen://oauth-callback',
                'fotolokashen://auth', // Alternative scheme
                'https://fotolokashen.com/app/auth-callback', // Universal Link (iOS 17.4+)
            ],
        },
        create: {
            clientId: 'fotolokashen-ios',
            clientSecret: null, // Public client (mobile app) - no secret
            name: 'fotolokashen iOS App',
            redirectUris: [
                'fotolokashen://oauth-callback',
                'fotolokashen://auth', // Alternative scheme
                'https://fotolokashen.com/app/auth-callback', // Universal Link (iOS 17.4+)
            ],
            scopes: ['read', 'write'],
            grantTypes: ['authorization_code', 'refresh_token'],
            isPublic: true,
        },
    });

    console.log('✅ Created OAuth client:', iosClient.name);
    console.log('   Client ID:', iosClient.clientId);
    console.log('   Redirect URIs:', iosClient.redirectUris.join(', '));
    console.log('   Scopes:', iosClient.scopes.join(', '));
}

main()
    .catch((error) => {
        console.error('❌ Error seeding OAuth clients:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

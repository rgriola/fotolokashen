import fs from 'fs';
import path from 'path';
import { MarkdownPageLayout } from '@/components/markdown/MarkdownPageLayout';

export const metadata = {
    title: 'Terms of Service | fotolokashen',
    description: 'Terms of Service for fotolokashen — professional production location management.',
};

export default function TermsPage() {
    const content = fs.readFileSync(
        path.join(process.cwd(), 'content', 'terms-of-service.md'),
        'utf-8'
    );

    return <MarkdownPageLayout content={content} />;
}

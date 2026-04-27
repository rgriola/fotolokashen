import fs from 'fs';
import path from 'path';
import { MarkdownPageLayout } from '@/components/markdown/MarkdownPageLayout';

export const metadata = {
    title: 'Help & FAQ | fotolokashen',
    description: 'Frequently asked questions and help documentation for fotolokashen.',
};

export default function HelpPage() {
    const content = fs.readFileSync(
        path.join(process.cwd(), 'content', 'help-faq.md'),
        'utf-8'
    );

    return <MarkdownPageLayout content={content} />;
}

import { MapsLayout } from '@/components/layout/MapsLayout';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
    return <MapsLayout>{children}</MapsLayout>;
}

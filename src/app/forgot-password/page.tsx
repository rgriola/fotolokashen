import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: 'url(/images/landing/hero/forgot-hero-bg.jpg)' }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-indigo-900/80" />

            {/* Animated Gradient Blur Effects */}
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" />

            {/* Content */}
            <div className="relative z-10 px-4 w-full">
                <ForgotPasswordForm />
            </div>
        </div>
    );
}

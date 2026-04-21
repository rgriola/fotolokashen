import Image from 'next/image';
import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{
    returnUrl?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { returnUrl, message } = params;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 opacity-90">
        <Image
          src="/images/landing/hero/login-hero-bg.jpg"
          alt="Login background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-social/80 to-primary/80" />

      {/* Animated Gradient Blur Effects */}
      <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />

      {/* Content — full height on mobile, centered on sm+ */}
      <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 flex-1 flex items-center justify-center py-4 sm:py-8">
        <div className="w-full max-w-md">
          {/* Logo — hidden on mobile, visible on sm+ */}
          <div className="hidden sm:flex mb-6 justify-center">
            <Image
              src="/logo.png"
              alt="fotolokashen"
              width={1200}
              height={196}
              className="w-auto h-16 sm:h-20"
              priority
            />
          </div>
          <LoginForm returnUrl={returnUrl} message={message} />
        </div>
      </div>
    </div>
  );
}

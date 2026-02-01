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
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: 'url(/images/landing/hero/login-hero-bg.jpg)' }}
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-indigo-900/80" />

      {/* Animated Gradient Blur Effects */}
      <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" />

      {/* Content - 25px from header with consistent padding */}
      <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 mt-[25px] flex-1 flex items-start md:items-center">
        <div className="w-full">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
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

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HoldToVerify } from '@/components/ui/HoldToVerify';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupportPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isVerified, setIsVerified] = useState(false);
  const [holdDuration, setHoldDuration] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateField = (fieldName: keyof FormData, value: string): string | undefined => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          return 'Name is required';
        } else if (value.length < 2) {
          return 'Name must be at least 2 characters';
        } else if (value.length > 100) {
          return 'Name must be less than 100 characters';
        }
        break;

      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        } else if (!EMAIL_REGEX.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'subject':
        if (!value.trim()) {
          return 'Subject is required';
        } else if (value.length < 5) {
          return 'Subject must be at least 5 characters';
        } else if (value.length > 200) {
          return 'Subject must be less than 200 characters';
        }
        break;

      case 'message':
        if (!value.trim()) {
          return 'Message is required';
        } else if (value.length < 10) {
          return 'Message must be at least 10 characters';
        } else if (value.length > 2000) {
          return 'Message must be less than 2000 characters';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.name = validateField('name', formData.name);
    newErrors.email = validateField('email', formData.email);
    newErrors.subject = validateField('subject', formData.subject);
    newErrors.message = validateField('message', formData.message);

    // Remove undefined errors
    Object.keys(newErrors).forEach((key) => {
      if (newErrors[key as keyof FormErrors] === undefined) {
        delete newErrors[key as keyof FormErrors];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    const error = validateField(fieldName, value);
    
    if (error) {
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    } else {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleVerified = (duration: number) => {
    setIsVerified(true);
    setHoldDuration(duration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isVerified) {
      setSubmitMessage('Please complete the human verification first.');
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('loading');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          holdDuration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Failed to send message. Please try again.');
        return;
      }

      setSubmitStatus('success');
      setSubmitMessage(data.message || 'Your message has been sent!');
      
      // Reset form after success
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsVerified(false);
      setHoldDuration(0);
    } catch (error) {
      console.error('Support form error:', error);
      setSubmitStatus('error');
      setSubmitMessage('An unexpected error occurred. Please try again.');
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.subject.trim() &&
    formData.message.trim() &&
    isVerified;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 opacity-90">
        <Image
          src="/images/landing/hero/login-hero-bg.jpg"
          alt="Support background"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-social/80 to-primary/80" />

      {/* Animated Gradient Blur Effects */}
      <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-md">

          {/* Form Card */}
          <div className="bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 sm:p-5">
            <h1 className="text-xl font-bold text-foreground dark:text-white mb-1">
              Fotolokasen Support
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
            Questions or login issues? Members should login first for account-specific inquiries.
            </p>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="mb-4 p-3 bg-success/10 dark:bg-success/10 border border-success/20 dark:border-success rounded-lg flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success dark:text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-success dark:text-success font-medium">
                    Message Sent!
                  </p>
                  <p className="text-success dark:text-success text-sm mt-1">
                    {submitMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="mb-4 p-3 bg-destructive/10 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive dark:text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-destructive dark:text-destructive font-medium">
                    Error
                  </p>
                  <p className="text-destructive dark:text-destructive text-sm mt-1">
                    {submitMessage}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name Field */}
              <div className="space-y-1">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Your name"
                  className={errors.name ? 'border-destructive' : ''}
                  disabled={submitStatus === 'loading'}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="your@email.com"
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={submitStatus === 'loading'}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              {/* Subject Field */}
              <div className="space-y-1">
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="What's this about?"
                  className={errors.subject ? 'border-destructive' : ''}
                  disabled={submitStatus === 'loading'}
                />
                {errors.subject && (
                  <p className="text-destructive text-sm">{errors.subject}</p>
                )}
              </div>

              {/* Message Field */}
              <div className="space-y-1">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Describe your question or issue..."
                  rows={4}
                  className={errors.message ? 'border-destructive' : ''}
                  disabled={submitStatus === 'loading'}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  {errors.message ? (
                    <p className="text-destructive">{errors.message}</p>
                  ) : (
                    <span></span>
                  )}
                  <span>{formData.message.length} / 2000</span>
                </div>
              </div>

              {/* Human Verification */}
              <div className="pt-1">
                <HoldToVerify
                  duration={3000}
                  onVerified={handleVerified}
                  verified={isVerified}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || submitStatus === 'loading'}
              >
                {submitStatus === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>

            {/* Footer Note */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              We typically respond within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

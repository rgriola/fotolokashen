'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Loader2, MessageSquare, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

function MemberSupportPageInner() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(() => ({
    name: '',
    email: '',
    subject: '',
    message: '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  // Pre-populate form with user data
  useEffect(() => {
    if (user) {
      const fullName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.username;
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({
        ...prev,
        name: fullName,
        email: user.email,
      }));
    }
  }, [user]);

  const validateField = (fieldName: keyof FormData, value: string): string | undefined => {
    switch (fieldName) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitStatus('loading');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/member-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Failed to send message. Please try again.');
        setShowDialog(true);
        return;
      }

      setSubmitStatus('success');
      setSubmitMessage(data.message || 'Your message has been sent! Check your email for confirmation.');
      setShowDialog(true);
      
      // Reset form after success
      setFormData({ 
        name: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user?.username || '',
        email: user?.email || '',
        subject: '', 
        message: '' 
      });
    } catch (error) {
      console.error('Support form error:', error);
      setSubmitStatus('error');
      setSubmitMessage('An unexpected error occurred. Please try again.');
      setShowDialog(true);
    }
  };

  const isFormValid =
    formData.subject.trim() &&
    formData.message.trim();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-6">
        
        <h1 className="text-3xl font-bold">Member Support</h1>
        <p className="text-muted-foreground mt-1">
          Get help with your account and submit questions to our support team
        </p>
      </div>

      {/* Member Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5" />
            Your Information
          </CardTitle>
          <CardDescription>
            This information will be included with your support request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="text-base font-medium">{formData.name}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-base font-medium">{formData.email}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Username</Label>
            <p className="text-base font-medium">@{user?.username}</p>
          </div>
        </CardContent>
      </Card>

      {/* Support Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Support Request
          </CardTitle>
          <CardDescription>
            Describe your issue or question in detail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Brief description of your issue"
                className={errors.subject ? 'border-red-500' : ''}
                disabled={submitStatus === 'loading'}
              />
              {errors.subject && (
                <p className="text-red-500 text-sm">{errors.subject}</p>
              )}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Provide details about your issue or question..."
                rows={6}
                className={errors.message ? 'border-red-500' : ''}
                disabled={submitStatus === 'loading'}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                {errors.message ? (
                  <p className="text-red-500">{errors.message}</p>
                ) : (
                  <span></span>
                )}
                <span>{formData.message.length} / 2000</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
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
                  Send Support Request
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              We typically respond within 24-48 hours
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Success/Error Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {submitStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Message Sent Successfully
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Error Sending Message
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-4">
              {submitMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowDialog(false)}>
              {submitStatus === 'success' ? 'Close' : 'Try Again'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MemberSupportPage() {
  return (
    <ProtectedRoute>
      <MemberSupportPageInner />
    </ProtectedRoute>
  );
}

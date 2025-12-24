'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Shield, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityLog {
    id: number;
    eventType: string;
    ipAddress: string | null;
    userAgent: string | null;
    location: string | null;
    success: boolean;
    metadata: any;
    createdAt: string;
    displayInfo: string;
}

export function SecurityActivityLog() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSecurityLogs();
    }, []);

    const fetchSecurityLogs = async () => {
        try {
            const response = await fetch('/api/auth/security-logs');
            const result = await response.json();

            if (!response.ok) {
                toast.error('Failed to load security activity');
                return;
            }

            setLogs(result.logs || []);
        } catch (error) {
            console.error('Security logs error:', error);
            toast.error('Failed to load security activity');
        } finally {
            setIsLoading(false);
        }
    };

    const getEventIcon = (eventType: string, success: boolean) => {
        if (!success) {
            return <XCircle className="w-4 h-4 text-red-500" />;
        }

        switch (eventType) {
            case 'login':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'password_change':
            case 'password_reset_success':
                return <Shield className="w-4 h-4 text-blue-500" />;
            case 'failed_login':
            case 'account_locked':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    const getEventLabel = (eventType: string) => {
        const labels: Record<string, string> = {
            'login': 'Login',
            'logout': 'Logout',
            'failed_login': 'Failed Login',
            'password_change': 'Password Changed',
            'password_reset_request': 'Password Reset Requested',
            'password_reset_success': 'Password Reset',
            'account_locked': 'Account Locked',
        };
        return labels[eventType] || eventType;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Security Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Security Activity
                </CardTitle>
                <CardDescription>
                    Recent security events on your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No security activity yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                            >
                                <div className="mt-0.5">
                                    {getEventIcon(log.eventType, log.success)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {getEventLabel(log.eventType)}
                                                {!log.success && (
                                                    <span className="ml-2 text-xs text-red-500">(Failed)</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {log.displayInfo}
                                            </p>
                                            {log.location && (
                                                <p className="text-xs text-muted-foreground">
                                                    {log.location}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(log.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

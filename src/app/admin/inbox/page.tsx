'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Inbox, MailIcon, Paperclip, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

interface InboundEmailListItem {
  id: number;
  providerEmailId: string;
  providerMessageId: string | null;
  fromRaw: string;
  fromEmail: string | null;
  fromName: string | null;
  toCsv: string;
  subject: string;
  receivedAt: string;
  forwardConfigured: boolean;
  forwardStatus: string | null;
  forwardedToCsv: string | null;
  forwardedFrom: string | null;
  forwardError: string | null;
  createdAt: string;
  _count: {
    attachments: number;
  };
}

interface InboundEmailAttachment {
  id: number;
  providerAttachmentId: string;
  filename: string | null;
  size: number | null;
  contentType: string | null;
  contentId: string | null;
  contentDisposition: string | null;
}

interface InboundEmailDetail {
  id: number;
  providerEmailId: string;
  providerMessageId: string | null;
  fromRaw: string;
  fromEmail: string | null;
  fromName: string | null;
  toCsv: string;
  toJson: string[];
  ccCsv: string | null;
  bccCsv: string | null;
  replyToCsv: string | null;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  headers: Record<string, string> | null;
  threadId: string | null;
  inReplyTo: string | null;
  references: string | null;
  forwardConfigured: boolean;
  forwardStatus: string | null;
  forwardedToCsv: string | null;
  forwardedFrom: string | null;
  forwardProviderId: string | null;
  forwardError: string | null;
  receivedAt: string;
  rawDownloadUrl: string | null;
  rawExpiresAt: string | null;
  attachments: InboundEmailAttachment[];
}

interface InboxResponse {
  items: InboundEmailListItem[];
  pagination: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

interface InboxHealthResponse {
  windowHours: number;
  generatedAt: string;
  status: 'healthy' | 'warning';
  metrics: {
    inboundReceived: number;
    forwardOk: number;
    forwardFailed: number;
    forwardNotConfigured: number;
  };
  lastInbound: {
    id: number;
    subject: string;
    toCsv: string;
    receivedAt: string;
    forwardStatus: string | null;
    forwardError: string | null;
  } | null;
}

interface InboundAlertResponse {
  sent?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  snapshot?: {
    metrics: {
      forwardFailed: number;
      forwardNotConfigured: number;
    };
  };
}

type ForwardFilter = 'all' | 'ok' | 'failed' | 'not_configured';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatFileSize(size: number | null): string {
  if (size === null || Number.isNaN(size)) {
    return 'Unknown size';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ForwardStatusBadge({ status }: { status: string | null }) {
  if (status === 'ok') {
    return <Badge className="border-success/20 bg-success/10 text-success">Forwarded</Badge>;
  }

  if (status === 'failed') {
    return <Badge className="border-destructive/20 bg-destructive/10 text-destructive">Failed</Badge>;
  }

  if (status === 'not_configured') {
    return <Badge className="border-warning/20 bg-warning/10 text-warning">Not Configured</Badge>;
  }

  return <Badge variant="secondary">Unknown</Badge>;
}

export default function AdminInboxPage() {
  const router = useRouter();

  const [items, setItems] = useState<InboundEmailListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboundEmailDetail | null>(null);
  const [health, setHealth] = useState<InboxHealthResponse | null>(null);

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const [search, setSearch] = useState('');
  const [forwardFilter, setForwardFilter] = useState<ForwardFilter>('all');
  const [supportOnly, setSupportOnly] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchList = useCallback(async () => {
    try {
      setIsLoadingList(true);
      setIsLoadingHealth(true);

      const params = new URLSearchParams({
        page: String(page),
        perPage: '20',
        search,
        forwardStatus: forwardFilter,
        supportOnly: supportOnly ? 'true' : 'false',
      });

      const [response, healthResponse] = await Promise.all([
        fetch(`/api/admin/inbound-emails?${params.toString()}`),
        fetch('/api/admin/inbound-emails/health'),
      ]);

      if (!response.ok) {
        throw new Error('Failed to load inbound inbox');
      }

      const data = (await response.json()) as InboxResponse;
      if (healthResponse.ok) {
        const healthData = (await healthResponse.json()) as InboxHealthResponse;
        setHealth(healthData);
      } else {
        setHealth(null);
      }

      setItems(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);

      if (!selectedId && data.items?.length > 0) {
        setSelectedId(data.items[0].id);
      }

      if (selectedId && data.items.every((item) => item.id !== selectedId)) {
        setSelectedId(data.items[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to fetch inbound inbox:', error);
      toast.error('Failed to load inbox');
      setHealth(null);
    } finally {
      setIsLoadingList(false);
      setIsLoadingHealth(false);
    }
  }, [forwardFilter, page, search, selectedId, supportOnly]);

  const fetchDetail = useCallback(async (id: number) => {
    try {
      setIsLoadingDetail(true);
      const response = await fetch(`/api/admin/inbound-emails/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load inbound email detail');
      }

      const data = await response.json();
      setSelectedEmail(data.email as InboundEmailDetail);
    } catch (error) {
      console.error('Failed to fetch inbound email detail:', error);
      toast.error('Failed to load email detail');
      setSelectedEmail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const sendForwardAlert = useCallback(async () => {
    try {
      setIsSendingAlert(true);

      const response = await fetch('/api/admin/inbound-emails/health/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          windowHours: health?.windowHours || 24,
          limit: 10,
        }),
      });

      const data = (await response.json()) as InboundAlertResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send alert');
      }

      if (data.skipped) {
        toast.message(data.reason || 'No alert sent because no failures were detected.');
        return;
      }

      const failed = data.snapshot?.metrics.forwardFailed ?? 0;
      const notConfigured = data.snapshot?.metrics.forwardNotConfigured ?? 0;
      toast.success(`Slack alert sent (failed: ${failed}, not configured: ${notConfigured}).`);
    } catch (error) {
      console.error('Failed to send forwarding alert:', error);
      const message = error instanceof Error ? error.message : 'Failed to send forwarding alert';
      toast.error(message);
    } finally {
      setIsSendingAlert(false);
    }
  }, [health?.windowHours]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId) {
      void fetchDetail(selectedId);
    } else {
      setSelectedEmail(null);
    }
  }, [fetchDetail, selectedId]);

  const selectedSummary = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  return (
    <AdminRoute>
      <div className="container max-w-7xl mx-auto py-6 px-4 space-y-4">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-muted-foreground">Admin Panel</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Inbox</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-muted-foreground">Inbound support emails and forward health</span>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 border-b">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/users')}
              className="rounded-b-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/email-templates')}
              className="rounded-b-none"
            >
              <MailIcon className="w-4 h-4 mr-2" />
              Email Templates
            </Button>
            <Button variant="ghost" className="rounded-b-none border-b-2 border-primary">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Email Health (24h)</CardTitle>
            <CardDescription>
              Monitor inbound volume and forwarding outcomes for quick issue detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingHealth ? (
              <p className="text-sm text-muted-foreground">Loading health metrics...</p>
            ) : !health ? (
              <p className="text-sm text-muted-foreground">Health metrics unavailable.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    className={
                      health.status === 'healthy'
                        ? 'border-success/20 bg-success/10 text-success'
                        : 'border-warning/20 bg-warning/10 text-warning'
                    }
                  >
                    {health.status === 'healthy' ? 'Healthy' : 'Warning'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDateTime(health.generatedAt)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-md border p-3 bg-card">
                    <p className="text-xs text-muted-foreground">Inbound Received</p>
                    <p className="text-xl font-semibold">{health.metrics.inboundReceived}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-card">
                    <p className="text-xs text-muted-foreground">Forward OK</p>
                    <p className="text-xl font-semibold text-success">{health.metrics.forwardOk}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-card">
                    <p className="text-xs text-muted-foreground">Forward Failed</p>
                    <p className="text-xl font-semibold text-destructive">{health.metrics.forwardFailed}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-card">
                    <p className="text-xs text-muted-foreground">Not Configured</p>
                    <p className="text-xl font-semibold text-warning">{health.metrics.forwardNotConfigured}</p>
                  </div>
                </div>

                {health.lastInbound ? (
                  <div className="text-sm">
                    <span className="font-medium">Last inbound:</span>{' '}
                    {formatDateTime(health.lastInbound.receivedAt)} to {health.lastInbound.toCsv || 'Unknown recipient'}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No inbound messages found yet.</div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(1);
                      setForwardFilter('failed');
                    }}
                  >
                    Show Failed
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(1);
                      setForwardFilter('not_configured');
                    }}
                  >
                    Show Not Configured
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(1);
                      setForwardFilter('all');
                    }}
                  >
                    Clear Forward Filter
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSendingAlert || isLoadingHealth}
                    onClick={() => {
                      void sendForwardAlert();
                    }}
                  >
                    {isSendingAlert ? 'Sending Alert...' : 'Send Slack Alert'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Inbound Mailbox</CardTitle>
            <CardDescription>
              View received support emails and forwarding outcomes from Resend inbound events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search sender, recipient, subject..."
                  className="pl-10"
                />
              </div>

              <Select
                value={forwardFilter}
                onValueChange={(value: ForwardFilter) => {
                  setPage(1);
                  setForwardFilter(value);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Forward status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forward States</SelectItem>
                  <SelectItem value="ok">Forwarded</SelectItem>
                  <SelectItem value="failed">Forward Failed</SelectItem>
                  <SelectItem value="not_configured">Not Configured</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant={supportOnly ? 'default' : 'outline'}
                onClick={() => {
                  setPage(1);
                  setSupportOnly((previous) => !previous);
                }}
              >
                {supportOnly ? 'Support-only On' : 'Support-only Off'}
              </Button>

              <div className="flex-1" />

              <Button type="button" variant="outline" onClick={() => fetchList()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Received</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Forward</TableHead>
                    <TableHead className="text-right">Files</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingList ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading inbox...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No inbound emails matched your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer ${selectedId === item.id ? 'bg-accent/30' : ''}`}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(item.receivedAt)}
                        </TableCell>
                        <TableCell className="max-w-60 truncate" title={item.fromRaw}>
                          {item.fromName || item.fromEmail || item.fromRaw}
                        </TableCell>
                        <TableCell className="max-w-56 truncate" title={item.toCsv}>
                          {item.toCsv || 'Unknown recipient'}
                        </TableCell>
                        <TableCell className="max-w-72 truncate" title={item.subject}>
                          {item.subject || '(no subject)'}
                        </TableCell>
                        <TableCell>
                          <ForwardStatusBadge status={item.forwardStatus} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {item._count.attachments}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Email Detail</CardTitle>
            <CardDescription>
              {selectedSummary
                ? `Inbound message ${selectedSummary.providerEmailId}`
                : 'Select an email row to inspect full content'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">No email selected.</p>
            ) : isLoadingDetail ? (
              <p className="text-sm text-muted-foreground">Loading email detail...</p>
            ) : !selectedEmail ? (
              <p className="text-sm text-muted-foreground">Unable to load selected email.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="font-medium">From:</span> {selectedEmail.fromRaw}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {selectedEmail.toCsv || 'Unknown recipient'}
                  </div>
                  {selectedEmail.replyToCsv ? (
                    <div>
                      <span className="font-medium">Reply-To:</span> {selectedEmail.replyToCsv}
                    </div>
                  ) : null}
                  <div>
                    <span className="font-medium">Subject:</span> {selectedEmail.subject || '(no subject)'}
                  </div>
                  <div>
                    <span className="font-medium">Received:</span> {formatDateTime(selectedEmail.receivedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">forwardConfigured:</span>
                    <Badge
                      className={
                        selectedEmail.forwardConfigured
                          ? 'border-success/20 bg-success/10 text-success'
                          : 'border-warning/20 bg-warning/10 text-warning'
                      }
                    >
                      {selectedEmail.forwardConfigured ? 'true' : 'false'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">forwardStatus:</span>
                    <ForwardStatusBadge status={selectedEmail.forwardStatus} />
                    <span className="text-xs text-muted-foreground">
                      {selectedEmail.forwardStatus || 'null'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">forwardedToCsv:</span> {selectedEmail.forwardedToCsv || 'None'}
                  </div>
                  <div>
                    <span className="font-medium">forwardedFrom:</span> {selectedEmail.forwardedFrom || 'None'}
                  </div>
                  <div className={selectedEmail.forwardError ? 'text-destructive' : 'text-muted-foreground'}>
                    <span className="font-medium">forwardError:</span> {selectedEmail.forwardError || 'None'}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({selectedEmail.attachments.length})
                  </h4>
                  {selectedEmail.attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attachments.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment) => (
                        <div key={attachment.id} className="rounded-md border p-3 text-sm bg-card">
                          <p className="font-medium">{attachment.filename || 'Unnamed file'}</p>
                          <p className="text-muted-foreground">
                            {attachment.contentType || 'Unknown type'} • {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Text Body</h4>
                  <div className="rounded-md border bg-muted/40 p-3 max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedEmail.textBody || 'No text body available.'}
                    </pre>
                  </div>
                </div>

                {selectedEmail.htmlBody ? (
                  <div>
                    <h4 className="font-medium mb-2">HTML Body (raw)</h4>
                    <div className="rounded-md border bg-muted/40 p-3 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">{selectedEmail.htmlBody}</pre>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  );
}

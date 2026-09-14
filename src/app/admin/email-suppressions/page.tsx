"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inbox, MailX, Users } from "lucide-react";
import { toast } from "sonner";

interface EmailSuppressionItem {
  id: number;
  email: string;
  reason: string;
  detail: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SuppressionListResponse {
  data: EmailSuppressionItem[];
  pagination: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

type ReasonFilter =
  | "all"
  | "hard_bounce"
  | "complaint"
  | "provider_suppressed"
  | "manual";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function ReasonBadge({ reason }: { reason: string }) {
  if (reason === "hard_bounce") {
    return (
      <Badge className="border-destructive/20 bg-destructive/10 text-destructive">
        Hard Bounce
      </Badge>
    );
  }

  if (reason === "complaint") {
    return (
      <Badge className="border-warning/20 bg-warning/10 text-warning">
        Complaint
      </Badge>
    );
  }

  if (reason === "provider_suppressed") {
    return (
      <Badge className="border-warning/20 bg-warning/10 text-warning">
        Provider Suppressed
      </Badge>
    );
  }

  if (reason === "manual") {
    return <Badge variant="secondary">Manual</Badge>;
  }

  return <Badge variant="secondary">{reason}</Badge>;
}

export default function AdminEmailSuppressionsPage() {
  const router = useRouter();

  const [items, setItems] = useState<EmailSuppressionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [newEmail, setNewEmail] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        perPage: "20",
      });
      if (reasonFilter !== "all") {
        params.set("reason", reasonFilter);
      }

      const response = await fetch(
        `/api/admin/email-suppressions?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load suppressions");
      }

      const data = (await response.json()) as SuppressionListResponse;
      setItems(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch email suppressions:", error);
      toast.error("Failed to load email suppressions");
    } finally {
      setIsLoading(false);
    }
  }, [page, reasonFilter]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleAddSuppression = useCallback(async () => {
    const email = newEmail.trim();
    if (!email) {
      toast.error("Enter an email address");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/admin/email-suppressions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          detail: newDetail.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error || "Failed to suppress address");
        return;
      }

      toast.success(`Suppressed ${email}`);
      setNewEmail("");
      setNewDetail("");
      setPage(1);
      void fetchList();
    } catch (error) {
      console.error("Failed to add email suppression:", error);
      toast.error("Failed to suppress address");
    } finally {
      setIsSubmitting(false);
    }
  }, [newEmail, newDetail, fetchList]);

  const handleRemoveSuppression = useCallback(
    async (email: string) => {
      try {
        setRemovingEmail(email);
        const response = await fetch(
          `/api/admin/email-suppressions/${encodeURIComponent(email)}`,
          { method: "DELETE" },
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          toast.error(data.error || "Failed to reinstate address");
          return;
        }

        toast.success(`Reinstated ${email}`);
        void fetchList();
      } catch (error) {
        console.error("Failed to remove email suppression:", error);
        toast.error("Failed to reinstate address");
      } finally {
        setRemovingEmail(null);
      }
    },
    [fetchList],
  );

  return (
    <AdminRoute>
      <div className="container max-w-7xl mx-auto py-6 px-4 space-y-4">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-muted-foreground">
            Admin Panel
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Email Suppressions</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-muted-foreground">
            Manage addresses excluded from outbound mail
          </span>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 border-b">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/users")}
              className="rounded-b-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/inbox")}
              className="rounded-b-none"
            >
              <Inbox className="w-4 h-4 mr-2" />
              Inbox
            </Button>
            <Button
              variant="ghost"
              className="rounded-b-none border-b-2 border-primary"
            >
              <MailX className="w-4 h-4 mr-2" />
              Suppressions
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Suppress an Address</CardTitle>
            <CardDescription>
              Manually block an address from receiving any future mail. This
              does not affect security-class mail sent by other reasons (e.g.
              bounce/complaint) — only manual suppressions block every category.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="address@example.com"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                className="md:w-72"
              />
              <Textarea
                placeholder="Optional note (e.g. reason for suppressing)"
                value={newDetail}
                onChange={(event) => setNewDetail(event.target.value)}
                rows={1}
                className="md:flex-1"
              />
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  void handleAddSuppression();
                }}
              >
                {isSubmitting ? "Suppressing..." : "Suppress"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Suppressed Addresses</CardTitle>
            <CardDescription>
              Populated automatically from hard bounces and spam complaints,
              plus any manual entries above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={reasonFilter}
                onValueChange={(value) => {
                  setPage(1);
                  setReasonFilter(value as ReasonFilter);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reasons</SelectItem>
                  <SelectItem value="hard_bounce">Hard Bounce</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="provider_suppressed">
                    Provider Suppressed
                  </SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No suppressed addresses.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.email}
                        </TableCell>
                        <TableCell>
                          <ReasonBadge reason={item.reason} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                          {item.detail || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={removingEmail === item.email}
                            onClick={() => {
                              void handleRemoveSuppression(item.email);
                            }}
                          >
                            {removingEmail === item.email
                              ? "Reinstating..."
                              : "Reinstate"}
                          </Button>
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
                  onClick={() =>
                    setPage((previous) => Math.max(1, previous - 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((previous) => Math.min(totalPages, previous + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  );
}

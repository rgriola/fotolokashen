"use client";

/**
 * Admin page to preview the real email-content.ts templates (branding review).
 * Renders live HTML from /api/admin/email-preview so edits to email-content.ts
 * show up immediately — no copy-pasted markup to keep in sync.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Inbox,
  MailX,
  Mail,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateOption {
  value: string;
  label: string;
  subject: string;
}

const DEVICE_WIDTHS = {
  web: { width: 640, label: "Web", icon: Monitor },
  tablet: { width: 768, label: "Tablet", icon: Tablet },
  mobile: { width: 375, label: "Mobile", icon: Smartphone },
} as const;

type DeviceSize = keyof typeof DEVICE_WIDTHS;

export default function EmailPreviewPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [device, setDevice] = useState<DeviceSize>("web");
  const [isLoading, setIsLoading] = useState(true);

  const fetchHtml = useCallback(async (templateKey: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/email-preview?template=${encodeURIComponent(templateKey)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load template");
      }
      const data = await response.json();
      setHtml(data.html);
      setSubject(data.subject);
    } catch {
      toast.error("Failed to load email preview");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/admin/email-preview");
        if (!response.ok) {
          throw new Error("Failed to load templates");
        }
        const data = await response.json();
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setSelected(data.templates[0].value);
          await fetchHtml(data.templates[0].value);
        }
      } catch {
        toast.error("Failed to load email templates");
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [fetchHtml]);

  const handleSelect = (value: string) => {
    setSelected(value);
    fetchHtml(value);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success("Email HTML copied to clipboard");
    } catch {
      toast.error("Failed to copy HTML");
    }
  };

  return (
    <AdminRoute>
      <div className="container max-w-7xl mx-auto py-6 px-4 space-y-4">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-muted-foreground">
            Admin Panel
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Email Preview</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-muted-foreground">
            Live preview of transactional email branding
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
              onClick={() => router.push("/admin/email-suppressions")}
              className="rounded-b-none"
            >
              <MailX className="w-4 h-4 mr-2" />
              Suppressions
            </Button>
            <Button
              variant="ghost"
              className="rounded-b-none border-b-2 border-primary"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Preview
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              Transactional Email Templates
            </CardTitle>
            <CardDescription>
              Rendered directly from <code>src/lib/email-content.ts</code> with
              sample data. Edit that file to change branding, colors, or copy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selected} onValueChange={handleSelect}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-1 ml-auto">
                {(Object.keys(DEVICE_WIDTHS) as DeviceSize[]).map((size) => {
                  const { icon: Icon, label } = DEVICE_WIDTHS[size];
                  return (
                    <Button
                      key={size}
                      variant={device === size ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setDevice(size)}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {label}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyHtml}
                disabled={!html || isLoading}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy HTML
              </Button>
            </div>

            {subject && (
              <p className="text-sm text-muted-foreground">
                Subject: <span className="text-foreground">{subject}</span>
              </p>
            )}

            <div className="flex justify-center rounded-lg border bg-muted/30 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading preview...
                </div>
              ) : (
                <iframe
                  title="Email preview"
                  srcDoc={html}
                  style={{ width: DEVICE_WIDTHS[device].width }}
                  className="h-180 max-w-full rounded-md border bg-white"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminRoute>
  );
}

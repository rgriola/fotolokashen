import fs from "fs";
import path from "path";
import { MarkdownPageLayout } from "@/components/markdown/MarkdownPageLayout";

export const metadata = {
  title: "Privacy Policy | Fotolokashen",
  description:
    "Privacy Policy for Fotolokashen — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "content", "privacy-policy.md"),
    "utf-8",
  );

  return <MarkdownPageLayout content={content} />;
}

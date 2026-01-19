"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 18, 2026
        </p>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to fotolokashen. We respect your privacy and are committed to protecting 
              your personal data. This privacy policy explains how we collect, use, and safeguard 
              your information when you use our web application and iOS app. 
            </p>
            <h2 className="text-2xl font-semibold mb-4">2. Our Assignment</h2>
            <p className="text-muted-foreground leading-relaxed">
              Fotolokashen is a professional production management app. The intent is to track production location 
              features for future use, sharing with crew or colleague, adding locations to your film projects during all 
              phase of productions, and to make it easy for our community to do so. You can connect with friends and 
              an allow access to each other's location tracking. 
              A production manager, photographer, producer or any part of a production can see this info unless you limit access. 
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Account Information:</strong> Email address, name, and password when you 
                create an account
              </li>
              <li>
                <strong>Location Data:</strong> Places you save, including addresses, coordinates, 
                and notes you add
              </li>
              <li>
                <strong>Photos:</strong> Images you upload to associate with your saved locations
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our app, including features used 
                and time spent
              </li>
              <li>
                <strong>Device Information:</strong> Device type, operating system, and app version 
                for troubleshooting
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and maintain our service</li>
              <li>Store and sync your saved locations across devices</li>
              <li>Display your photos alongside your saved locations</li>
              <li>Send important service updates and notifications</li>
              <li>Respond to your support requests</li>
              <li>Improve our app based on usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use secure 
              cloud infrastructure to store your account information, locations, and photos. 
              All data transmission is encrypted using HTTPS/TLS protocols. We implement 
              appropriate technical and organizational measures to protect your personal data 
              against unauthorized access, alteration, disclosure, or destruction. 
            </p>
            <h2 className="text-2xl font-semibold mb-4">6. Your Password</h2>
            <p className="text-muted-foreground leading-relaxed">
             Once your password is validated for security we cannot read it. It is encypted. 
             Do not share your password or account with another person, this is a security risk.
             Your password should be unique to this app. 
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Google Maps API:</strong> To display maps and search for locations
              </li>
              <li>
                <strong>Image Kit:</strong> To securely store your uploaded photos
              </li>
              <li>
                <strong>Authentication Providers:</strong> For secure login (if using social login)
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These services have their own privacy policies governing their use of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties.
              We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating our app (under strict confidentiality)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us through our{" "}
              <Link href="/support" className="text-primary hover:underline">
                support page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data for as long as your account is active or as needed 
              to provide you services. If you delete your account, we delete your personal 
              data within 30 days, inlcuding photos, except where we are required to retain data for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for children. Only adults 18+ years of age are allowed to use Fotolokashen.
              Parents if you believe your has signed up for an account please contact us via our support page. 
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; 
              date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through 
              our{" "}
              <Link href="/support" className="text-primary hover:underline">
                support page
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} fotolokashen. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

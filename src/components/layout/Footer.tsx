import Link from "next/link";
import { MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-background">
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <MapPin className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">Merkel Vision</span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Enhance your Google Maps experience. Search, save, and organize
                            your favorite locations with custom notes and photos.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold mb-3">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/map"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Map
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/my-locations"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    My Locations
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="font-semibold mb-3">Account</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/login"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/register"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Register
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Profile
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} Merkel Vision. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-sm">
                        <Link
                            href="/privacy"
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

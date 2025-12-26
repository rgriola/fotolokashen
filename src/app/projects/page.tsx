"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Sparkles } from "lucide-react";

function ProjectsPageInner() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <Card className="border-2 border-dashed">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Folder className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold">My Projects</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Organize your locations into projects
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 pb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                            <h3 className="text-xl font-semibold">Feature Coming Soon</h3>
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            We're working on an exciting new feature that will allow you to group your saved locations into projects for better organization.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 pt-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">📁 Project Groups</h4>
                            <p className="text-sm text-muted-foreground">
                                Organize locations by film shoots, events, or trips
                            </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">🤝 Team Sharing</h4>
                            <p className="text-sm text-muted-foreground">
                                Collaborate with team members on projects
                            </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">📊 Project Stats</h4>
                            <p className="text-sm text-muted-foreground">
                                Track locations and activity per project
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <p className="text-sm text-muted-foreground italic">
                            💡 In the meantime, you can continue managing your locations from the{" "}
                            <a href="/locations" className="text-primary hover:underline font-medium">
                                My Locations
                            </a>{" "}
                            page.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProjectsPage() {
    return (
        <ProtectedRoute>
            <ProjectsPageInner />
        </ProtectedRoute>
    );
}

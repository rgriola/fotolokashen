"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Sparkles, Image, Zap, Users } from "lucide-react";
import Link from "next/link";

function CreateWithPhotoPageInner() {
    return (
        <div className="container max-w-5xl mx-auto py-12 px-4">
            <Card className="border-2">
                <CardHeader className="text-center pb-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Create Locations from Photos
                    </CardTitle>
                    <CardDescription className="text-lg mt-3">
                        Upload photos with GPS data and instantly create locations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pb-8">
                    {/* Coming Soon Badge */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-8 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-6 h-6 text-green-600 animate-pulse" />
                            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                                Coming Soon!
                            </h3>
                            <Sparkles className="w-6 h-6 text-green-600 animate-pulse" />
                        </div>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            We're developing an exciting feature that will revolutionize how you document locations. Simply upload a photo, and we'll extract the GPS coordinates to create a location automatically!
                        </p>
                    </div>

                    {/* How It Will Work */}
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-center">How It Will Work</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-muted/50 rounded-lg p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-green-600">1</span>
                                </div>
                                <h4 className="font-semibold mb-2">Upload Photo</h4>
                                <p className="text-sm text-muted-foreground">
                                    Choose a photo from your device that contains GPS data
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-green-600">2</span>
                                </div>
                                <h4 className="font-semibold mb-2">GPS Extraction</h4>
                                <p className="text-sm text-muted-foreground">
                                    We automatically read the GPS coordinates from the photo's metadata
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-green-600">3</span>
                                </div>
                                <h4 className="font-semibold mb-2">Location Created</h4>
                                <p className="text-sm text-muted-foreground">
                                    Review the auto-filled details and save your location with the photo attached
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-center">Planned Features</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950 rounded-lg">
                                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold mb-1">GPS Coordinate Extraction</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically read latitude, longitude, and altitude from photo EXIF data
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950 rounded-lg">
                                <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold mb-1">Smart Auto-Fill</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Address, date, and location details populated automatically from photo metadata
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950 rounded-lg">
                                <Image className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold mb-1">Multiple Photos Per Location</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Upload several photos from the same shoot and cluster them by GPS proximity
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950 rounded-lg">
                                <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold mb-1">Visual Photo Positioning</h4>
                                    <p className="text-sm text-muted-foreground">
                                        See exactly where each photo was taken with small dots on the map
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Perfect For */}
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4 text-center">Perfect For:</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium">
                                📸 Location Scouts
                            </span>
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium">
                                🎬 Film Production
                            </span>
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium">
                                📷 Photographers
                            </span>
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium">
                                🗺️ Travel Bloggers
                            </span>
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm font-medium">
                                🏗️ Site Surveyors
                            </span>
                        </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Privacy & Security
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            We respect your privacy! You'll always be asked for permission before we read GPS data from your photos. You can also choose to remove or strip GPS information before uploading.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="text-center pt-4">
                        <p className="text-muted-foreground mb-4">
                            In the meantime, continue creating locations using the map or search!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/map">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Go to Map
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/locations">
                                    View My Locations
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Implementation Timeline */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="text-center">Development Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Feature Planning</p>
                                <p className="text-sm text-muted-foreground">Implementation plan completed ✓</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                                <span className="text-white font-bold">2</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">User Feedback Collection</p>
                                <p className="text-sm text-muted-foreground">Gathering requirements from early users</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-600 dark:text-gray-400 font-bold">3</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-muted-foreground">Development & Testing</p>
                                <p className="text-sm text-muted-foreground">Coming soon...</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CreateWithPhotoPage() {
    return (
        <ProtectedRoute>
            <CreateWithPhotoPageInner />
        </ProtectedRoute>
    );
}

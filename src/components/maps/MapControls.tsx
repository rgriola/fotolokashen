'use client';

import { useState } from 'react';
import { MapPinIcon, Navigation, Users, Map, Search, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface MapControlsProps {
    userLocation: { lat: number; lng: number } | null;
    onGpsToggle: () => Promise<void>;
    onFriendsClick: () => void;
    onViewAllClick: () => void;
    onMyLocationsClick: () => void;
    onSearchClick: () => void;
    searchOpen: boolean;
    hideMobileButton?: boolean;
    savedLocationsCount: number;
}

export function MapControls({
    userLocation,
    onGpsToggle,
    onFriendsClick,
    onViewAllClick,
    onMyLocationsClick,
    onSearchClick,
    searchOpen,
    hideMobileButton = false,
    savedLocationsCount,
}: MapControlsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleActionClick = async (action: () => void | Promise<void>) => {
        setIsOpen(false);
        await action();
    };

    return (
        <>
            {/* Desktop View - Horizontal buttons centered at top */}
            <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 gap-2 z-10 transition-all duration-300 ${searchOpen ? 'top-20' : 'top-4'
                }`}>
                {/* Search Button */}
                <Button
                    onClick={onSearchClick}
                    className="bg-white hover:bg-gray-50 text-gray-900 shadow-lg border border-gray-200 h-12 w-12"
                    size="icon"
                    title="Search locations"
                >
                    <Search className="w-5 h-5" />
                </Button>

                {/* GPS Toggle Button */}
                <Button
                    onClick={onGpsToggle}
                    className={`shadow-lg border border-gray-200 transition-colors h-12 w-12 ${userLocation
                        ? 'bg-[#4285F4] hover:bg-[#3367D6] text-white border-transparent'
                        : 'bg-slate-800 hover:bg-slate-900 text-white border-transparent'
                        }`}
                    size="icon"
                    title={userLocation ? 'Hide GPS Location' : 'Show GPS Location'}
                >
                    <Navigation className={`w-5 h-5 ${userLocation ? 'fill-current' : ''}`} />
                </Button>

                {/* Friends Button */}
                <Button
                    onClick={onFriendsClick}
                    className="bg-white hover:bg-gray-50 text-gray-900 shadow-lg border border-gray-200 h-12 w-12"
                    size="icon"
                    title="View friends' locations"
                >
                    <Users className="w-5 h-5" />
                </Button>

                {/* View All Locations Button */}
                <Button
                    onClick={onViewAllClick}
                    className="bg-white hover:bg-gray-50 text-gray-900 shadow-lg border border-gray-200 h-12 w-12"
                    size="icon"
                    title="View all saved locations on map"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
                        <path d="M15 5.764v15" />
                        <path d="M9 3.236v15" />
                    </svg>
                </Button>

                {/* My Locations List Button */}
                <Button
                    onClick={onMyLocationsClick}
                    className="bg-white hover:bg-gray-50 text-gray-900 shadow-lg border border-gray-200 relative h-12 w-12"
                    size="icon"
                    title={`Show list of saved locations (${savedLocationsCount})`}
                >
                    <MapPinIcon className="w-5 h-5" />
                    {savedLocationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {savedLocationsCount > 9 ? '9+' : savedLocationsCount}
                        </span>
                    )}
                </Button>

                {/* Photo Upload Button */}
                <a
                    href="/create-with-photo"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 w-12 bg-green-600 hover:bg-green-700 text-white shadow-lg border border-green-700"
                    title="Create location from photo"
                >
                    <Camera className="w-5 h-5" />
                </a>
            </div>

            {/* Mobile View - Sheet menu only (no floating buttons for cleaner UI) */}
            <div className="md:hidden">
                {/* Floating Map Controls Button - Position above hamburger menu, hide when sidebar open */}
                {!hideMobileButton && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed right-6 z-[90] h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center transition-all active:scale-95"
                        style={{ bottom: '7.75rem' }}
                        aria-label="Map controls menu"
                    >
                        <Map className="h-6 w-6" />
                    </button>
                )}

                {/* Sheet with all controls */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent
                        side="bottom"
                        className="h-auto rounded-t-2xl"
                    >
                        <SheetHeader>
                            <SheetTitle className="text-left">Map Controls</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-3">
                            {/* Search */}
                            <button
                                onClick={() => handleActionClick(onSearchClick)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 text-gray-900 border-gray-200 transition-all"
                            >
                                <Search className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Search</div>
                                    <div className="text-xs text-gray-600">
                                        Find locations on the map
                                    </div>
                                </div>
                            </button>

                            {/* GPS Toggle */}
                            <button
                                onClick={() => handleActionClick(onGpsToggle)}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${userLocation
                                    ? 'bg-[#4285F4] hover:bg-[#3367D6] text-white border-transparent'
                                    : 'bg-slate-800 hover:bg-slate-900 text-white border-transparent'
                                    }`}
                            >
                                <Navigation
                                    className={`w-5 h-5 flex-shrink-0 ${userLocation ? 'fill-current' : ''}`}
                                />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">GPS Location</div>
                                    <div className="text-xs opacity-90">
                                        {userLocation ? 'Currently shown on map' : 'Show your location'}
                                    </div>
                                </div>
                                <div className="text-sm font-medium">
                                    {userLocation ? 'On' : 'Off'}
                                </div>
                            </button>

                            {/* My Locations */}
                            <button
                                onClick={() => handleActionClick(onMyLocationsClick)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 text-gray-900 border-gray-200 transition-all"
                            >
                                <MapPinIcon className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">My Locations</div>
                                    <div className="text-xs text-gray-600">
                                        View your saved places
                                    </div>
                                </div>
                                <div className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                                    {savedLocationsCount}
                                </div>
                            </button>

                            {/* View All */}
                            <button
                                onClick={() => handleActionClick(onViewAllClick)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 text-gray-900 border-gray-200 transition-all"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="flex-shrink-0"
                                >
                                    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
                                    <path d="M15 5.764v15" />
                                    <path d="M9 3.236v15" />
                                </svg>
                                <div className="flex-1 text-left">
                                    <div className="font-medium">View All</div>
                                    <div className="text-xs text-gray-600">
                                        Fit all locations in view
                                    </div>
                                </div>
                            </button>

                            {/* Photo Upload */}
                            <a
                                href="/create-with-photo"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-green-600 hover:bg-green-700 text-white border-green-700 transition-all"
                            >
                                <Camera className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Create from Photo</div>
                                    <div className="text-xs opacity-90">
                                        Upload photo with GPS data
                                    </div>
                                </div>
                            </a>

                            {/* Friends */}
                            <button
                                onClick={() => handleActionClick(onFriendsClick)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-gray-50 text-gray-900 border-gray-200 transition-all"
                            >
                                <Users className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Friends</div>
                                    <div className="text-xs text-gray-600">
                                        View friends&apos; locations
                                    </div>
                                </div>
                            </button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}

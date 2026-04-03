'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    MapPinIcon, 
    Navigation, 
    Users, 
    Map, 
    Search, 
    Plus,
    Globe,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface MapControlsProps {
    userLocation: { lat: number; lng: number } | null;
    onGpsToggle: () => Promise<void>;
    onFriendsClick: () => void;
    onViewAllClick: () => void;
    onMyLocationsClick: () => void;
    onSearchClick: () => void;
    onPublicToggle: (showPublic: boolean) => void;
    showPublicLocations: boolean;
    searchOpen?: boolean; // Optional now
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
    onPublicToggle,
    showPublicLocations,
    hideMobileButton = false,
    savedLocationsCount,
}: MapControlsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltips, setShowTooltips] = useState(true);

    const handleActionClick = async (action: () => void | Promise<void>) => {
        setIsOpen(false);
        await action();
    };

    return (
        <>
            {/* Desktop View - Vertical buttons stacked on left side */}
            <div className="hidden md:flex absolute left-4 top-20 flex-col gap-2 z-10">
                <TooltipProvider delayDuration={300}>
                    {/* Search Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                data-tour="search-button"
                                onClick={onSearchClick}
                                className="bg-white hover:bg-muted text-foreground shadow-lg border border-border h-12 w-12 p-0"
                            >
                                <Search className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>Google Maps Search</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* GPS Toggle Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                data-tour="gps-toggle"
                                onClick={onGpsToggle}
                                className={`shadow-lg border border-border transition-colors h-12 w-12 p-0 ${userLocation
                                    ? 'bg-[#4285F4] hover:bg-[#3367D6] text-white border-transparent'
                                    : 'bg-muted-foreground hover:bg-foreground text-white border-transparent'
                                    }`}
                            >
                                <Navigation className={`w-5 h-5 ${userLocation ? 'fill-current' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>{userLocation ? 'Location Off' : 'Location On'}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* Friends Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                data-tour="friends-button"
                                onClick={onFriendsClick}
                                className="bg-white hover:bg-muted text-foreground shadow-lg border border-border h-12 w-12 p-0"
                            >
                                <Users className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>Friends&apos; Locations</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* View All Locations Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                data-tour="view-all-button"
                                onClick={onViewAllClick}
                                className="bg-white hover:bg-muted text-foreground shadow-lg border border-border h-12 w-12 p-0"
                            >
                                <Globe className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>Global View of Your Locations</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* Toggle Public Locations Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                data-tour="public-toggle"
                                onClick={() => onPublicToggle(!showPublicLocations)}
                                className={`shadow-lg border transition-colors h-12 w-12 p-0 ${showPublicLocations
                                    ? 'bg-social hover:bg-social/90 text-white border-social'
                                    : 'bg-white hover:bg-muted text-foreground border-border'
                                    }`}
                            >
                                <Map className={`w-5 h-5 ${showPublicLocations ? 'fill-current' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>{showPublicLocations ? 'Hide Public Locations' : 'View Public Locations'}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* My Locations List Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                data-tour="my-locations-button"
                                onClick={onMyLocationsClick}
                                className="bg-white hover:bg-muted text-foreground shadow-lg border border-border relative h-12 w-12 p-0"
                            >
                                <MapPinIcon className="w-5 h-5" />
                                {savedLocationsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {savedLocationsCount > 9 ? '9+' : savedLocationsCount}
                                    </span>
                                )}
                            </Button>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>Saved Locations ({savedLocationsCount})</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* Photo Upload Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                data-tour="create-with-photo"
                                href="/create-with-photo"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 w-12 bg-success hover:bg-success/90 text-white shadow-lg border border-success"
                            >
                                <Plus className="w-5 h-5" />
                            </Link>
                        </TooltipTrigger>
                        {showTooltips && (
                            <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                                <p>Snap & Save Location</p>
                            </TooltipContent>
                        )}
                    </Tooltip>

                    {/* Tooltip Toggle Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => setShowTooltips(!showTooltips)}
                                className={`shadow-lg border transition-colors h-7 w-7 p-0 mt-2 rounded-full ${
                                    showTooltips
                                        ? 'bg-primary hover:bg-primary/90 text-white border-primary'
                                        : 'bg-muted hover:bg-accent text-foreground border-border'
                                }`}
                                title={showTooltips ? 'Disable tooltips' : 'Enable tooltips'}
                            >
                                <Info className="w-3.5 h-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-foreground text-background border-border px-3 py-2 text-sm font-medium shadow-xl">
                            <p>{showTooltips ? 'Disable tooltips' : 'Enable tooltips'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Mobile View - Sheet menu only (no floating buttons for cleaner UI) */}
            <div className="md:hidden">
                {/* Floating Map Controls Button - Position above hamburger menu, hide when sidebar open */}
                {!hideMobileButton && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed right-6 z-90 h-14 w-14 rounded-full shadow-2xl bg-linear-to-r from-primary to-social hover:from-primary/90 hover:to-social text-white flex items-center justify-center transition-all active:scale-95"
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
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-muted text-foreground border-border transition-all"
                            >
                                <Search className="w-5 h-5 shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Search</div>
                                    <div className="text-xs text-muted-foreground">
                                        Find locations on the map
                                    </div>
                                </div>
                            </button>

                            {/* GPS Toggle */}
                            <button
                                onClick={() => handleActionClick(onGpsToggle)}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${userLocation
                                    ? 'bg-[#4285F4] hover:bg-[#3367D6] text-white border-transparent'
                                    : 'bg-muted-foreground hover:bg-foreground text-white border-transparent'
                                    }`}
                            >
                                <Navigation
                                    className={`w-5 h-5 shrink-0 ${userLocation ? 'fill-current' : ''}`}
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
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-muted text-foreground border-border transition-all"
                            >
                                <MapPinIcon className="w-5 h-5 shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">My Locations</div>
                                    <div className="text-xs text-muted-foreground">
                                        View your saved places
                                    </div>
                                </div>
                                <div className="text-sm font-medium bg-muted px-2 py-1 rounded">
                                    {savedLocationsCount}
                                </div>
                            </button>

                            {/* View All */}
                            <button
                                onClick={() => handleActionClick(onViewAllClick)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-muted text-foreground border-border transition-all"
                            >
                                <Globe className="w-5 h-5 shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">View All</div>
                                    <div className="text-xs text-muted-foreground">
                                        Fit all locations in view
                                    </div>
                                </div>
                            </button>

                            {/* Explore Public Locations Toggle */}
                            <button
                                onClick={() => {
                                    handleActionClick(() => onPublicToggle(!showPublicLocations));
                                }}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all ${showPublicLocations
                                    ? 'bg-social hover:bg-social/90 text-white border-social'
                                    : 'bg-white hover:bg-muted text-foreground border-border'
                                    }`}
                            >
                                <Map className={`w-5 h-5 shrink-0 ${showPublicLocations ? 'fill-current' : ''}`} />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Explore Public</div>
                                    <div className={`text-xs ${showPublicLocations ? 'opacity-90' : 'text-muted-foreground'}`}>
                                        {showPublicLocations ? 'Showing locations from all users' : 'Discover public locations'}
                                    </div>
                                </div>
                                <div className="text-sm font-medium">
                                    {showPublicLocations ? 'On' : 'Off'}
                                </div>
                            </button>

                            {/* Photo Upload */}
                            <Link
                                href="/create-with-photo"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-success hover:bg-success/90 text-white border-success transition-all"
                            >
                                <Plus className="w-5 h-5 shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Create from Photo</div>
                                    <div className="text-xs opacity-90">
                                        Upload photo with GPS data
                                    </div>
                                </div>
                            </Link>

                            {/* Friends */}
                            <button
                                onClick={() => handleActionClick(onFriendsClick)}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border bg-white hover:bg-muted text-foreground border-border transition-all"
                            >
                                <Users className="w-5 h-5 shrink-0" />
                                <div className="flex-1 text-left">
                                    <div className="font-medium">Friends</div>
                                    <div className="text-xs text-muted-foreground">
                                        Friends&apos; Locations
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

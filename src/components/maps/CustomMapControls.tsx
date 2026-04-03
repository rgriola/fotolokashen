'use client';

import { Map, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CustomMapControlsProps {
    map: google.maps.Map | null;
    rightPanelOpen: boolean;
}

export function CustomMapControls({ map, rightPanelOpen }: CustomMapControlsProps) {
    const handleZoomIn = () => {
        if (map) {
            const currentZoom = map.getZoom() || 12;
            const mapTypeId = map.getMapTypeId();
            
            // Satellite/Hybrid views have a lower max zoom
            const satelliteMaxZoom = 19;
            const roadmapMaxZoom = 22;
            
            // Determine max zoom based on current map type
            // Check both string literals and MapTypeId constants
            const isSatelliteView = mapTypeId === 'satellite' || 
                                   mapTypeId === google.maps.MapTypeId.SATELLITE ||
                                   mapTypeId === 'hybrid' ||
                                   mapTypeId === google.maps.MapTypeId.HYBRID;
            
            const maxZoom = isSatelliteView ? satelliteMaxZoom : roadmapMaxZoom;
            
            // Only zoom in if we haven't reached the max
            if (currentZoom < maxZoom) {
                map.setZoom(currentZoom + 1);
            }
        }
    };

    const handleZoomOut = () => {
        if (map) {
            const currentZoom = map.getZoom() || 12;
            map.setZoom(currentZoom - 1);
        }
    };

    const handleMapTypeChange = (mapTypeId: string) => {
        if (map) {
            const currentZoom = map.getZoom() || 12;
            map.setMapTypeId(mapTypeId);
            
            // Satellite view has a lower max zoom (typically ~19-20) compared to roadmap (~21-22)
            // If switching to satellite and current zoom is too high, reduce it
            const isSatelliteView = mapTypeId === 'satellite' || 
                                   mapTypeId === google.maps.MapTypeId.SATELLITE ||
                                   mapTypeId === 'hybrid' ||
                                   mapTypeId === google.maps.MapTypeId.HYBRID;
            
            if (isSatelliteView) {
                const satelliteMaxZoom = 19; // Safe max for satellite imagery
                if (currentZoom > satelliteMaxZoom) {
                    map.setZoom(satelliteMaxZoom);
                }
            }
        }
    };

    return (
        <div
            className={`
                fixed top-20 z-10
                flex items-center gap-2
                transition-all duration-300 ease-in-out
                ${rightPanelOpen ? 'right-[calc(50%+1rem)]' : 'right-4'}
            `}
        >
            {/* Map Type Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 bg-white hover:bg-muted shadow-lg border border-border"
                        title="Change map type"
                    >
                        <Map className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleMapTypeChange('roadmap')}>
                        Roadmap
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMapTypeChange('satellite')}>
                        Satellite
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMapTypeChange('hybrid')}>
                        Hybrid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMapTypeChange('terrain')}>
                        Terrain
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Zoom Controls */}
            <div className="flex flex-col gap-0 bg-white rounded-md shadow-lg border border-border overflow-hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    className="h-10 w-10 rounded-none hover:bg-muted border-b border-border"
                    title="Zoom in"
                >
                    <Plus className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    className="h-10 w-10 rounded-none hover:bg-muted"
                    title="Zoom out"
                >
                    <Minus className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}

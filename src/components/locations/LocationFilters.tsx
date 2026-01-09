"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface LocationFiltersProps {
    onSearchChange: (search: string) => void;
}

export function LocationFilters({
    onSearchChange,
}: LocationFiltersProps) {
    const [search, setSearch] = useState("");

    const handleSearchChange = (value: string) => {
        setSearch(value);
        onSearchChange(value);
    };

    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
                type="text"
                placeholder="Search by name, address, city, state, or tags..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
            />
        </div>
    );
}

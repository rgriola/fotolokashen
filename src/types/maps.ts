export interface MapConfig {
    center: google.maps.LatLngLiteral
    zoom: number
}

export interface MarkerData {
    position: google.maps.LatLngLiteral
    placeId: string
    name: string
    address?: string
}

export interface PlaceResult {
    place_id: string
    name: string
    formatted_address?: string
    geometry?: {
        location: google.maps.LatLng
    }
    types?: string[]
    rating?: number
    website?: string
    photos?: google.maps.places.PlacePhoto[]
}

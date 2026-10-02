/**
 * Parse Google Places/Geocoding address components
 * @param addressComponents - Google Places address components array
 * @returns Parsed address components object
 */
export interface AddressComponents {
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export function parseAddressComponents(
  addressComponents: google.maps.GeocoderAddressComponent[] | undefined,
): AddressComponents {
  if (!addressComponents) return {};

  const components: AddressComponents = {};

  for (const component of addressComponents) {
    const types = component.types;

    if (types.includes("street_number")) {
      components.number = component.long_name;
    } else if (types.includes("route")) {
      components.street = component.long_name;
    } else if (types.includes("locality")) {
      components.city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      components.state = component.short_name; // Use short_name for state abbreviation (e.g., "NY")
    } else if (types.includes("postal_code")) {
      components.zipcode = component.long_name;
    }
  }

  return components;
}

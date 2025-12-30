// Raw GTFS data for Nairobi Matatu routes
// Functions to fetch data from external GTFS files

// Fetch stops data from 2019Stops.txt
export async function fetchStopsData(): Promise<string> {
  try {
    const response = await fetch('/2019Stops.txt');
    if (!response.ok) {
      throw new Error(`Failed to fetch stops data: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching stops data:', error);
    // Fallback to empty CSV with headers
    return 'stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station';
  }
}

// Fetch routes data from 2019Routes.txt
export async function fetchRoutesData(): Promise<string> {
  try {
    const response = await fetch('/2019Routes.txt');
    if (!response.ok) {
      throw new Error(`Failed to fetch routes data: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching routes data:', error);
    // Fallback to empty CSV with headers
    return 'route_id,agency_id,route_short_name,route_long_name,route_type';
  }
}

// Legacy exports for backward compatibility (deprecated)
export const STOPS_DATA = '';
export const ROUTES_DATA = '';

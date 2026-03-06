import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get("brand");
  const lat   = searchParams.get("lat");
  const lng   = searchParams.get("lng");

  if (!brand || !lat || !lng) {
    return NextResponse.json({ error: "brand, lat and lng are required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
  }

  const keyword = `${brand} service center`;
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "5000");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("key", apiKey);

  try {
    const res  = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data.status, data.error_message);
      return NextResponse.json({ error: "Places API error", status: data.status }, { status: 502 });
    }

    const results = (data.results ?? []).slice(0, 6).map((place: {
      name: string;
      vicinity: string;
      rating?: number;
      geometry: { location: { lat: number; lng: number } };
      place_id: string;
      formatted_phone_number?: string;
    }) => ({
      name:    place.name,
      address: place.vicinity,
      rating:  place.rating ?? null,
      lat:     place.geometry.location.lat,
      lng:     place.geometry.location.lng,
      placeId: place.place_id,
      phone:   place.formatted_phone_number ?? null,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error("Service centers fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch service centers" }, { status: 500 });
  }
}
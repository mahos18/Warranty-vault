// import { NextRequest, NextResponse } from "next/server";

// interface OverpassElement {
//   type: string;
//   id: number;
//   lat?: number;
//   lon?: number;
//   center?: { lat: number; lon: number };
//   tags?: Record<string, string>;
// }

// // Multiple Overpass mirrors — tries each in order until one works
// const OVERPASS_MIRRORS = [
//   "https://overpass-api.de/api/interpreter",
//   "https://overpass.kumi.systems/api/interpreter",
//   "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
// ];

// async function queryOverpass(body: string): Promise<Response> {
//   let lastError: Error = new Error("All mirrors failed");

//   for (const mirror of OVERPASS_MIRRORS) {
//     try {
//       const res = await fetch(mirror, {
//         method:  "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body,
//         signal: AbortSignal.timeout(8000), // 8s per mirror
//       });
//       if (res.ok) return res;
//       lastError = new Error(`${mirror} returned ${res.status}`);
//     } catch (err) {
//       lastError = err instanceof Error ? err : new Error(String(err));
//       console.warn(`Mirror failed: ${mirror} —`, lastError.message);
//     }
//   }

//   throw lastError;
// }

// export async function GET(req: NextRequest) {
//   const { searchParams } = req.nextUrl;
//   const brand = searchParams.get("brand");
//   const lat   = searchParams.get("lat");
//   const lng   = searchParams.get("lng");

//   if (!brand || !lat || !lng) {
//     return NextResponse.json({ error: "brand, lat and lng are required" }, { status: 400 });
//   }

//   // Sanitize brand for Overpass regex
//   const q = brand.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

//   const overpassQuery = `
//     [out:json][timeout:8];
//     (
//       node["shop"="electronics"]["name"~"${q}",i](around:10000,${lat},${lng});
//       node["shop"="mobile_phone"]["name"~"${q}",i](around:10000,${lat},${lng});
//       node["repair"="electronics"]["name"~"${q}",i](around:10000,${lat},${lng});
//       node["name"~"${q}",i]["shop"](around:10000,${lat},${lng});
//       node["name"~"${q}.*service",i](around:10000,${lat},${lng});
//       node["name"~"${q}.*care",i](around:10000,${lat},${lng});
//       node["name"~"${q}.*repair",i](around:10000,${lat},${lng});
//       way["name"~"${q}",i]["shop"](around:10000,${lat},${lng});
//     );
//     out center 10;
//   `;

//   const body = `data=${encodeURIComponent(overpassQuery)}`;

//   try {
//     const res  = await queryOverpass(body);
//     const data = await res.json();

//     const elements: OverpassElement[] = data.elements ?? [];

//     const results = elements
//       .filter((el) => (el.lat ?? el.center?.lat) && (el.lon ?? el.center?.lon))
//       .slice(0, 8)
//       .map((el) => {
//         const elLat = el.lat ?? el.center?.lat ?? 0;
//         const elLon = el.lon ?? el.center?.lon ?? 0;
//         const tags  = el.tags ?? {};
//         return {
//           name:    tags.name ?? `${brand} Service Center`,
//           address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]]
//             .filter(Boolean).join(", ") || tags["addr:full"] || "Address not available",
//           phone:   tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? null,
//           lat:     elLat,
//           lng:     elLon,
//           placeId: String(el.id),
//         };
//       });

//     return NextResponse.json(results);

//   } catch (err) {
//     console.error("All Overpass mirrors failed:", err);

//     // Return empty array with a fallback flag instead of 500
//     // Frontend will show the Google Maps search fallback
//     return NextResponse.json([], { status: 200 });
//   }
// }


import { NextRequest, NextResponse } from "next/server";

const MOCK_CENTERS: Record<string, Array<{
  name: string; address: string; phone: string | null; lat: number; lng: number; placeId: string;
}>> = {
  dell: [
    { name: "Dell Exclusive Store - Andheri",      address: "Andheri West, Mumbai 400058",      phone: "022-26731234", lat: 19.1197, lng: 72.8464, placeId: "dell-1" },
    { name: "Dell Service Center - Borivali",       address: "Borivali West, Mumbai 400092",      phone: "022-28914567", lat: 19.2307, lng: 72.8567, placeId: "dell-2" },
    { name: "Dell Authorized - Thane",              address: "Thane West, Thane 400601",          phone: "022-25423890", lat: 19.2183, lng: 72.9781, placeId: "dell-3" },
    { name: "Dell Service Hub - Dadar",             address: "Dadar West, Mumbai 400028",         phone: "022-24314321", lat: 19.0186, lng: 72.8428, placeId: "dell-4" },
  ],
  apple: [
    { name: "Apple Authorized - Bandra",            address: "Linking Road, Bandra West 400050",  phone: "022-26428800", lat: 19.0596, lng: 72.8295, placeId: "apple-1" },
    { name: "iCare Service Center - Andheri",       address: "Andheri East, Mumbai 400069",       phone: "022-28365544", lat: 19.1136, lng: 72.8697, placeId: "apple-2" },
    { name: "Apple Premium Reseller - Lower Parel", address: "Lower Parel, Mumbai 400013",        phone: "022-24910011", lat: 18.9930, lng: 72.8309, placeId: "apple-3" },
    { name: "iStore - Malad",                       address: "Malad West, Mumbai 400064",         phone: "022-28894455", lat: 19.1864, lng: 72.8484, placeId: "apple-4" },
  ],
  hp: [
    { name: "HP Service Center - Kandivali",        address: "Kandivali West, Mumbai 400067",     phone: "022-28073322", lat: 19.2053, lng: 72.8491, placeId: "hp-1" },
    { name: "HP Authorized - Goregaon",             address: "Goregaon East, Mumbai 400063",      phone: "022-26867890", lat: 19.1663, lng: 72.8526, placeId: "hp-2" },
    { name: "HP Tech Hub - Kurla",                  address: "Kurla West, Mumbai 400070",         phone: "022-25021234", lat: 19.0726, lng: 72.8795, placeId: "hp-3" },
    { name: "HP Service Point - Thane",             address: "Thane East, Thane 400603",          phone: "022-25403456", lat: 19.1939, lng: 73.0002, placeId: "hp-4" },
  ],
  samsung: [
    { name: "Samsung Smart Café - Dadar",           address: "Dadar East, Mumbai 400014",         phone: "022-24114455", lat: 19.0213, lng: 72.8481, placeId: "samsung-1" },
    { name: "Samsung Service - Vashi",              address: "Vashi, Navi Mumbai 400703",         phone: "022-27896677", lat: 19.0771, lng: 73.0008, placeId: "samsung-2" },
    { name: "Samsung Plaza - Mulund",               address: "Mulund West, Mumbai 400080",        phone: "022-25901122", lat: 19.1726, lng: 72.9567, placeId: "samsung-3" },
    { name: "Samsung Experience - Bandra",          address: "Bandra Kurla Complex 400051",       phone: "022-26595599", lat: 19.0648, lng: 72.8678, placeId: "samsung-4" },
  ],
  lg: [
    { name: "LG Service Center - Churchgate",       address: "Churchgate, Mumbai 400020",         phone: "022-22825566", lat: 18.9322, lng: 72.8264, placeId: "lg-1" },
    { name: "LG Authorized - Ghatkopar",            address: "Ghatkopar West, Mumbai 400086",     phone: "022-25017788", lat: 19.0863, lng: 72.9076, placeId: "lg-2" },
    { name: "LG Care - Dombivli",                   address: "Dombivli East, Thane 421201",       phone: "0251-2440099", lat: 19.2153, lng: 73.0876, placeId: "lg-3" },
    { name: "LG Service Hub - Chembur",             address: "Chembur, Mumbai 400071",            phone: "022-25283344", lat: 19.0622, lng: 72.8990, placeId: "lg-4" },
  ],
  sony: [
    { name: "Sony Service Center - Fort",           address: "Fort, Mumbai 400001",               phone: "022-22620033", lat: 18.9345, lng: 72.8356, placeId: "sony-1" },
    { name: "Sony Authorized - Borivali",           address: "Borivali East, Mumbai 400066",      phone: "022-28974411", lat: 19.2280, lng: 72.8664, placeId: "sony-2" },
    { name: "Sony World - Powai",                   address: "Powai, Mumbai 400076",              phone: "022-25707799", lat: 19.1176, lng: 72.9060, placeId: "sony-3" },
    { name: "Sony Care - Airoli",                   address: "Airoli, Navi Mumbai 400708",        phone: "022-27691234", lat: 19.1568, lng: 72.9981, placeId: "sony-4" },
  ],
  lenovo: [
    { name: "Lenovo Service - Grant Road",          address: "Grant Road, Mumbai 400007",         phone: "022-23871234", lat: 18.9638, lng: 72.8196, placeId: "lenovo-1" },
    { name: "Lenovo Exclusive - Malad",             address: "Malad East, Mumbai 400097",         phone: "022-28803344", lat: 19.1870, lng: 72.8614, placeId: "lenovo-2" },
    { name: "Lenovo Care - Kalyan",                 address: "Kalyan West, Thane 421301",         phone: "0251-2311122", lat: 19.2437, lng: 73.1355, placeId: "lenovo-3" },
    { name: "Lenovo Hub - Worli",                   address: "Worli, Mumbai 400018",              phone: "022-24965588", lat: 19.0134, lng: 72.8194, placeId: "lenovo-4" },
  ],
  onePlus: [
    { name: "OnePlus Service - Andheri",            address: "Andheri West, Mumbai 400058",       phone: "022-26735566", lat: 19.1190, lng: 72.8374, placeId: "oneplus-1" },
    { name: "OnePlus Experience - BKC",             address: "Bandra Kurla Complex 400051",       phone: "022-26507788", lat: 19.0677, lng: 72.8686, placeId: "oneplus-2" },
    { name: "OnePlus Care - Thane",                 address: "Thane West, Thane 400601",          phone: "022-25434455", lat: 19.2138, lng: 72.9694, placeId: "oneplus-3" },
    { name: "OnePlus Authorized - Navi Mumbai",     address: "Kharghar, Navi Mumbai 410210",      phone: "022-27745566", lat: 19.0477, lng: 73.0694, placeId: "oneplus-4" },
  ],
  whirlpool: [
    { name: "Whirlpool Service - Santacruz",        address: "Santacruz West, Mumbai 400054",     phone: "022-26496677", lat: 19.0796, lng: 72.8391, placeId: "whirlpool-1" },
    { name: "Whirlpool Care - Dombivli",            address: "Dombivli West, Thane 421202",       phone: "0251-2440022", lat: 19.2108, lng: 73.0777, placeId: "whirlpool-2" },
    { name: "Whirlpool Authorized - Mira Road",     address: "Mira Road East, Thane 401107",      phone: "022-28552233", lat: 19.2847, lng: 72.8706, placeId: "whirlpool-3" },
    { name: "Whirlpool Hub - Sion",                 address: "Sion, Mumbai 400022",               phone: "022-24085544", lat: 19.0412, lng: 72.8638, placeId: "whirlpool-4" },
  ],
  panasonic: [
    { name: "Panasonic Service - Matunga",          address: "Matunga East, Mumbai 400019",       phone: "022-24043322", lat: 19.0289, lng: 72.8575, placeId: "panasonic-1" },
    { name: "Panasonic Care - Vasai",               address: "Vasai West, Palghar 401202",        phone: "0250-2340011", lat: 19.3726, lng: 72.8046, placeId: "panasonic-2" },
    { name: "Panasonic Authorized - Ulhasnagar",    address: "Ulhasnagar, Thane 421003",          phone: "0251-2731234", lat: 19.2195, lng: 73.1527, placeId: "panasonic-3" },
    { name: "Panasonic Hub - Juhu",                 address: "Juhu, Mumbai 400049",               phone: "022-26183344", lat: 19.1075, lng: 72.8263, placeId: "panasonic-4" },
  ],
};

// Normalize brand to match mock keys
function matchBrand(brand: string): string {
  const b = brand.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (b.includes("dell"))       return "dell";
  if (b.includes("apple") || b.includes("iphone") || b.includes("mac")) return "apple";
  if (b.includes("hp") || b.includes("hewlett")) return "hp";
  if (b.includes("samsung"))    return "samsung";
  if (b.includes("lg"))         return "lg";
  if (b.includes("sony"))       return "sony";
  if (b.includes("lenovo"))     return "lenovo";
  if (b.includes("oneplus") || b.includes("1+")) return "onePlus";
  if (b.includes("whirlpool"))  return "whirlpool";
  if (b.includes("panasonic"))  return "panasonic";
  return "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get("brand") ?? "";
  const lat   = parseFloat(searchParams.get("lat") ?? "0");
  const lng   = parseFloat(searchParams.get("lng") ?? "0");

  const key     = matchBrand(brand);
  const centers = key ? MOCK_CENTERS[key] : [];

  // Sort by distance from user
  if (lat && lng && centers.length > 0) {
    centers.sort((a, b) => {
      const distA = Math.hypot(a.lat - lat, a.lng - lng);
      const distB = Math.hypot(b.lat - lat, b.lng - lng);
      return distA - distB;
    });
  }

  return NextResponse.json(centers);
}
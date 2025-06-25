import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const WAREHOUSE = 'L3R 8N4, Ontario, Canada';

// Generate combinations of array elements
function* combinations(arr: any[], r: number): Generator<any[]> {
  const n = arr.length;
  if (r > n) return;
  const indices = Array.from({ length: r }, (_, i) => i);
  yield indices.map(i => arr[i]);
  while (true) {
    let i=r-1;
    while (i>=0 && indices[i]===i+n-r) i--;
    if (i<0) break;
    indices[i]++;
    for (let j=i+1; j<r; j++) indices[j]=indices[j-1]+1;
    yield indices.map(k=>arr[k]);
  }
}

export async function POST(request: Request) {
  const { deliveries, maxDistance, maxSkids, topN } = await request.json();
  const addresses = deliveries.map((d: any) => encodeURIComponent(d.address));
  const matrixUrl =
    `https://maps.googleapis.com/maps/api/distancematrix/json` +
    `?origins=${encodeURIComponent(WAREHOUSE)}` +
    `&destinations=${addresses.join('|')}` +
    `&key=${API_KEY}`;
  const matrixResp = await axios.get(matrixUrl);
  const elements = matrixResp.data.rows[0].elements;

    // Filter deliveries with valid matrix elements and within distance
  const valid = deliveries.filter((d: any, i: number) => {
    const el = elements?.[i];
    if (!el || el.status !== 'OK') return false;
    return el.distance.value / 1000 <= maxDistance;
  });

  const suggestions: any[] = [];
  for (let r = 1; r <= valid.length; r++) {
    for (const combo of combinations(valid, r)) {
      const skidSum = combo.reduce((sum: number, c: any) => sum + c.skids, 0);
      if (skidSum > maxSkids) continue;
      const stops = combo.map((c: any) => encodeURIComponent(c.address));
      const waypoints = 'optimize:true|' + stops.join('|');
      const dirUrl =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${encodeURIComponent(WAREHOUSE)}` +
        `&destination=${encodeURIComponent(WAREHOUSE)}` +
        `&waypoints=${waypoints}` +
        `&key=${API_KEY}`;
      const dirResp = await axios.get(dirUrl);
      const route = dirResp.data.routes[0];
      const order = route.waypoint_order;
      const orderedCompanies = order.map((i: number) => combo[i].company);
      const totalDist = route.legs.reduce((sum: number, l: any) => sum + l.distance.value, 0) / 1000;
      const totalDur  = route.legs.reduce((sum: number, l: any) => sum + l.duration.value, 0) / 60;
      suggestions.push({
        Companies: combo.map((c: any) => c.company),
        Skids: skidSum,
        Order: orderedCompanies,
        Distance_km: Math.round(totalDist * 10) / 10,
        Duration_min: Math.round(totalDur * 10) / 10
      });
      await new Promise(res => setTimeout(res, 500));
    }
  }

  suggestions.sort((a, b) => b.Skids - a.Skids || a.Distance_km - b.Distance_km);
  return NextResponse.json(suggestions.slice(0, topN || 5));
}

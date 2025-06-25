"use client"
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Truck, MapPin, Clock, Package, Plus, X, Upload, Map as MapIcon } from 'lucide-react';

interface Delivery {
  id: string;
  company: string;
  address: string;
  skids: number;
  coordinates?: { lat: number; lng: number };
  assigned?: boolean;
  tripId?: string;
}

interface Trip {
  id: string;
  deliveries: Delivery[];
  totalSkids: number;
  estimatedHours: number;
  estimatedDistance: number;
  color: string;
  route?: { lat: number; lng: number }[];
  geocodedAddresses?: { [key: string]: { lat: number; lng: number } };
}

// Sample data for demo purposes
const sampleDeliveries: Delivery[] = [
  { id: '1', company: 'ABC Corp', address: '123 Main St, Toronto, ON', skids: 2 },
  { id: '2', company: 'XYZ Ltd', address: '456 Queen St, Mississauga, ON', skids: 3 },
  { id: '3', company: 'Tech Solutions', address: '789 King St, Brampton, ON', skids: 1 },
  { id: '4', company: 'Global Industries', address: '321 Bay St, Toronto, ON', skids: 4 },
  { id: '5', company: 'Local Market', address: '654 Dundas St, Hamilton, ON', skids: 2 },
];

const tripColors = ['#de3bf6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
const WAREHOUSE_ADDRESS = 'L3R 8N4, Ontario, Canada';
const formatTime = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`;
  }
  if (hours < 2) {
    const wholeHours = Math.floor(hours);
    const remainingMinutes = Math.round((hours - wholeHours) * 60);
    if (remainingMinutes === 0) {
      return `${wholeHours}h`;
    }
    return `${wholeHours}h ${remainingMinutes}min`;
  }
  return `${Math.round(hours * 10) / 10}h`;
};
// Google Maps component
function GoogleMapView({ trips, isVisible }: { trips: Trip[]; isVisible: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  useEffect(() => {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setHasApiKey(!!apiKey && apiKey !== 'YOUR_API_KEY');
  }, []);

  useEffect(() => {
    if (!isVisible || !mapRef.current || !hasApiKey) return;

    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!window.google || !mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 43.4643, lng: -79.7000 }, // Mississauga area
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

      const directionsServiceInstance = new google.maps.DirectionsService();
      
      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);

      // Add warehouse marker
      new google.maps.Marker({
        position: { lat: 43.83116465757199, lng: -79.34695182362475 },
        map: mapInstance,
        title: 'Warehouse - L3R 8N4, Ontario, Canada',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(40, 40),
        },
      });
    };

    loadGoogleMaps();
  }, [isVisible, hasApiKey]);

  useEffect(() => {
    if (!map || !directionsService || trips.length === 0) return;

    setIsLoadingRoutes(true);

    // Clear existing renderers
    directionsRenderers.forEach(renderer => renderer.setMap(null));
    setDirectionsRenderers([]);

    const newRenderers: google.maps.DirectionsRenderer[] = [];
    let completedTrips = 0;

    // Render each trip
    trips.forEach((trip, index) => {
      if (trip.deliveries.length === 0) {
        completedTrips++;
        if (completedTrips === trips.length) {
          setIsLoadingRoutes(false);
        }
        return;
      }

      const waypoints = trip.deliveries.map(delivery => ({
        location: delivery.address,
        stopover: true,
      }));

      const request: google.maps.DirectionsRequest = {
        origin: WAREHOUSE_ADDRESS,
        destination: WAREHOUSE_ADDRESS,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        completedTrips++;
        
        if (status === 'OK' && result) {
          const renderer = new google.maps.DirectionsRenderer({
            directions: result,
            map: map,
            polylineOptions: {
              strokeColor: trip.color,
              strokeWeight: 4,
              strokeOpacity: 0.8,
            },
            markerOptions: {
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="15" r="12" fill="${trip.color}" stroke="white" stroke-width="2"/>
                    <text x="15" y="20" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">
                      T${index + 1}
                    </text>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(30, 30),
              },
            },
            suppressMarkers: false,
          });

          newRenderers.push(renderer);
        } else {
          console.error(`Directions request failed for trip ${index + 1}:`, status);
        }

        // Check if all trips are processed
        if (completedTrips === trips.length) {
          setIsLoadingRoutes(false);
          setDirectionsRenderers(newRenderers);
        }
      });
    });

    // Handle case where no trips have deliveries
    if (trips.every(trip => trip.deliveries.length === 0)) {
      setIsLoadingRoutes(false);
    }
  }, [trips, map, directionsService]);

  if (!isVisible) return null;

  if (!hasApiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <MapIcon size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Google Maps API Key Required</h3>
          <p className="text-sm text-gray-500 mb-4">
            To see real routes on Google Maps, add your API key to environment variables:
          </p>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono text-left">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </div>
          <p className="text-xs text-gray-400 mt-4">
            The drag-and-drop planning still works without the map view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Loading indicator */}
      {isLoadingRoutes && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Loading routes on map...</span>
          </div>
        </div>
      )}
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="text-sm font-medium mb-2">Map Legend:</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Warehouse</span>
          </div>
          {trips.map((trip, index) => (
            <div key={trip.id} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: trip.color }}
              ></div>
              <span>Trip {index + 1} ({trip.deliveries.length} stops)</span>
            </div>
          ))}
        </div>
        
        {trips.length === 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Create some trips to see routes on the map
          </div>
        )}
      </div>
      
      {/* Trip details overlay */}
      {trips.length > 0 && !isLoadingRoutes && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-sm max-w-xs">
          <div className="text-sm font-medium mb-2">Route Summary:</div>
          <div className="space-y-1 text-xs">
            {trips.map((trip, index) => (
              <div key={trip.id} className="flex justify-between">
                <span style={{ color: trip.color }}>Trip {index + 1}:</span>
                <span>{trip.estimatedDistance}km, {formatTime(trip.estimatedHours)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileUploadArea({ onFileUpload, isCalculating }: { onFileUpload: (deliveries: Delivery[]) => void; isCalculating: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Dynamically import xlsx to avoid SSR issues
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          if (!bstr) return;
          
          const wb = XLSX.read(bstr, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          
          const parsed = rows.map((r: any, i: number) => ({
            id: `${r['Company'] || r['company'] || 'Company'}-${i}`,
            company: r['Company'] || r['company'] || r['CompanyName'] || `Company ${i + 1}`,
            address: r['Delivery Address'] || r['DeliveryAddress'] || r['address'] || r['Address'] || '',
            skids: Number(r['FinalSkids'] || r['Skids'] || r['skids'] || r['SKIDS'] || 1),
          })).filter(d => d.company && d.address); // Filter out invalid entries

          onFileUpload(parsed);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          alert('Error parsing Excel file. Please check the format.');
          setIsLoading(false);
        }
      };
      
      reader.readAsBinaryString(file as Blob);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <div className="text-center">
        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
        <div className="text-sm font-medium mb-1">
          {isLoading ? 'Processing file...' : 'Upload Excel File'}
        </div>
        <div className="text-xs text-gray-500 mb-3">
          Supports .xlsx and .xls files with Company, Address, and Skids columns
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isCalculating}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : isCalculating ? 'Calculating...' : 'Choose File'}
        </button>
        
        <div className="text-xs text-gray-400 mt-2">
          Expected columns: Company, Delivery Address (or Address), Skids (or FinalSkids)
        </div>
      </div>
    </div>
  );
}

function DraggableDelivery({ delivery }: { delivery: Delivery }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: delivery.id,
    data: delivery,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 mb-2 bg-white rounded-lg shadow-sm border cursor-move transition-all
        ${isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'}
        ${delivery.assigned ? 'opacity-50 bg-gray-100' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{delivery.company}</div>
          <div className="text-xs text-gray-500 truncate">{delivery.address}</div>
        </div>
        <div className="flex items-center space-x-1 text-xs bg-blue-100 px-2 py-1 rounded">
          <Package size={12} />
          <span>{delivery.skids}</span>
        </div>
      </div>
    </div>
  );
}

function TripDropZone({ trip, onAddToTrip }: { trip: Trip; onAddToTrip: (tripId: string, delivery: Delivery) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `trip-${trip.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`absolute bg-white rounded-lg p-2 shadow-sm border-2 transition-all
        ${isOver ? 'border-green-400 bg-green-50 shadow-lg' : 'border-gray-200'}`}
      style={{
        top: `${20 + parseInt(trip.id) * 15}%`,
        left: `${40 + parseInt(trip.id) * 10}%`,
        minWidth: '200px',
      }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: trip.color }}
        ></div>
        <span className="text-sm font-medium">Trip {trip.id}</span>
        {isOver && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            + Add Here
          </span>
        )}
      </div>
      
      <div className="text-xs space-y-1">
        {trip.deliveries.map((delivery, index) => (
          <div key={delivery.id} className="flex items-center space-x-1">
            <div 
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: trip.color }}
            >
              {index + 1}
            </div>
            <span className="truncate">{delivery.company}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t text-xs text-gray-600">
        {trip.totalSkids} skids • {trip.estimatedHours}h
      </div>
    </div>
  );
}

function MapDropZone({ onDrop, onAddToTrip, trips, isCalculating }: { 
  onDrop: (delivery: Delivery, position: { x: number; y: number }) => void; 
  onAddToTrip: (tripId: string, delivery: Delivery) => void;
  trips: Trip[];
  isCalculating: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'map-area',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`relative w-full h-full bg-gray-100 rounded-lg border-2 border-dashed transition-colors
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
    >
      {/* Simulated Map Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-green-200 to-blue-200"></div>
      </div>
      
      {/* Map Instructions */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="text-sm font-medium mb-1">Route Planning:</div>
        <div className="text-xs text-gray-600">
          • Drag deliveries here to create trips<br/>
          • Drop near existing routes to add to trip<br/>
          • Drop in empty area to create new trip<br/>
          • Times include driving + delivery stops
        </div>
      </div>

      {/* Warehouse Marker */}
      <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
            <Truck size={16} />
          </div>
          <div className="text-xs mt-1 bg-white px-2 py-1 rounded shadow">Warehouse</div>
        </div>
      </div>

      {/* Trip Routes with Drop Zones */}
      {trips.map((trip) => (
        <TripDropZone 
          key={trip.id} 
          trip={trip} 
          onAddToTrip={onAddToTrip}
        />
      ))}

      {/* Drop hint */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {isCalculating ? 'Calculating route...' : 'Drop here to add to route'}
          </div>
        </div>
      )}
      
      {/* Global calculating indicator */}
      {isCalculating && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg border">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Getting real-time route estimate...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onRemoveDelivery }: { trip: Trip; onRemoveDelivery: (tripId: string, deliveryId: string) => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: trip.color }}
          ></div>
          <span className="font-medium text-sm">Trip {trip.id}</span>
        </div>
        <div className="text-xs text-gray-500">
          {trip.estimatedHours}h • {trip.estimatedDistance}km
        </div>
      </div>
      
      <div className="space-y-1">
        {trip.deliveries.map((delivery) => (
          <div key={delivery.id} className="flex items-center justify-between text-xs">
            <div className="flex-1">
              <div className="font-medium">{delivery.company}</div>
              <div className="text-gray-500">{delivery.skids} skids</div>
            </div>
            <button
              onClick={() => onRemoveDelivery(trip.id, delivery.id)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t flex justify-between text-xs">
        <span>Total: {trip.totalSkids} skids</span>
        <span className="flex items-center space-x-1 text-blue-600">
          <Clock size={12} />
          <span>{formatTime(trip.estimatedHours)} driving</span>
        </span>
      </div>
    </div>
  );
}

export default function VisualRoutePlanner() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maxSkids, setMaxSkids] = useState(6);
  const [maxHours, setMaxHours] = useState(8);
  const [draggedItem, setDraggedItem] = useState<Delivery | null>(null);
  const [showSampleData, setShowSampleData] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const unassignedDeliveries = deliveries.filter(d => !d.assigned);

  // Function to get real route estimates from your Google Maps API
  const getRouteEstimate = async (deliveries: Delivery[]) => {
    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveries, 
          maxDistance: 100, // Set high to not filter by distance
          maxSkids: deliveries.reduce((sum, d) => sum + d.skids, 0), // Sum of all skids
          topN: 1 // Just get the best route
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const suggestions = await response.json();
      
      if (suggestions && suggestions.length > 0) {
        return {
          estimatedHours: suggestions[0].Duration_min / 60, // Convert minutes to hours
          estimatedDistance: suggestions[0].Distance_km,
          optimizedOrder: suggestions[0].Order
        };
      }
      
      // Fallback if API doesn't return data
      return getFallbackEstimate(deliveries);
    } catch (error) {
      console.error('Error getting route estimate:', error);
      return getFallbackEstimate(deliveries);
    }
  };

  // Fallback estimation when API fails
  const getFallbackEstimate = (deliveries: Delivery[]) => {
    const baseDrivingTime = 1.5;
    const deliveryTime = deliveries.length * 0.5;
    const travelTime = deliveries.length * 0.7;
    
    return {
      estimatedHours: Math.round((baseDrivingTime + deliveryTime + travelTime) * 10) / 10,
      estimatedDistance: 15 + deliveries.length * 12,
      optimizedOrder: deliveries.map(d => d.company)
    };
  };

  const handleFileUpload = (uploadedDeliveries: Delivery[]) => {
    setDeliveries(uploadedDeliveries);
    setTrips([]); // Reset trips when new file is uploaded
    setShowSampleData(false);
  };

  const loadSampleData = () => {
    setDeliveries(sampleDeliveries);
    setTrips([]);
    setShowSampleData(true);
  };

  const clearAllData = () => {
    setDeliveries([]);
    setTrips([]);
    setShowSampleData(false);
  };

  const handleDragStart = (event: any) => {
    const delivery = deliveries.find(d => d.id === event.active.id);
    setDraggedItem(delivery || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItem(null);
    
    if (!event.over || !event.active.data.current) return;
    
    const delivery = event.active.data.current as Delivery;
    
    if (event.over.id === 'map-area') {
      // Dropped on empty map area - create new trip
      const dropPosition = { x: 100, y: 100 };
      createNewTrip(delivery, dropPosition);
    } else if (event.over.id.toString().startsWith('trip-')) {
      // Dropped on existing trip - add to that trip
      const tripId = event.over.id.toString().replace('trip-', '');
      addToExistingTrip(tripId, delivery);
    }
  };

  const createNewTrip = async (delivery: Delivery, position: { x: number; y: number }) => {
    setIsCalculating(true);
    
    try {
      // Get real estimate from Google Maps API
      const estimate = await getRouteEstimate([delivery]);
      
      const newTrip: Trip = {
        id: String(trips.length + 1),
        deliveries: [delivery],
        totalSkids: delivery.skids,
        estimatedHours: estimate.estimatedHours,
        estimatedDistance: estimate.estimatedDistance,
        color: tripColors[trips.length % tripColors.length],
      };

      setTrips(prev => [...prev, newTrip]);
      setDeliveries(prev => 
        prev.map(d => 
          d.id === delivery.id 
            ? { ...d, assigned: true, tripId: newTrip.id }
            : d
        )
      );
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Error calculating route. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const addToExistingTrip = async (tripId: string, delivery: Delivery) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const newTotalSkids = trip.totalSkids + delivery.skids;
    
    // Quick skid check before API call
    if (newTotalSkids > maxSkids) {
      alert(`Cannot add delivery: Would exceed skid limit (${newTotalSkids}/${maxSkids})`);
      return;
    }

    setIsCalculating(true);
    
    try {
      // Get real estimate for the combined route
      const combinedDeliveries = [...trip.deliveries, delivery];
      const estimate = await getRouteEstimate(combinedDeliveries);
      
      // Check time constraint with real data
      if (estimate.estimatedHours > maxHours) {
        alert(`Cannot add delivery: Would exceed driving time limit (${formatTime(estimate.estimatedHours)}/${formatTime(maxHours)})`);
        setIsCalculating(false);
        return;
      }

      // Update trip with real estimates
      setTrips(prev => 
        prev.map(t => 
          t.id === tripId
            ? {
                ...t,
                deliveries: combinedDeliveries,
                totalSkids: newTotalSkids,
                estimatedHours: estimate.estimatedHours,
                estimatedDistance: estimate.estimatedDistance,
              }
            : t
        )
      );

      setDeliveries(prev => 
        prev.map(d => 
          d.id === delivery.id 
            ? { ...d, assigned: true, tripId: tripId }
            : d
        )
      );
    } catch (error) {
      console.error('Error adding to trip:', error);
      alert('Error calculating updated route. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const removeDeliveryFromTrip = async (tripId: string, deliveryId: string) => {
    const deliveryToRemove = deliveries.find(d => d.id === deliveryId);
    const trip = trips.find(t => t.id === tripId);
    if (!deliveryToRemove || !trip) return;

    const remainingDeliveries = trip.deliveries.filter(d => d.id !== deliveryId);
    
    // First remove the delivery from UI
    setDeliveries(prev =>
      prev.map(d =>
        d.id === deliveryId
          ? { ...d, assigned: false, tripId: undefined }
          : d
      )
    );

    if (remainingDeliveries.length === 0) {
      // Remove empty trip
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } else {
      // Recalculate route for remaining deliveries
      setIsCalculating(true);
      try {
        const estimate = await getRouteEstimate(remainingDeliveries);
        
        setTrips(prev => 
          prev.map(t => 
            t.id === tripId
              ? {
                  ...t,
                  deliveries: remainingDeliveries,
                  totalSkids: t.totalSkids - deliveryToRemove.skids,
                  estimatedHours: estimate.estimatedHours,
                  estimatedDistance: estimate.estimatedDistance,
                }
              : t
          )
        );
      } catch (error) {
        console.error('Error recalculating trip:', error);
      } finally {
        setIsCalculating(false);
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-gray-50">
        {/* Left Panel - Available Deliveries */}
        <div className="w-80 p-4 bg-white border-r overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Available Deliveries</h2>
            
            {/* File Upload Area */}
            <FileUploadArea onFileUpload={handleFileUpload} isCalculating={isCalculating} />
            
            {/* Sample Data Option */}
            {deliveries.length === 0 && (
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 mb-2">or</div>
                <button
                  onClick={loadSampleData}
                  className="text-blue-500 hover:text-blue-700 text-sm underline"
                >
                  Load Sample Data for Demo
                </button>
              </div>
            )}
            
            {/* Data Info and Controls */}
            {deliveries.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">
                    {showSampleData ? 'Sample Data: ' : 'Uploaded: '}
                    <span className="font-medium">{deliveries.length} deliveries</span>
                  </div>
                  <button
                    onClick={clearAllData}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  Drag deliveries to the map to create trips
                </div>
              </div>
            )}
            
            {/* Constraints */}
            {deliveries.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Max Skids/Trip</label>
                    <input
                      type="number"
                      value={maxSkids}
                      onChange={(e) => setMaxSkids(Number(e.target.value))}
                      className="w-full text-sm border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Max Driving Hours</label>
                    <input
                      type="number"
                      value={maxHours}
                      onChange={(e) => setMaxHours(Number(e.target.value))}
                      className="w-full text-sm border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deliveries List */}
          {deliveries.length > 0 ? (
            <div className="space-y-2">
              {unassignedDeliveries.map(delivery => (
                <DraggableDelivery key={delivery.id} delivery={delivery} />
              ))}
              
              {unassignedDeliveries.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All deliveries assigned to trips</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Upload size={48} className="mx-auto mb-2 opacity-50" />
              <p>Upload an Excel file to get started</p>
              <p className="text-sm">Or use sample data for demo</p>
            </div>
          )}
        </div>

        {/* Center - Map Area */}
        <div className="flex-1 p-4 relative">
          {/* Toggle Button */}
          {trips.length > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm text-sm ${
                  showMap 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-700 border'
                }`}
              >
                <MapIcon size={16} />
                <span>{showMap ? 'Hide Map' : 'Show Routes'}</span>
              </button>
            </div>
          )}

          {showMap ? (
            <GoogleMapView trips={trips} isVisible={showMap} />
          ) : (
            <MapDropZone 
              onDrop={createNewTrip} 
              onAddToTrip={addToExistingTrip}
              trips={trips}
              isCalculating={isCalculating}
            />
          )}
        </div>

        {/* Right Panel - Trip Summary */}
        <div className="w-80 p-4 bg-white border-l overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Trip Planner</h2>
          
          {trips.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MapPin size={48} className="mx-auto mb-2 opacity-50" />
              <p>No trips created yet</p>
              <p className="text-sm">Drag deliveries to the map to start</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map(trip => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  onRemoveDelivery={removeDeliveryFromTrip}
                />
              ))}
              
              {/* Summary */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Trip Summary</div>
                <div className="text-xs space-y-1">
                  <div>Total Trips: {trips.length}</div>
                  <div>Total Deliveries: {trips.reduce((sum, trip) => sum + trip.deliveries.length, 0)}</div>
                  <div>Total Skids: {trips.reduce((sum, trip) => sum + trip.totalSkids, 0)}</div>
                  <div>Est. Total Driving Time: {formatTime(trips.reduce((sum, trip) => sum + trip.estimatedHours, 0))}</div>
                  <div>Est. Total Distance: {Math.round(trips.reduce((sum, trip) => sum + trip.estimatedDistance, 0) * 10) / 10}km</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedItem ? (
          <div className="p-3 bg-white rounded-lg shadow-lg border opacity-90">
            <div className="font-medium text-sm">{draggedItem.company}</div>
            <div className="text-xs text-gray-500">{draggedItem.skids} skids</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
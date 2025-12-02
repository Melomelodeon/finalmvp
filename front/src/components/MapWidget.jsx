import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Map, X, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component to handle map clicks
function LocationMarker({ onLocationSelect, selectedLocation }) {
  const [position, setPosition] = useState(selectedLocation);

  const map = useMapEvents({
    click(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      onLocationSelect(newPos);
    },
  });

  useEffect(() => {
    setPosition(selectedLocation);
  }, [selectedLocation]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold mb-2">Selected Location</p>
          <p><strong>Latitude:</strong> {position.lat.toFixed(6)}</p>
          <p><strong>Longitude:</strong> {position.lng.toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [copiedCoord, setCopiedCoord] = useState(null);
  const [userLocation, setUserLocation] = useState([14.5995, 120.9842]); // Default to Manila, Philippines

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied, using default location');
        }
      );
    }
  }, []);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoord(type);
      toast.success(`${type} copied to clipboard!`);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedCoord(null);
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatCoordinate = (value, decimals = 6) => {
    return value ? value.toFixed(decimals) : '0.000000';
  };

  return (
    <>
      {/* Floating Map Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group"
          title="Open Interactive Map"
        >
          <Map size={24} className="group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>

      {/* Map Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Interactive Location Map</h3>
                <p className="text-sm text-gray-500">Click anywhere on the map to get coordinates</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <MapContainer
                center={userLocation}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full rounded-b-xl"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
              </MapContainer>

              {/* Coordinates Display Panel */}
              {selectedLocation && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[280px] z-[1000]">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Map size={16} />
                    Location Coordinates
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Latitude */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Latitude</p>
                        <p className="font-mono text-sm text-gray-800">
                          {formatCoordinate(selectedLocation.lat)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(formatCoordinate(selectedLocation.lat), 'Latitude')}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Copy latitude"
                      >
                        {copiedCoord === 'Latitude' ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>

                    {/* Longitude */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Longitude</p>
                        <p className="font-mono text-sm text-gray-800">
                          {formatCoordinate(selectedLocation.lng)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(formatCoordinate(selectedLocation.lng), 'Longitude')}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Copy longitude"
                      >
                        {copiedCoord === 'Longitude' ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>

                    {/* Both Coordinates */}
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={() => copyToClipboard(
                          `${formatCoordinate(selectedLocation.lat)}, ${formatCoordinate(selectedLocation.lng)}`,
                          'Coordinates'
                        )}
                        className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        {copiedCoord === 'Coordinates' ? (
                          <>
                            <CheckCircle size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copy Both
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
                <p className="text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Click anywhere on the map to select a location and get its coordinates
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
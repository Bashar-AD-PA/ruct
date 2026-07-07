import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
};

const LocationPickerMap = ({ onSelect, initialLat, initialLng, onClose }) => {
  const defaultCenter = [15.3694, 44.1910]; // Sana'a default
  const [position, setPosition] = useState(
    (initialLat && initialLng) ? { lat: initialLat, lng: initialLng } : null
  );

  const handleSelect = () => {
    if (position) {
      onSelect(position.lat, position.lng);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={position ? [position.lat, position.lng] : defaultCenter}
        zoom={position ? 15 : 6}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents onLocationSelect={setPosition} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
      
      {/* Overlay UI */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000,
        display: 'flex', gap: '10px', justifyContent: 'center', direction: 'rtl'
      }}>
        <div style={{
          background: 'white', padding: '10px 20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', flex: 1
        }}>
          <MapPin style={{ color: '#004ac6' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {position ? `الطول: ${position.lng.toFixed(5)}, العرض: ${position.lat.toFixed(5)}` : 'انقر على الخريطة لتحديد الموقع'}
          </span>
        </div>
        
        <button
          type="button"
          onClick={handleSelect}
          disabled={!position}
          style={{
            background: position ? '#004ac6' : '#c3c6d7', color: 'white',
            border: 'none', padding: '0 24px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 700, cursor: position ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          اعتماد الموقع
        </button>
        {onClose && (
            <button
            type="button"
            onClick={onClose}
            style={{
                background: '#fff', color: '#ba1a1a', border: '1px solid #ba1a1a',
                padding: '0 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            >
            إلغاء
            </button>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMap;

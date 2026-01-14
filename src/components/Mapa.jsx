import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, Autocomplete } from '@react-google-maps/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import MarcadorMicro from './MarcadorMicro';
import Simulador from './Simulador';

const containerStyle = { width: '100%', height: '100vh' };
const libraries = ['geometry', 'places']; // Añadimos 'places' para el buscador

const Mapa = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Usamos tu variable de Vercel
    libraries
  });

  const [parada, setParada] = useState({ lat: -34.9214, lng: -57.9545 });
  const [userPos, setUserPos] = useState(null);
  const [microData, setMicroData] = useState(null);
  const [tiempoParaParada, setTiempoParaParada] = useState(null);
  const [tiempoMicroAParada, setTiempoMicroAParada] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);

  // Cargar Autocomplete
  const onLoadAutocomplete = (auto) => setAutocomplete(auto);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const nuevaPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setParada(nuevaPos);
        mapRef.current.panTo(nuevaPos);
        mapRef.current.setZoom(17);
      }
    }
  };

  // Lógica de clics y Firebase (se mantiene igual que antes)
  const onMapClick = useCallback((e) => {
    setParada({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, []);

  useEffect(() => {
    if (navigator.geolocation && isLoaded) {
      navigator.geolocation.watchPosition((pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [isLoaded]);

  // Actualizar tiempos cada vez que la parada o el micro cambian
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "colectivos", "micro_1"), (docSnap) => {
      if (docSnap.exists()) {
        const pos = docSnap.data();
        setMicroData(pos);
        if (window.google) {
          const d = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(pos.lat, pos.lng),
            new window.google.maps.LatLng(parada)
          );
          setTiempoMicroAParada(Math.ceil(d / 500)); 
        }
      }
    });
    return () => unsub();
  }, [parada]);

  if (!isLoaded) return <div>Cargando Buscador...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <Simulador />
      
      {/* BUSCADOR FLOTANTE */}
      <div style={searchContainerStyle}>
        <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="¿A qué esquina vas? (Ej: Calle 7 y 50)"
            style={inputStyle}
          />
        </Autocomplete>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={parada}
        zoom={16}
        onLoad={map => mapRef.current = map}
        onClick={onMapClick}
        options={{ disableDefaultUI: true, styles: mapStyle }}
      >
        <Marker position={parada} icon={{ url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", scaledSize: new window.google.maps.Size(35, 35) }} />
        {userPos && <Marker position={userPos} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }} />}
        {microData && <MarcadorMicro externalPos={microData} />}
      </GoogleMap>

      <div style={cardStyle}>
        <div style={infoBox}>
          <span style={labelStyle}>MICRO LLEGA EN</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
            {tiempoMicroAParada || '--'} min
          </span>
        </div>
      </div>
    </div>
  );
};

// Estilos para el buscador
const searchContainerStyle = { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '90%', zIndex: 1001 };
const inputStyle = { width: '100%', padding: '15px', borderRadius: '30px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '16px', outline: 'none' };
const cardStyle = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', backgroundColor: 'white', padding: '20px', borderRadius: '20px', zIndex: 1000 };
const infoBox = { textAlign: 'center' };
const labelStyle = { fontSize: '12px', color: '#888', fontWeight: 'bold' };
const mapStyle = [{ "elementType": "geometry", "stylers": [{ "color": "#212121" }] }];

export default Mapa;

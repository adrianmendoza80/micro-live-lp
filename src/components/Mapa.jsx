import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import MarcadorMicro from './MarcadorMicro';
import Simulador from './Simulador';

const libraries = ['geometry', 'places']; // Necesario para buscador y cálculos

const Mapa = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [parada, setParada] = useState({ lat: -34.9214, lng: -57.9545 });
  const [microData, setMicroData] = useState(null);
  const [tiempoETA, setTiempoETA] = useState(null);
  const [notificado, setNotificado] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);

  // Pedir permiso para notificaciones al iniciar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const nuevaPos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setParada(nuevaPos);
        mapRef.current.panTo(nuevaPos);
      }
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "colectivos", "micro_1"), (docSnap) => {
      if (docSnap.exists()) {
        const pos = docSnap.data();
        setMicroData(pos);

        if (window.google && parada) {
          const d = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(pos.lat, pos.lng),
            new window.google.maps.LatLng(parada)
          );
          const minutos = Math.ceil(d / 450); // Estimación micro
          setTiempoETA(minutos);

          // Lógica de Notificación: menos de 500 metros
          if (d < 500 && !notificado) {
            new Notification("¡El Micro está llegando!", {
              body: "Está a menos de 5 cuadras. ¡Salí a la parada!",
              icon: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png"
            });
            setNotificado(true);
          }
          if (d > 1000) setNotificado(false); // Reset para el siguiente
        }
      }
    });
    return () => unsub();
  }, [parada, notificado]);

  if (!isLoaded) return <div>Cargando radar...</div>;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Simulador />
      
      {/* BUSCADOR SUPERIOR */}
      <div style={searchStyle}>
        <Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}>
          <input type="text" placeholder="¿A qué esquina vas? (Ej: 7 y 50)" style={inputStyle} />
        </Autocomplete>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={parada}
        zoom={16}
        onLoad={map => mapRef.current = map}
        onClick={(e) => setParada({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
        options={{ disableDefaultUI: true, styles: mapStyle }}
      >
        <Marker position={parada} icon={{ url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", scaledSize: new window.google.maps.Size(35, 35) }} />
        {microData && <MarcadorMicro externalPos={microData} />}
      </GoogleMap>

      {/* TARJETA DE ESTADO */}
      <div style={{ ...cardStyle, borderTop: tiempoETA <= 2 ? '5px solid #e74c3c' : '5px solid #2ecc71' }}>
        <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>MICRO LLEGA EN</p>
        <h2 style={{ margin: '5px 0', color: tiempoETA <= 2 ? '#e74c3c' : '#2ecc71' }}>
          {tiempoETA ? `${tiempoETA} min` : 'Calculando...'}
        </h2>
        {tiempoETA <= 2 && <span style={{fontSize: '10px', color: '#e74c3c'}}>¡PREPARATE PARA SALIR!</span>}
      </div>
    </div>
  );
};

// Estilos
const searchStyle = { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '90%', zIndex: 10 };
const inputStyle = { width: '100%', padding: '12px 20px', borderRadius: '25px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontSize: '16px' };
const cardStyle = { position: 'absolute', bottom: '0', left: '0', right: '0', backgroundColor: 'white', padding: '20px', textAlign: 'center', borderRadius: '20px 20px 0 0', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)', zIndex: 10 };
const mapStyle = [{ "elementType": "geometry", "stylers": [{ "color": "#212121" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] }];

export default Mapa;

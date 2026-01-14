import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import MarcadorMicro from './MarcadorMicro';
import Simulador from './Simulador';

const containerStyle = { width: '100%', height: '100vh' };
const libraries = ['geometry'];

const Mapa = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBq_PygB-l2hoWIM9vlp4gniLFCnduLslg",
    libraries
  });

  const [camino, setCamino] = useState([]);
  const [microData, setMicroData] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  
  // La parada ahora es un estado para que pueda cambiar al hacer clic
  const [parada, setParada] = useState({ lat: -34.9214, lng: -57.9545, nombre: "Parada Seleccionada" });
  
  const [tiempoParaParada, setTiempoParaParada] = useState(null);
  const [tiempoMicroAParada, setTiempoMicroAParada] = useState(null);

  // 1. Cargar la ruta
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rutas", "ruta_linea_1"), (docSnap) => {
      if (docSnap.exists()) {
        const pts = docSnap.data().puntos || [];
        setCamino(pts.filter(p => p && typeof p.lat === 'number'));
      }
    });
    return () => unsub();
  }, []);

  // 2. Función para manejar el clic en el mapa
  const onMapClick = useCallback((e) => {
    const nuevaPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setParada({ ...nuevaPos, nombre: "Nueva Parada" });
  }, []);

  // 3. Ubicación del usuario y tiempo de caminata
  useEffect(() => {
    if (navigator.geolocation && isLoaded) {
      navigator.geolocation.watchPosition((pos) => {
        const actualPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(actualPos);

        if (window.google) {
          const d = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(actualPos),
            new window.google.maps.LatLng(parada)
          );
          setTiempoParaParada(Math.ceil(d / 80)); // 80m/min caminando
        }
      }, null, { enableHighAccuracy: true });
    }
  }, [isLoaded, parada]);

  // 4. Seguimiento del micro y tiempo de llegada
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "colectivos", "micro_1"), (docSnap) => {
      if (docSnap.exists()) {
        const pos = docSnap.data();
        setMicroData(pos);

        if (window.google) {
          const d = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(pos.lat, pos.lng),
            new window.google.maps.LatLng(parada.lat, parada.lng)
          );
          setTiempoMicroAParada(Math.ceil(d / 500)); // 500m/min micro
        }
      }
    });
    return () => unsub();
  }, [parada]);

  if (!isLoaded) return <div>Cargando interactividad...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <Simulador />
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={parada}
        zoom={16}
        onLoad={map => setMapRef(map)}
        onClick={onMapClick} // <--- Activa el clic
        options={{ disableDefaultUI: true, styles: mapStyle }}
      >
        <Marker 
          position={parada} 
          icon={{
            url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
            scaledSize: new window.google.maps.Size(35, 35)
          }}
          animation={window.google.maps.Animation.DROP}
        />

        {camino.length >= 2 && (
          <Polyline path={camino} options={{ strokeColor: "#2ecc71", strokeWeight: 5 }} />
        )}

        {userPos && (
          <Marker position={userPos} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }} />
        )}

        {microData && <MarcadorMicro externalPos={microData} />}
      </GoogleMap>

      {/* Tarjeta de Tiempos */}
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Tocá el mapa para cambiar de parada</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={infoBox}>
            <span style={labelStyle}>VAS CAMINANDO</span>
            <span style={valueStyle}>{tiempoParaParada || '--'} min</span>
          </div>
          
          <div style={infoBox}>
            <span style={labelStyle}>MICRO LLEGA EN</span>
            <span style={{ ...valueStyle, color: '#2ecc71' }}>{tiempoMicroAParada || '--'} min</span>
          </div>
        </div>

        {tiempoMicroAParada < tiempoParaParada && (
          <div style={avisoRojo}>⚠️ El micro llegará antes que vos a ese punto.</div>
        )}
      </div>
    </div>
  );
};

const cardStyle = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 1000 };
const infoBox = { display: 'flex', flexDirection: 'column', alignItems: 'center' };
const labelStyle = { fontSize: '10px', color: '#888', fontWeight: 'bold' };
const valueStyle = { fontSize: '22px', fontWeight: 'bold' };
const avisoRojo = { marginTop: '15px', padding: '8px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' };
const mapStyle = [{ "elementType": "geometry", "stylers": [{ "color": "#212121" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] }];

export default Mapa;
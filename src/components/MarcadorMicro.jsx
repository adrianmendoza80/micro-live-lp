import React, { useState, useEffect } from 'react';
import { Marker } from '@react-google-maps/api';

const MarcadorMicro = ({ externalPos }) => {
  const [rotation, setRotation] = useState(0);
  const [prevPos, setPrevPos] = useState(null);

  useEffect(() => {
    if (prevPos && externalPos && window.google) {
      // Calcula el ángulo de dirección (heading) entre puntos
      const heading = window.google.maps.geometry.spherical.computeHeading(
        new window.google.maps.LatLng(prevPos.lat, prevPos.lng),
        new window.google.maps.LatLng(externalPos.lat, externalPos.lng)
      );
      if (Math.abs(heading) > 1) setRotation(heading);
    }
    setPrevPos(externalPos);
  }, [externalPos]);

  return (
    <Marker
      position={externalPos}
      icon={{
        // Ícono de bus moderno
        url: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png", 
        scaledSize: new window.google.maps.Size(40, 40),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(20, 20),
        rotation: rotation 
      }}
      options={{ optimized: false }} // Permite que funcione la transición CSS
    />
  );
};

export default MarcadorMicro;
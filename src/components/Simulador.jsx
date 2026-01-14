import React, { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Simulador = () => {
  const [enMarcha, setEnMarcha] = useState(false);
  const [intervaloId, setIntervaloId] = useState(null);

  const iniciarSimulacion = async () => {
    if (enMarcha) {
      clearInterval(intervaloId);
      setEnMarcha(false);
      return;
    }

    const rutaSnap = await getDoc(doc(db, "rutas", "ruta_linea_1"));
    if (!rutaSnap.exists()) return;
    
    const puntos = rutaSnap.data().puntos;
    let indice = 0;

    const id = setInterval(async () => {
      if (indice >= puntos.length) indice = 0;
      const puntoActual = puntos[indice];
      
      await updateDoc(doc(db, "colectivos", "micro_1"), {
        lat: puntoActual.lat,
        lng: puntoActual.lng
      });

      indice++;
    }, 3000); // 3 segundos para coincidir con el CSS

    setIntervaloId(id);
    setEnMarcha(true);
  };

  return (
    <button onClick={iniciarSimulacion} style={btnSimStyle}>
      {enMarcha ? '⏹️ Detener' : '🚀 Iniciar Recorrido'}
    </button>
  );
};

const btnSimStyle = { position: 'absolute', top: '20px', left: '20px', zIndex: 2000, padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: '#2ecc71', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

export default Simulador;
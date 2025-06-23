import { useState, useEffect } from 'react';

export default function useCarrito() {
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const guardado = localStorage.getItem('carrito');
    if (guardado) setCarrito(JSON.parse(guardado));
  }, []);

  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

  const agregarAlCarrito = (item) => {
    setCarrito((prev) => [...prev, item]);
  };

  return { carrito, agregarAlCarrito };
}

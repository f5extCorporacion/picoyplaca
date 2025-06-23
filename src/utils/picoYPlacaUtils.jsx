export function obtenerDiasPicoYPlaca(mesIndex, ultimoDigito) {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const dias = [];

  const totalDias = new Date(año, mesIndex + 1, 0).getDate();

  for (let dia = 1; dia <= totalDias; dia++) {
    const fecha = new Date(año, mesIndex, dia);
    if (fecha >= hoy && [1, 3, 5].includes(fecha.getDay())) {
      // Ejemplo: lunes, miércoles y viernes hay pico y placa
      dias.push(fecha.toLocaleDateString());
    }
  }

  return dias;
}

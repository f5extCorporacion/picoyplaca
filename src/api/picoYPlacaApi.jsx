export const fetchPicoYPlacaConfig = async () => {
  const response = await fetch('https://bombomsexxx.com/picoyplaca/show2.php');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  console.log(data);
  return data;
};

  export const handleLoginMrx = async (value) => {

    try {
      const res = await fetch('https://servicios.cali.gov.co:9090/PortalAppQa/rest/api/Usuario/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identificacion: value.identificacion,
          clave: value.clave,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error:Datos no validos`);
      }

      const data1 = await res.json();
       //console.log(data1);
       return data1;
    } catch (error) {
      console.error('Error al hacer login:', error);
      setResponse({ error: error.message });
    }
  };
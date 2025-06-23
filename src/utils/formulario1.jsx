import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { isBefore, isSameMonth, startOfMonth } from 'date-fns';
import Swal from 'sweetalert2';
import './index.css';
import { useQuery } from '@tanstack/react-query';

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const JSON_URL = 'https://bombomsexxx.com/picoyplaca/show.php';

function Formulario1() {
    const [selectedPeriodOption, setSelectedPeriodOption] = useState(null);
    const [selectedMonthForModal, setSelectedMonthForModal] = useState(null);
    const [totalSelectedDays, setTotalSelectedDays] = useState(0);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedCalendarDays, setSelectedCalendarDays] = useState([]);
    const [picoPlacaCost, setPicoPlacaCost] = useState(0);
    const [selectedPicoPlacaMonth, setSelectedPicoPlacaMonth] = useState(null);
    const [selecDias, setSelecDias] = useState(false);
    const currentRealDate = new Date();
    const currentRealMonthIndex = currentRealDate.getMonth();
    const currentRealYear = currentRealDate.getFullYear();
    const [selectedMonths, setSelectedMonths] = useState([]);
     const [selectedDays, setSelectedDays] = useState([]);
    const [carrito, setCarrito] = useState([]);
  
      const hoy = new Date();

    // Usar TanStack Query para obtener los datos del JSON
    const { data: jsonData, isLoading, error } = useQuery({
        queryKey: ['picoyplacaData'],
        queryFn: async () => {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        staleTime: 60 * 60 * 1000, // 1 hora de cache
    });

    // Función para obtener los días permitidos por placa
    const obtenerDiasPermitidosPorPlaca = (placa) => {
        if (!jsonData?.DiasSemanaPicoyplaca) return [];
        
        const ultimoDigito = parseInt(placa.slice(-1));
        const diasPermitidos = [];

        jsonData.DiasSemanaPicoyplaca.forEach(diaObj => {
            const [dia, digitos] = Object.entries(diaObj)[0];
            if (digitos.includes(ultimoDigito)) {
                diasPermitidos.push(dia);
            }
        });

        return diasPermitidos;
    };

    // Función para obtener el índice del día de la semana
    const getDiaSemanaIndex = (diaNombre) => {
        const dias = {
            lunes: 0,
            martes: 1,
            miercoles: 2,
            jueves: 3,
            viernes: 4,
            sabado: 5,
            domingo: 6
        };
        return dias[diaNombre];
    };

    // Función para obtener los meses seleccionables
    const getSelectableMonths = () => {
        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();

        /*Habilitacion de meses---- */
        if (currentMonthIndex <= 5) {
            return  monthNames.slice(0, 11).map((month, index) => ({
                name: month,
                index,
                disabled: index < currentMonthIndex
            }));
        }/* else {
            return monthNames.slice(6, 12).map((month, index) => ({
                name: month,
                index: index + 6,
                disabled: (index + 6) < currentMonthIndex
            }));
            }
            */
    };

    const selectableMonths = getSelectableMonths();

    const validateForm = (values) => {
        const errors = {};

        if (!values.nombre_razon_social) {
            errors.nombre_razon_social = 'El Nombre o Razón Social es requerido.';
        }

        if (!values.tipo_documento) {
            errors.tipo_documento = 'El Tipo de Documento es requerido.';
        }

        if (!values.numero_documento) {
            errors.numero_documento = 'El Número de Documento es requerido.';
        } else if (!/^\d+$/.test(values.numero_documento)) {
            errors.numero_documento = 'El Número de Documento debe contener solo dígitos.';
        }

        if (!values.dv) {
            errors.dv = 'requerido';
        }

        if (values.telefono && !/^\d{7,10}$/.test(values.telefono)) {
            errors.telefono = 'El Teléfono debe tener entre 7 y 10 dígitos.';
        }

        if (!values.direccion_notificacion) {
            errors.direccion_notificacion = 'La Dirección para Notificación es requerida.';
        }

        if (!values.correo_electronico) {
            errors.correo_electronico = 'El Correo Electrónico es requerido.';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.correo_electronico)) {
            errors.correo_electronico = 'El Correo Electrónico no es válido.';
        }

        if (!values.numero_placa) {
            errors.numero_placa = 'El Número de Placa es requerido.';
        } else if (!/^[A-Z]{3}-\d{3}$/.test(values.numero_placa)) {
            errors.numero_placa = 'El formato de la placa debe ser AAA-111.';
        }

        if (!values.marca_vehiculo) {
            errors.marca_vehiculo = 'La Marca del Vehículo es requerida.';
        }

        if (!values.modelo_vehiculo) {
            errors.modelo_vehiculo = 'El Modelo del Vehículo es requerido.';
        }

        if (!values.clase_vehiculo) {
            errors.clase_vehiculo = 'La Clase de Vehículo es requerida.';
        }

        return errors;
    };

    const handlePlacaChange = (e, setFieldValue) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        
        if (value.length >= 6 && !value.includes('-')) {
            value = `${value.substring(0, 3)}-${value.substring(3, 6)}`;
        }
        
        setFieldValue('numero_placa', value);
    };


const esMismoDia = (dateObj) => {
    return dateObj.getDate() === hoy.getDate() && 
           dateObj.getMonth() === hoy.getMonth() && 
           dateObj.getFullYear() === hoy.getFullYear();
};

/*Calendar */

const generateCalendarDays = (year, month, placa) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const days = [];
    
    const hoy = new Date();
    const horaActual = hoy.getHours() + hoy.getMinutes()/60;
    
    const esMismoDia = (dateObj) => {
        return dateObj.getDate() === hoy.getDate() && 
               dateObj.getMonth() === hoy.getMonth() && 
               dateObj.getFullYear() === hoy.getFullYear();
    };
    
    const diasPermitidosTexto = obtenerDiasPermitidosPorPlaca(placa);
    const diasPermitidosIndex = diasPermitidosTexto.map(d => getDiaSemanaIndex(d));

    for (let i = 0; i < startWeekday; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateObj = new Date(year, month, day);
        const dateString = dateObj.toDateString();
        const isSelected = selectedCalendarDays.includes(dateString);
        const isAlreadySelected = selectedDays.some(d => new Date(d).toDateString() === dateString);
        const dayOfWeek = (dateObj.getDay() + 6) % 7;
        
        const isBeforeToday = isBefore(dateObj, hoy);
        const esDiaActualPasado = esMismoDia(dateObj) && horaActual >= 18;
        const isPicoPlacaDia = diasPermitidosIndex.includes(dayOfWeek);
        const isDisabled = isBeforeToday || esDiaActualPasado || !isPicoPlacaDia;

        days.push(
            <div
                key={day}
                className={`calendar-day 
                    ${isSelected ? 'selected' : ''} 
                    ${isDisabled ? 'disabled' : ''}
                    ${isAlreadySelected ? 'already-selected' : ''}`}
                onClick={() => {
                    if (!isDisabled && !isAlreadySelected) {
                        const updatedDays = isSelected
                            ? selectedCalendarDays.filter(d => d !== dateString)
                            : [...selectedCalendarDays, dateString];
                        
                        setSelectedCalendarDays(updatedDays);
                        setTotalSelectedDays(updatedDays.length);
                        
                        const costPerDay = jsonData?.Valores?.dia || 200;
                        const newCost = updatedDays.length * costPerDay;
                        setPicoPlacaCost(newCost);
                    }
                }}
            >
                {day}
            </div>
        );
    }
    
    return days;
};

const handleDaySelection = (dateString, updatedDays, year, month, placa, setFieldValue) => {
    const costPerDay = jsonData?.Valores?.dia || 200;
    const costPerMonth = jsonData?.Valores?.mes || 1000;
    
    // 1. Calcular días hábiles (Pico y Placa) en el mes
    const totalDiasHabiles = calcularDiasHabiles(year, month, placa);
    
    // 2. Si seleccionó TODOS los días hábiles → Ofrecer cambio a mes completo
    if (updatedDays.length === totalDiasHabiles) {
        Swal.fire({
            title: '¿Desea cambiar a mes completo?',
            text: `Ha seleccionado todos los días hábiles (${totalDiasHabiles} días). ¿Desea aplicar el costo por mes ($${costPerMonth})?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, usar mes completo',
            cancelButtonText: 'No, mantener días seleccionados',
        }).then((result) => {
            if (result.isConfirmed) {
                // Cambiar a mes completo
                setPicoPlacaCost(costPerMonth);
                setFieldValue('total_a_pagar', `$ ${costPerMonth.toFixed(2)}`);
                setSelectedPicoPlacaMonth(monthNames[month]);
                setSelectedMonths([...selectedMonths, month]);
                Cardbussinesadd({
                    mes: monthNames[month],
                    precioMes: costPerMonth.toFixed(2),
                    tipo: 'mes completo'
                });
            } else {
                // Mantener cálculo por días
                const costoPorDias = updatedDays.length * costPerDay;
                setPicoPlacaCost(costoPorDias);
                setFieldValue('total_a_pagar', `$ ${costoPorDias.toFixed(2)}`);
            }
        });
    } else {
        // Cálculo normal por días
        const costoPorDias = updatedDays.length * costPerDay;
        setPicoPlacaCost(costoPorDias);
        setFieldValue('total_a_pagar', `$ ${costoPorDias.toFixed(2)}`);
    }

    // Actualizar días seleccionados
    setSelectedCalendarDays(updatedDays);
    setTotalSelectedDays(updatedDays.length);
};
// Función handleDaySelection corregida
/*Envo precio mes */
const openPicoPlacaModal = (monthName, monthIndex, values, setFieldValue) => {
    if (!/^[A-Z]{3}-\d{3}$/.test(values.numero_placa)) {
        Swal.fire({
            icon: 'warning',
            title: 'Placa Inválida',
            text: 'Por favor, ingrese un número de placa válido (Ej: AAA-111) primero.',
        });
        return;
    }

    // Verificar si el mes ya fue seleccionado
    if (selectedMonths.includes(monthIndex)) {
        Swal.fire({
            icon: 'warning',
            title: 'Mes ya seleccionado',
            text: `El mes de ${monthName} ya ha sido seleccionado anteriormente.`,
        });
        return;
    }

    setSelectedMonthForModal(monthName);
    setSelectedPeriodOption(null);
    setSelectedCalendarDays([]);
    setTotalSelectedDays(0);
    setCurrentMonth(monthIndex);
    setCurrentYear(currentRealYear);

    const hoyPlox = new Date();
    const mesActual = hoyPlox.getMonth() + 1;
    const mes = monthIndex + 1;

    Swal.fire({
        title: ' Pico y Placa',
        html: `
             <style>
        .swal2-radio {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }
        .swal2-radio label {
            cursor: pointer;
            font-size: 16px;
        }
    </style>
    <div class="swal2-radio">
    
        ${mesActual === mes ? ` <div class="r1"><p>El mes ya esta en curso selecciona "continuar" y mira tu pico y placa por dias. </p> <input type="radio" name="periodo" value="dias" checked> Días específicos </div></br>
            `: `  <div class="r1"><p>El mes esta completo Selecciona tu opción. </p><input type="radio" name="periodo" value="meses" checked> Mes
            <input type="radio" name="periodo" value="dias"> Días  `
        }
         
        
    </div>
    <div id="picoPlacaInfoSwalManual">
   
    </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const periodo = document.querySelector('input[name="periodo"]:checked')?.value;
            return { periodo };
        },
    }).then((result) => {
        if (result.isConfirmed) {
            const { periodo } = result.value;
            if (periodo === 'meses') {
                const cost = jsonData?.Valores?.mes || 1000;
                setPicoPlacaCost(cost);
                localStorage.setItem('picoPlacaCost', cost);
                localStorage.setItem('picoPlacaCostGlow', cost);
                localStorage.setItem('selectedMonth', monthName);
                setSelectedPicoPlacaMonth(monthName);
                setFieldValue('total_a_pagar', `$ ${cost.toFixed(2)}`);
                // Agregar el mes a la lista de meses seleccionados
                setSelectedMonths([...selectedMonths, monthIndex]);
                Swal.fire({
                    icon: 'success',
                    title: 'Pico y Placa contratado',
                    text: `Has seleccionado el mes completo de ${monthName} por un valor de $${cost.toFixed(2)}`,
                });
            } else if (periodo === 'dias') {
                setSelecDias(true);
            }
        }
    });
};

/*handle dias */

/*proceso enviado */
    const handleSubmit = (values) => {
        if (!picoPlacaCost || picoPlacaCost === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Pico y Placa',
                text: 'Debe seleccionar un período (mes o días) para Pico y Placa.',
            });
            return;
        }

        console.log('Formulario enviado:', values);
        Swal.fire({
            icon: 'success',
            title: 'Solicitud Enviada',
            text: 'El formulario se ha enviado con éxito!',
            html:`<ul class="preciomodal">
                   <li><p> Razon :${values.nombre_razon_social} </p>
                   <p> ${values.tipo_documento} :${values.numero_documento}  </p>
                   <p> Direccion :${values.direccion_notificacion} Email:${values.correo_electronico} </p></li>
                   
                  
                   <li> <p>Dv :${JSON.stringify(values.dv)} </p> <p>-Tel:${JSON.stringify(values.telefono)}</p> </li>
                  <li> <p>Numero Placa :${JSON.stringify(values.numero_placa)}</p><p> - Marca:${JSON.stringify(values.marca_vehiculo)} </p></li>
                   <li> <p>Modelo_vehiculo :${JSON.stringify(values.modelo_vehiculo)}</p> <p>-Clase:${JSON.stringify(values.clase_vehiculo)}</p> </li>
                   <li> <span>${ values.total_a_pagar}</span></li>
                   </ul>
                   `
        });
    };

    /*Calculo dias habiles */
    const calcularDiasHabiles = (year, month, placa) => {
    const diasPermitidosTexto = obtenerDiasPermitidosPorPlaca(placa);
    const diasPermitidosIndex = diasPermitidosTexto.map(d => getDiaSemanaIndex(d));
    const lastDay = new Date(year, month + 1, 0).getDate();
    let diasHabiles = 0;

    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(year, month, day);
        const isBeforeToday = isBefore(dateObj, new Date());
        const dayOfWeek = (dateObj.getDay() + 6) % 7; // lunes=0
        
        if (!isBeforeToday && diasPermitidosIndex.includes(dayOfWeek)) {
            diasHabiles++;
        }
    }

    return diasHabiles;
};
/*Carrito de compra */
const Cardbussinesadd =(producto)=>{
  setCarrito((prevCarrito) => [...prevCarrito ,producto])
  alert(JSON.stringify(carrito))
  //localStorage.setItem("card",JSON.stringify(carrito));
}
    // Mostrar loading o error si es necesario
    if (isLoading) {
        return <div>Cargando configuración de Pico y Placa...</div>;
    }

    if (error) {
        return <div>Error al cargar la configuración: {error.message}</div>;
    }

    return (
        <Formik
            initialValues={{
                nombre_razon_social: '',
                tipo_documento: '',
                numero_documento: '',
                dv: '',
                telefono: '',
                direccion_notificacion: '',
                correo_electronico: '',
                numero_placa: '',
                marca_vehiculo: '',
                modelo_vehiculo: '',
                clase_vehiculo: '',
                observaciones: '',
                total_a_pagar: '$ 0.00',
            }}
            validate={validateForm}
            onSubmit={handleSubmit}
        >
            {({ values, errors, touched, setFieldValue }) => (
                <Form>
                    <div className="form-group">
                        <label htmlFor="nombre_razon_social" className="required">Nombre o Razón Social</label>
                        <Field
                            type="text"
                            id="nombre_razon_social"
                            name="nombre_razon_social"
                            className={`form-control ${errors.nombre_razon_social && touched.nombre_razon_social ? 'is-invalid' : ''}`}
                        required />
                        <ErrorMessage name="nombre_razon_social" component="span" className="error-message" />
                    </div>

                    <div className="form-row-group document-phone-row">
                        <div className="form-group-small">
                            <label htmlFor="tipo_documento" className="required">Tipo Documento</label>
                            <Field
                                as="select"
                                id="tipo_documento"
                                name="tipo_documento"
                                className={`form-control ${errors.tipo_documento && touched.tipo_documento ? 'is-invalid' : ''}`}
                            >
                                <option value="">Seleccione</option>
                                <option value="CC">CC</option>
                                <option value="CE">CE</option>
                                <option value="NIT">NIT</option>
                                <option value="PAS">PAS</option>
                            </Field>
                            <ErrorMessage name="tipo_documento" component="span" className="error-message" />
                        </div>
                        <div className="form-group-small">
                            <label htmlFor="numero_documento" className="required">Número Documento</label>
                            <Field
                                type="text"
                                id="numero_documento"
                                name="numero_documento"
                                className={`form-control ${errors.numero_documento && touched.numero_documento ? 'is-invalid' : ''}`}
                           required />
                            <ErrorMessage name="numero_documento" component="span" className="error-message" />
                        </div>
                        <div className="form-group-small" id="dv-group">
                            <label htmlFor="dv">D.V.</label>
                            <Field
                                type="text"
                                id="dv"
                                name="dv"
                                className="form-control"
                            required/>
                            <ErrorMessage name="dv" component="span" className="error-message" />
                        </div>
                        <div className="form-group-small">
                            <label htmlFor="telefono">Teléfono</label>
                            <Field
                                type="tel"
                                id="telefono"
                                name="telefono"
                                className={`form-control ${errors.telefono && touched.telefono ? 'is-invalid' : ''}`}
                            required />
                            <ErrorMessage name="telefono" component="span" className="error-message" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="direccion_notificacion" className="required">Dirección para Notificación</label>
                        <Field
                            type="text"
                            id="direccion_notificacion"
                            name="direccion_notificacion"
                            className={`form-control ${errors.direccion_notificacion && touched.direccion_notificacion ? 'is-invalid' : ''}`}
                        required />
                        <ErrorMessage name="direccion_notificacion" component="span" className="error-message" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="correo_electronico" className="required">Correo Electrónico</label>
                        <Field
                            type="email"
                            id="correo_electronico"
                            name="correo_electronico"
                            className={`form-control ${errors.correo_electronico && touched.correo_electronico ? 'is-invalid' : ''}`}
                       required />
                        <ErrorMessage name="correo_electronico" component="span" className="error-message" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="numero_placa" className="required">Número de Placa (Ej: AAA-111)</label>
                        <Field
                            type="text"
                            id="numero_placa"
                            name="numero_placa"
                            className={`form-control ${errors.numero_placa && touched.numero_placa ? 'is-invalid' : ''}`}
                            placeholder="AAA-111"
                            maxLength="7"
                            onChange={(e) => handlePlacaChange(e, setFieldValue)}
                       required  />
                        <ErrorMessage name="numero_placa" component="span" className="error-message" />
                    </div>

                    <div className="form-group">
                        {/^[A-Z]{3}-\d{3}$/.test(values.numero_placa) && (
                            <div id="monthsContainer" className="months-container">
                                {selecDias ? (
                                    <div className="dias-seleccionados-container">
                                        <div className="calendar-container">
                                            <div className="calendar-header">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        if (currentMonth > 0) {
                                                            setCurrentMonth(currentMonth - 1);
                                                        }
                                                    }}
                                                    disabled
                                                   // disabled={currentMonth <= 0}
                                                    
                                                >
                                                    &lt;
                                                </button>
                                                <span>{monthNames[currentMonth]} {currentYear}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        if (currentMonth < 11) {
                                                            setCurrentMonth(currentMonth + 1);
                                                        }
                                                    }}
                                                    disabled
                                                    //disabled={currentMonth >= 11}
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                            <div className="calendar-grid">
                                                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
                                                    <div key={i} className="calendar-day-name">{day}</div>
                                                ))}
                                                {generateCalendarDays(currentYear, currentMonth, values.numero_placa)}
                                            </div>
                                            <div className="calendar-summary">
                                                <p>Total días seleccionados: {totalSelectedDays}</p>
                                                <p>Total a pagar: ${picoPlacaCost.toFixed(2)}</p>
   <button
    type="button"
    className="btn-confirmar"
    onClick={() => {
        if (totalSelectedDays > 0) {
            const totalDiasHabiles = calcularDiasHabiles(currentYear, currentMonth, values.numero_placa);
            const isMesCompleto = totalSelectedDays === totalDiasHabiles;
            
            if (isMesCompleto && picoPlacaCost !== (jsonData?.Valores?.mes || 1000)) {
                // Si tiene todos los días pero no se ha confirmado como mes completo
                const cost = jsonData?.Valores?.mes || 1000;
                setFieldValue('total_a_pagar', `$ ${cost.toFixed(2)}`);
                setSelectedPicoPlacaMonth(monthNames[currentMonth]);
                setSelectedMonths([...selectedMonths, currentMonth]);
                Cardbussinesadd({
                    mes: monthNames[currentMonth],
                    precioMes: cost.toFixed(2),
                    tipo: 'mes completo'
                });
            } else {
                setFieldValue('total_a_pagar', `$ ${picoPlacaCost.toFixed(2)}`);
                setSelectedPicoPlacaMonth(`${monthNames[currentMonth]} (${totalSelectedDays} días)`);
                setSelectedDays([...selectedDays, ...selectedCalendarDays]);
                Cardbussinesadd({
                    mes: monthNames[currentMonth],
                    precioMes: picoPlacaCost.toFixed(2),
                    tipo: `${totalSelectedDays} días`
                });
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Selección confirmada',
                text: isMesCompleto ? 
                    `Has seleccionado el mes completo de ${monthNames[currentMonth]} por un valor de $${(jsonData?.Valores?.mes || 1000).toFixed(2)}` :
                    `Has seleccionado ${totalSelectedDays} días en ${monthNames[currentMonth]} por un valor de $${picoPlacaCost.toFixed(2)}`,
            });
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Ningún día seleccionado',
                text: 'Por favor selecciona al menos un día para continuar.',
            });
        }
    }}
>
    Confirmar selección
</button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setSelecDias(false)}
                                                    className="btn-cambiar-opcion"
                                                >
                                                    Volver a meses
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3>Selecciona un mes:</h3>
                                        <div className="month-buttons-container">
                                            {selectableMonths.map((month, index) => (
                                                <button
                                                key={index}
                                                type="button"
                                                className={`month-button 
                                                    ${month.disabled ? 'disabled' : ''}
                                                    ${selectedMonths.includes(month.index) ? 'selected-month' : ''}`}
                                                onClick={() => !month.disabled && openPicoPlacaModal(month.name, month.index, values, setFieldValue)}
                                                disabled={month.disabled || selectedMonths.includes(month.index)}
                                            >
                                                {month.name}
                                            </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )} <br />
                        <div className="selectedMonthsBadgeContainer">
                            {/*selectedPicoPlacaMonth && (
                                <span className="selected-months-badge">
                                    Pico y Placa contratado para: {selectedPicoPlacaMonth}
                                </span>
                            )*/}
                            {carrito.map((dv, index) => (
                                    <div key={index}>
                                        <span className="selected-months-badge">
                                       Mes: {dv.mes} - Precio $ {dv.precioMes}
                                       </span>
                                    </div>
                                    ))}

                        </div>
                    </div>

                    <div className="form-row-group">
                        <div className="form-group-small">
                            <label htmlFor="marca_vehiculo" className="required">Marca</label>
                            <Field
                                as="select"
                                id="marca_vehiculo"
                                name="marca_vehiculo"
                                className={`form-control ${errors.marca_vehiculo && touched.marca_vehiculo ? 'is-invalid' : ''}`}
                            >
                                <option value="">Seleccione</option>
                                <option value="FORD">Ford</option>
                                <option value="CHEVROLET">Chevrolet</option>
                                <option value="TOYOTA">Toyota</option>
                                <option value="NISSAN">Nissan</option>
                            </Field>
                            <ErrorMessage name="marca_vehiculo" component="span" className="error-message" />
                        </div>
                        <div className="form-group-small">
                            <label htmlFor="modelo_vehiculo" className="required">Modelo</label>
                            <Field
                                as="select"
                                id="modelo_vehiculo"
                                name="modelo_vehiculo"
                                className={`form-control ${errors.modelo_vehiculo && touched.modelo_vehiculo ? 'is-invalid' : ''}`}
                            >
                                <option value="">Seleccione</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="1980">1980</option>
                            </Field>
                            <ErrorMessage name="modelo_vehiculo" component="span" className="error-message" />
                        </div>
                        <div className="form-group-small">
                            <label htmlFor="clase_vehiculo" className="required">Clase de Vehículo</label>
                            <Field
                                as="select"
                                id="clase_vehiculo"
                                name="clase_vehiculo"
                                className={`form-control ${errors.clase_vehiculo && touched.clase_vehiculo ? 'is-invalid' : ''}`}
                            >
                                <option value="">Seleccione</option>
                                <option value="AUTOMOVIL">Automóvil</option>
                                <option value="CAMIONETA">Camioneta</option>
                                <option value="CAMION">Camión</option>
                            </Field>
                            <ErrorMessage name="clase_vehiculo" component="span" className="error-message" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="observaciones">Observaciones</label>
                        <Field
                            as="textarea"
                            id="observaciones"
                            name="observaciones"
                            className="form-control"
                        required/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="total_a_pagar" className="required">Total a Pagar</label>
                        <Field
                            type="text"
                            id="total_a_pagar"
                            name="total_a_pagar"
                            className="form-control"
                            placeholder="$ 0.00"
                            readOnly
                        />
                    </div>

                    <button type="submit" className="btn-submit">Enviar Solicitud</button>
                </Form>
            )}
        </Formik>
    );
}

export default Formulario1;
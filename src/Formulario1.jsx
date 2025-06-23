import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import Swal from 'sweetalert2';
import './index.css';
import { useQuery } from '@tanstack/react-query';
import { format, getMonth, getDate, getHours, getDaysInMonth, isBefore, isSameMonth, startOfDay, isWithinInterval, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import withReactContent from 'sweetalert2-react-content';
import { usePicoYPlacaConfig } from './hooks/usePicoYPlacaConfig';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdDeleteOutline } from "react-icons/md";

const MySwal = withReactContent(Swal);
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Formulario1() {
  const { data, isLoading, isError, error } = usePicoYPlacaConfig();
  const [lastDigit, setLastDigit] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState({});
  const [cart, setCart] = useState([]);
  const [activeResolutions, setActiveResolutions] = useState([]);

  const today = new Date();
  const currentMonthIndex = getMonth(today);
  const currentHour = getHours(today);


  useEffect(() => {
    if (data?.resoluciones) {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      const filtered = data.resoluciones.filter(res => {
        const isActive = res.estado === "Activo";
        const startYear = new Date(res["fecha-inicio"]).getFullYear();
        const endYear = new Date(res["fecha-fin"]).getFullYear();

        return isActive && (startYear === currentYear || startYear === nextYear || 
               endYear === currentYear || endYear === nextYear);
      });

      setActiveResolutions(filtered);
    }
  }, [data]);

   const getPicoYPlacaRulesForResolution = (resolution) => {
    if (!resolution || !resolution["terminacion-placas"] || resolution["terminacion-placas"].length === 0) return {};

    const rules = {};
    const dayNameMap = {
      'lunes': 'lunes',
      'martes': 'martes',
      'miercoles': 'miercoles',
      'miércoles': 'miercoles',
      'jueves': 'jueves',
      'viernes': 'viernes'
    };

    const placaRulesObject = resolution["terminacion-placas"][0];

    for (const originalDayName in placaRulesObject) {
      if (Object.prototype.hasOwnProperty.call(placaRulesObject, originalDayName)) {
        const normalizedDayName = dayNameMap[originalDayName.toLowerCase()] || originalDayName.toLowerCase();
        const digits = Array.isArray(placaRulesObject[originalDayName])
          ? placaRulesObject[originalDayName].map(d => typeof d === 'string' ? parseInt(d, 10) : d)
          : [];
        rules[normalizedDayName] = digits;
      }
    }
    return rules;
  };


const getPicoYPlacaValuesForResolution = (resolution) => {
    if (!resolution) return { dia: 0, mes: 0, descuento: 0 };
    return {
      dia: parseFloat(resolution["valor-dia"]),
      mes: parseFloat(resolution["valor-mes"]),
      descuento: parseFloat(resolution["descuento"]) / 100
    };
  };

  const getResolutionForDate = (date) => {
    const targetDate = startOfDay(date);
    for (const resolution of activeResolutions) {
      const startDate = startOfDay(parseISO(resolution["fecha-inicio"]));
      const endDate = startOfDay(parseISO(resolution["fecha-fin"]));
      if (isWithinInterval(targetDate, { start: startDate, end: endDate })) {
        return resolution;
      }
    }
    return null;
  };

const isPicoYPlacaDay = (date, digit) => {
    if (digit === null) return false;
    const resolution = getResolutionForDate(date);
    if (!resolution) return false;

    const dayName = format(date, 'EEEE', { locale: es }).toLowerCase();
    const normalizedDayName = dayName === 'miércoles' ? 'miercoles' : dayName;
    const rules = getPicoYPlacaRulesForResolution(resolution);

    return rules[normalizedDayName]?.includes(digit) || false;
  };

  const isHoliday = (date) => {
    const resolution = getResolutionForDate(date);
    if (!resolution || !resolution.festivos) return false;
    return resolution.festivos.some(holidayStr => isSameDay(date, parseISO(holidayStr)));
  };

  const getPicoYPlacaDaysInMonth = (year, monthIndex, digit) => {
    if (digit === null) return [];
    const dateInMonth = new Date(year, monthIndex, 1);
    const daysInMonth = getDaysInMonth(dateInMonth);
    const picoDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, monthIndex, i);
      const isHolidayDay = isHoliday(date);
      const isPicoPlacaDay = isPicoYPlacaDay(date, digit);
      
      if (isPicoPlacaDay) {
        picoDays.push({
          day: i,
          isHoliday: isHolidayDay,
          isPicoPlaca: isPicoPlacaDay
        });
      }
    }
    return picoDays;
  };

    const monthHasHolidaysInRestrictionDays = (monthIndex, digit) => {
    if (digit === null) return false;
    const picoDays = getPicoYPlacaDaysInMonth(today.getFullYear(), monthIndex, digit);
    return picoDays.some(day => day.isHoliday);
  };


  useEffect(() => {
    let newCart = [];
    let selectedMonthsDetails = [];

    Object.entries(selectedMonths).forEach(([monthIdx, monthData]) => {
      const monthIndex = parseInt(monthIdx, 10);
      const monthName = monthNames[monthIndex];
      const monthDate = new Date(today.getFullYear(), monthIndex, 1);
      const currentResolution = getResolutionForDate(monthDate);

      if (!currentResolution) return;

      const currentValues = getPicoYPlacaValuesForResolution(currentResolution);
      const isMonthOptionSelected = monthData.isSelected;
      const selectedDaysInMonth = monthData.selectedDays || [];

      if (isMonthOptionSelected) {
        const allPicoDays = getPicoYPlacaDaysInMonth(today.getFullYear(), monthIndex, lastDigit)
          .filter(d => d.isPicoPlaca && !d.isHoliday)
          .map(d => d.day);

        selectedMonthsDetails.push({
          month: monthName,
          days: 'Todos los días de restricción (sin festivos)',
          count: allPicoDays.length,
          value: currentValues.mes,
          discount: currentValues.descuento,
          resolution: currentResolution.numero,
          semestre: currentResolution.semestre,
          type: 'month',
          monthIndex: monthIndex
        });
      } else if (selectedDaysInMonth.length > 0) {
        selectedMonthsDetails.push({
          month: monthName,
          days: selectedDaysInMonth.join(', '),
          count: selectedDaysInMonth.length,
          value: currentValues.dia,
          discount: currentValues.descuento,
          resolution: currentResolution.numero,
          semestre: currentResolution.semestre,
          type: 'day',
          monthIndex: monthIndex
        });
      }
    });

    // Agrupar por resolución y tipo (mes/día)
    const groupedCart = selectedMonthsDetails.reduce((acc, item) => {
      const key = `${item.resolution}-${item.semestre}-${item.type}`;
      if (!acc[key]) {
        acc[key] = {
          type: item.type,
          resolution: item.resolution,
          semestre: item.semestre,
          items: [],
          subtotal: 0,
          discount: 0
        };
      }
      
      acc[key].items.push(item);
      acc[key].subtotal += item.type === 'month' ? item.value : item.count * item.value;
      acc[key].discount += item.type === 'month' 
        ? item.value * item.discount 
        : item.count * item.value * item.discount;
      
      return acc;
    }, {});

    // Crear el carrito con todos los detalles
    newCart = Object.values(groupedCart).map(group => ({
      type: group.type,
      resolution: group.resolution,
      semestre: group.semestre,
      quantity: group.items.reduce((sum, item) => sum + (group.type === 'month' ? 1 : item.count), 0),
      value: group.type === 'month' 
        ? group.items[0].value 
        : group.subtotal / group.items.reduce((sum, item) => sum + item.count, 0),
      total: group.subtotal,
      discount: group.discount,
      details: group.type === 'month' 
        ? `Meses completos (${group.items.length}) - Resolución ${group.resolution} - ${group.semestre}`
        : `Días individuales (${group.items.reduce((sum, item) => sum + item.count, 0)}) - Resolución ${group.resolution} - ${group.semestre}`,
      monthsDetails: group.items
    }));

    setCart(newCart);
  }, [selectedMonths, lastDigit, activeResolutions]);



  const getMonthState = (monthIndex, resolution) => {
    const currentYear = today.getFullYear();
    const evaluatedMonthDate = new Date(currentYear, monthIndex, 1);

    const resolutionStartDate = parseISO(resolution["fecha-inicio"]);
    const resolutionEndDate = parseISO(resolution["fecha-fin"]);

    const isMonthWithinResolution = isWithinInterval(evaluatedMonthDate, {
      start: resolutionStartDate,
      end: resolutionEndDate,
    });

    const isPastMonth = isBefore(evaluatedMonthDate, startOfDay(today)) && 
                       !isSameMonth(evaluatedMonthDate, today);

    const isCurrentMonth = monthIndex === currentMonthIndex;

    let isDisabled = false;
    let isGreyedOut = false;
    let picoPassedInCurrentMonth = false;
    let hasHolidaysInRestrictionDays = false;

    if (!isMonthWithinResolution) {
      isDisabled = true;
      isGreyedOut = true;
    } else if (isPastMonth) {
      isDisabled = true;
      isGreyedOut = true;
    } else if (isCurrentMonth && lastDigit !== null) {
      const picoDaysInCurrentMonth = getPicoYPlacaDaysInMonth(currentYear, currentMonthIndex, lastDigit)
        .filter(d => d.isPicoPlaca)
        .map(d => d.day);

      picoPassedInCurrentMonth = picoDaysInCurrentMonth.some(picoDay => {
        const picoDate = new Date(currentYear, currentMonthIndex, picoDay);
        return isBefore(startOfDay(picoDate), startOfDay(today)) ||
               (isSameDay(picoDate, today) && currentHour >= 18);
      });

      if (picoPassedInCurrentMonth) {
        isDisabled = true;
      }
    }

    if (lastDigit !== null) {
      hasHolidaysInRestrictionDays = monthHasHolidaysInRestrictionDays(monthIndex, lastDigit);
    }

    return { isDisabled, isGreyedOut, picoPassedInCurrentMonth, hasHolidaysInRestrictionDays };
  };

  const getDayState = (monthIndex, day, resolution) => {
    const currentYear = today.getFullYear();
    const currentMonthData = selectedMonths[monthIndex] || { isSelected: false, selectedDays: [] };
    const isSelected = currentMonthData.selectedDays.includes(day);
    
    const dayDate = new Date(currentYear, monthIndex, day);
    const currentDate = startOfDay(today);
    
    const isPastDay = isBefore(dayDate, currentDate);
    const isToday = isSameDay(dayDate, currentDate);
    const isPastHourToday = isToday && currentHour >= 18;
    const isHolidayDay = isHoliday(dayDate);
    const isPicoPlacaDay = isPicoYPlacaDay(dayDate, lastDigit);

    const isSelectable = isPicoPlacaDay;
    const isDisabled = !isSelectable || isPastDay || isPastHourToday || isHolidayDay;
    const isGreyedOut = isPastDay || isPastHourToday;

    return { 
      isDisabled, 
      isSelected, 
      isGreyedOut,
      isHoliday: isHolidayDay,
      isPicoPlaca: isPicoPlacaDay
    };
  };

  const handleMonthCheckboxChange = (monthIndex, resolution, isChecked = null) => {
    const { isDisabled, hasHolidaysInRestrictionDays } = getMonthState(monthIndex, resolution);
    
    if (isDisabled) return;

    if (hasHolidaysInRestrictionDays) {
      MySwal.fire({
        title: 'Selección no permitida',
        text: 'Este mes contiene días festivos en los días de restricción. Por favor seleccione los días individualmente.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    setSelectedMonths(prev => {
      const newSelectedMonths = { ...prev };
      const currentMonthData = newSelectedMonths[monthIndex] || { isSelected: false, selectedDays: [] };

      const newIsSelected = isChecked !== null ? isChecked : !currentMonthData.isSelected;
      const allPicoDays = getPicoYPlacaDaysInMonth(today.getFullYear(), monthIndex, lastDigit)
        .filter(d => d.isPicoPlaca && !d.isHoliday)
        .map(d => d.day);

      newSelectedMonths[monthIndex] = {
        ...currentMonthData,
        isSelected: newIsSelected,
        selectedDays: newIsSelected ? allPicoDays : [],
      };
      return newSelectedMonths;
    });
  };

  const handleDayButtonClick = (monthIndex, day, resolution) => {
    const date = new Date(today.getFullYear(), monthIndex, day);
    const { isPicoPlaca, isHoliday } = getDayState(monthIndex, day, resolution);
    
    if (!isPicoPlaca || isHoliday) return;

    setSelectedMonths(prev => {
      const newSelectedMonths = { ...prev };
      const currentMonthData = newSelectedMonths[monthIndex] || { isSelected: false, selectedDays: [] };
      let newSelectedDays = [...currentMonthData.selectedDays];

      if (newSelectedDays.includes(day)) {
        newSelectedDays = newSelectedDays.filter(d => d !== day);
      } else {
        newSelectedDays.push(day);
      }

      const allPicoDaysForMonth = getPicoYPlacaDaysInMonth(today.getFullYear(), monthIndex, lastDigit)
        .filter(d => d.isPicoPlaca && !d.isHoliday)
        .map(d => d.day);
        
      const allDaysSelected = allPicoDaysForMonth.length > 0 &&
        newSelectedDays.length === allPicoDaysForMonth.length &&
        allPicoDaysForMonth.every(d => newSelectedDays.includes(d));

      newSelectedMonths[monthIndex] = {
        isSelected: allDaysSelected && !monthHasHolidaysInRestrictionDays(monthIndex, lastDigit),
        selectedDays: newSelectedDays.sort((a, b) => a - b),
      };
      return newSelectedMonths;
    });
  };

 const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const finalTotal = subtotal - totalDiscount;

  const validateForm = (values) => {
    const errors = {};

    if (!values.nombre_razon_social.trim()) {
      errors.nombre_razon_social = 'El nombre o razón social es requerido.';
    } else if (values.nombre_razon_social.length < 3) {
      errors.nombre_razon_social = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!values.tipo_documento) {
      errors.tipo_documento = 'Seleccione un tipo de documento.';
    }

    if (!values.numero_documento) {
      errors.numero_documento = 'El número de documento es requerido.';
    } else {
      const docValue = values.numero_documento.trim();
      
      if (values.tipo_documento === 'NIT') {
        if (!/^[0-9]{9,15}$/.test(docValue)) {
          errors.numero_documento = 'NIT debe tener entre 9 y 15 dígitos.';
        }
      } else if (values.tipo_documento === 'CC') {
        if (!/^[0-9]{6,10}$/.test(docValue)) {
          errors.numero_documento = 'Cédula debe tener entre 6 y 10 dígitos.';
        }
      } else if (values.tipo_documento === 'CE') {
        if (!/^[a-zA-Z0-9]{6,12}$/.test(docValue)) {
          errors.numero_documento = 'Cédula de extranjería no válida.';
        }
      }
    }

    if (values.tipo_documento === 'NIT' && !values.dv) {
      errors.dv = 'El dígito de verificación es requerido para NIT.';
    } else if (values.tipo_documento === 'NIT' && values.dv && isNaN(values.dv)) {
      errors.dv = 'El dígito de verificación debe ser numérico.';
    }

    if (!values.telefono) {
      errors.telefono = 'El teléfono es requerido.';
    } else if (!/^\d{7,10}$/.test(values.telefono)) {
      errors.telefono = 'Ingrese un número de teléfono válido (7-10 dígitos).';
    }

    if (!values.direccion_notificacion.trim()) {
      errors.direccion_notificacion = 'La dirección es requerida.';
    } else if (values.direccion_notificacion.length < 10) {
      errors.direccion_notificacion = 'La dirección debe tener al menos 10 caracteres.';
    }

    if (!values.correo_electronico) {
      errors.correo_electronico = 'El correo electrónico es requerido.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo_electronico)) {
      errors.correo_electronico = 'Ingrese un correo electrónico válido.';
    }

    if (!values.numero_placa) {
      errors.numero_placa = 'El número de placa es requerido.';
    } else if (!/^[A-Z]{3}-\d{3}$/.test(values.numero_placa)) {
      errors.numero_placa = 'El formato de placa debe ser AAA-111 (ej: ABC-123).';
    }

    if (lastDigit !== null && cart.length === 0) {
      errors.selection = 'Debe seleccionar al menos un día o un mes para exención.';
    }

    if (!values.marca_vehiculo) {
      errors.marca_vehiculo = 'Seleccione la marca del vehículo.';
    }

    if (!values.modelo_vehiculo) {
      errors.modelo_vehiculo = 'Seleccione el modelo del vehículo.';
    }

    if (!values.clase_vehiculo) {
      errors.clase_vehiculo = 'Seleccione la clase de vehículo.';
    }

    if (!values.observaciones.trim()) {
      errors.observaciones = 'Las observaciones son requeridas.';
    } else if (values.observaciones.length < 20) {
      errors.observaciones = 'Las observaciones deben tener al menos 20 caracteres.';
    }

    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      const validationErrors = validateForm(values);
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSubmitting(false);
        return;
      }

      if (lastDigit !== null && cart.length === 0) {
        setErrors({ ...validationErrors, selection: 'Debe seleccionar al menos un día o un mes para exención.' });
        setSubmitting(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      MySwal.fire({
        title: '¡Éxito!',
        text: 'Su solicitud ha sido enviada correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      resetForm();
      setLastDigit(null);
      setSelectedMonths({});
      setCart([]);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      MySwal.fire({
        title: 'Error',
        text: 'Hubo un problema al enviar su solicitud. Intente de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center my-5">Cargando configuración de Pico y Placa...</div>;
  if (isError) return <div className="alert alert-danger my-5">Error al cargar la configuración: {error.message}</div>;
  if (!data?.resoluciones) return <div className="alert alert-warning my-5">No hay configuraciones de Pico y Placa disponibles.</div>;

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
      }}
      validate={validateForm}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, setFieldValue, handleBlur, isSubmitting }) => (
        <Form className="p-4 border rounded shadow-sm container my-4">
          <h2 className="mb-4 text-center">FORMULARIO DE PICO Y PLACA</h2>

          <div className="form-section mb-4">
            <div className="form-group">
              <label htmlFor="numero_placa" className="form-label required">Número de Placa (AAA-111)</label>
              <Field
                type="text"
                id="numero_placa"
                name="numero_placa"
                className={`form-control ${touched.numero_placa && errors.numero_placa ? 'is-invalid' : ''}`}
                maxLength={7}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase();
                  value = value.replace(/[^A-Z0-9]/g, '');

                  if (value.length > 3) {
                    value = value.substring(0, 3) + '-' + value.substring(3);
                  }
                  if (value.length > 7) {
                    value = value.substring(0, 7);
                  }

                  setFieldValue('numero_placa', value);

                  if (value.length === 7 && /^[A-Z]{3}-\d{3}$/.test(value)) {
                    const lastChar = value.slice(-1);
                    const digit = parseInt(lastChar, 10);
                    if (!isNaN(digit)) {
                      setLastDigit(digit);
                      setSelectedMonths({});
                    } else {
                      setLastDigit(null);
                      setSelectedMonths({});
                    }
                  } else {
                    setLastDigit(null);
                    setSelectedMonths({});
                  }
                }}
                onBlur={handleBlur}
              />
              <ErrorMessage name="numero_placa" component="div" className="invalid-feedback" />

              {lastDigit !== null && (
                <div className="alert alert-info mt-3 d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Último dígito:</strong> {lastDigit}<br />
                    <strong>Días de restricción (aplicables):</strong>
                    {activeResolutions.map(res => {
                      const rules = getPicoYPlacaRulesForResolution(res);
                      const daysForDigit = Object.keys(rules).filter(dayName => rules[dayName].includes(lastDigit));
                      if (daysForDigit.length > 0) {
                        const resStartDate = parseISO(res["fecha-inicio"]);
                        const resEndDate = parseISO(res["fecha-fin"]);
                        const currentYear = today.getFullYear();
                        const isRelevantYear = resStartDate.getFullYear() <= currentYear && resEndDate.getFullYear() >= currentYear;

                        if (isRelevantYear) {
                          return (
                            <span key={res.numero}>
                              <br />Resolución {res.numero}: {daysForDigit.join(', ')}
                            </span>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      setLastDigit(null);
                      setSelectedMonths({});
                      setFieldValue('numero_placa', '');
                    }}
                  >
                    <MdDeleteOutline /> Limpiar Placa
                  </button>
                </div>
              )}
            </div>

            <div className="form-group agrega">
              <div className="months-grid">
                <div className="accordion" id="resolutionsAccordion">
                  {activeResolutions.map((resolution, resIndex) => {
                    const isActiva = resolution.estado === "Activo";
                    const startDate = parseISO(resolution["fecha-inicio"]);
                    const endDate = parseISO(resolution["fecha-fin"]);

                    const monthsForResolution = Array.from({ length: 12 }, (_, i) => ({
                      name: monthNames[i],
                      index: i,
                      days: getPicoYPlacaDaysInMonth(today.getFullYear(), i, lastDigit),
                    })).filter(month => {
                      const monthDate = new Date(today.getFullYear(), month.index, 1);
                      return isWithinInterval(monthDate, { start: startDate, end: endDate });
                    });

                    if (monthsForResolution.length === 0) return null;

                    return (
                      <div className={`accordion-item ${!isActiva ? 'resolucion-inactiva' : ''}`} key={resolution.numero}>
                        <h2 className="accordion-header" id={`heading${resIndex}`}>
                          <button
                            className={`accordion-button ${resIndex === 0 ? '' : 'collapsed'}`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse${resIndex}`}
                            aria-expanded={resIndex === 0 ? "true" : "false"}
                            aria-controls={`collapse${resIndex}`}
                            disabled={!isActiva}
                          >
                            Resolución: {resolution.numero} ({format(startDate, 'dd-MMM-yyyy', { locale: es })} a {format(endDate, 'dd-MMM-yyyy', { locale: es })}) - {resolution.semestre} - Estado: {resolution.estado}
                          </button>
                        </h2>
                        <div
                          id={`collapse${resIndex}`}
                          className={`accordion-collapse collapse ${resIndex === 0 ? 'show' : ''}`}
                          aria-labelledby={`heading${resIndex}`}
                          data-bs-parent="#resolutionsAccordion"
                        >
                          <div className="accordion-body">
                            <div className="form-check mb-3">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  
                                  const selectableMonths = monthsForResolution.filter(month => {
                                    const monthState = getMonthState(month.index, resolution);
                                    return !monthState.isDisabled && !monthState.hasHolidaysInRestrictionDays;
                                  });

                                  selectableMonths.forEach(month => {
                                    handleMonthCheckboxChange(month.index, resolution, isChecked);
                                  });
                                }}
                                checked={monthsForResolution.some(month => {
                                  const monthState = getMonthState(month.index, resolution);
                                  if (monthState.isDisabled || monthState.hasHolidaysInRestrictionDays) return false;
                                  const currentMonthData = selectedMonths[month.index] || { isSelected: false };
                                  return currentMonthData.isSelected;
                                }) && 
                                monthsForResolution.every(month => {
                                  const monthState = getMonthState(month.index, resolution);
                                  if (monthState.isDisabled || monthState.hasHolidaysInRestrictionDays) return true;
                                  const currentMonthData = selectedMonths[month.index] || { isSelected: false };
                                  return currentMonthData.isSelected;
                                })}
                                disabled={monthsForResolution.every(month => {
                                  const monthState = getMonthState(month.index, resolution);
                                  return monthState.isDisabled || monthState.hasHolidaysInRestrictionDays;
                                })}
                                title="Seleccionar todos los meses disponibles de esta resolución (sin festivos en días de restricción)"
                              />
                              <span className="form-check-label">Toda la resolución (sin meses con festivos)</span>
                            </div>

                            <p>
                              Dígitos de restricción para esta resolución:
                              {lastDigit !== null && Object.entries(getPicoYPlacaRulesForResolution(resolution))
                                .filter(([_, digits]) => digits.includes(lastDigit))
                                .map(([day]) => ` ${day.charAt(0).toUpperCase() + day.slice(1)}`)
                                .join(', ')}
                              {lastDigit === null && " Ingrese placa para ver."}
                            </p>
                            <div className="semester-group">
                              {monthsForResolution.map((month) => {
                                const { isDisabled, isGreyedOut, picoPassedInCurrentMonth, hasHolidaysInRestrictionDays } = getMonthState(month.index, resolution);
                                const currentMonthData = selectedMonths[month.index] || { isSelected: false, selectedDays: [] };
                                const isMonthChecked = currentMonthData.isSelected;
                                const isCurrentMonth = month.index === currentMonthIndex;

                                const allPicoDaysForMonth = getPicoYPlacaDaysInMonth(today.getFullYear(), month.index, lastDigit);
                                const allDaysSelectedByUser = allPicoDaysForMonth.length > 0 &&
                                  currentMonthData.selectedDays.length === allPicoDaysForMonth.length &&
                                  allPicoDaysForMonth.every(d => currentMonthData.selectedDays.includes(d.day));

                                let monthCheckboxDisabled = isDisabled;

                                if (!isGreyedOut) {
                                  monthCheckboxDisabled = false;
                                  if (isCurrentMonth && picoPassedInCurrentMonth) {
                                    monthCheckboxDisabled = true;
                                  }
                                } else if (isMonthChecked || allDaysSelectedByUser) {
                                  monthCheckboxDisabled = true;
                                }

                                if (hasHolidaysInRestrictionDays) {
                                  monthCheckboxDisabled = true;
                                }

                                const containerIsDisabled = isGreyedOut || lastDigit === null;

                                return (
                                  <div key={month.index}
                                    className={`container-mes card p-1 mb-1 ${containerIsDisabled ? 'greyed-out' : ''} ${isMonthChecked ? 'selected-month' : ''}`}
                                  >
                                    <div className="mes form-check mb-2">
                                      <input
                                        type="checkbox"
                                        id={`month-${resolution.numero}-${month.index}`}
                                        className="form-check-input"
                                        checked={isMonthChecked || (lastDigit !== null && allDaysSelectedByUser && !isMonthChecked)}
                                        onChange={() => handleMonthCheckboxChange(month.index, resolution)}
                                        disabled={monthCheckboxDisabled || lastDigit === null || !isActiva || hasHolidaysInRestrictionDays}
                                        title={
                                          hasHolidaysInRestrictionDays ? 
                                          "No se puede seleccionar el mes completo porque contiene días festivos en los días de restricción. Seleccione días individuales." :
                                          isCurrentMonth && picoPassedInCurrentMonth ? 
                                          "No se puede seleccionar el mes completo porque ya pasó al menos un día de pico y placa" : 
                                          ""
                                        }
                                      />
                                      <label htmlFor={`month-${resolution.numero}-${month.index}`} className="form-check-label">
                                        {month.name}
                                        {hasHolidaysInRestrictionDays && (
                                          <span className="badge bg-warning ms-2" title="Este mes contiene días festivos en días de restricción">
                                            Festivos
                                          </span>
                                        )}
                                      </label>
                                    </div>

                                    <div className="dias-container">
                                      <div className="numerodias d-flex flex-wrap">
                                        {lastDigit !== null && month.days.length > 0 ? (
                                          month.days.map(({day, isHoliday, isPicoPlaca}) => {
                                            const { isDisabled, isSelected, isGreyedOut } = getDayState(month.index, day, resolution);
                                            
                                            return (
                                              <button
                                                type="button"
                                                key={day}
                                                className={`btn btn-sm m-1 
                                                  ${isSelected ? 'btn-success selected-day' : 
                                                    isHoliday ? 'btn-info text-white' : 
                                                    isPicoPlaca ? 'btn-outline-primary' : 'btn-outline-secondary'} 
                                                  ${isGreyedOut ? 'greyed-out-button' : ''}`}
                                                onClick={() => isPicoPlaca && !isHoliday && handleDayButtonClick(month.index, day, resolution)}
                                                disabled={isDisabled}
                                                title={
                                                  isHoliday ? "Día festivo (no seleccionable)" :
                                                  !isPicoPlaca ? "No es día de restricción para este dígito" : ""
                                                }
                                              >
                                                {day} {isSelected && '✔'}
                                              </button>
                                            );
                                          })
                                        ) : (
                                          <p className="text-muted">
                                            {lastDigit === null ? "Ingrese placa" : "No hay días de restricción"}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <ErrorMessage name="selection" component="div" className="text-danger mt-2" />
            </div>
          </div>

          <div className="form-section">
            <h4 className="mb-3">Información Personal</h4>
            <div className="form-group">
              <label htmlFor="nombre_razon_social" className="required">Nombre o Razón Social</label>
              <Field
                type="text"
                id="nombre_razon_social"
                name="nombre_razon_social"
                className={`form-control ${errors.nombre_razon_social && touched.nombre_razon_social ? 'is-invalid' : ''}`}
              />
              <ErrorMessage name="nombre_razon_social" component="div" className="invalid-feedback" />
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
                  <option value="CC">CC - Cédula de Ciudadanía</option>
                  <option value="CE">CE - Cédula de Extranjería</option>
                  <option value="NIT">NIT - Número de Identificación Tributaria</option>
                  <option value="PAS">PAS - Pasaporte</option>
                </Field>
                <ErrorMessage name="tipo_documento" component="div" className="invalid-feedback" />
              </div>
              <div className="form-group-small">
                <label htmlFor="numero_documento" className="required">Número Documento</label>
                <Field
                  type="text"
                  id="numero_documento"
                  name="numero_documento"
                  className={`form-control ${errors.numero_documento && touched.numero_documento ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="numero_documento" component="div" className="invalid-feedback" />
              </div>
              {values.tipo_documento === 'NIT' && (
                <div className="form-group-small" id="dv-group">
                  <label htmlFor="dv" className="required">D.V.</label>
                  <Field
                    type="text"
                    id="dv"
                    name="dv"
                    className={`form-control ${errors.dv && touched.dv ? 'is-invalid' : ''}`}
                    maxLength={1}
                  />
                  <ErrorMessage name="dv" component="div" className="invalid-feedback" />
                </div>
              )}
              <div className="form-group-small">
                <label htmlFor="telefono" className="required">Teléfono</label>
                <Field
                  type="tel"
                  id="telefono"
                  name="telefono"
                  className={`form-control ${errors.telefono && touched.telefono ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="telefono" component="div" className="invalid-feedback" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="direccion_notificacion" className="required">Dirección para Notificación</label>
              <Field
                type="text"
                id="direccion_notificacion"
                name="direccion_notificacion"
                className={`form-control ${errors.direccion_notificacion && touched.direccion_notificacion ? 'is-invalid' : ''}`}
              />
              <ErrorMessage name="direccion_notificacion" component="div" className="invalid-feedback" />
            </div>

            <div className="form-group">
              <label htmlFor="correo_electronico" className="required">Correo Electrónico</label>
              <Field
                type="email"
                id="correo_electronico"
                name="correo_electronico"
                className={`form-control ${errors.correo_electronico && touched.correo_electronico ? 'is-invalid' : ''}`}
              />
              <ErrorMessage name="correo_electronico" component="div" className="invalid-feedback" />
            </div>
          </div>

          <div className="form-section">
            <h4 className="mb-3">Información del Vehículo</h4>
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
                  <option value="Audi">Audi</option>
                  <option value="BMW">BMW</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="Ford">Ford</option>
                  <option value="Honda">Honda</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Kia">Kia</option>
                  <option value="Mazda">Mazda</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Renault">Renault</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Volvo">Volvo</option>
                  <option value="Otro">Otro</option>
                </Field>
                <ErrorMessage name="marca_vehiculo" component="div" className="invalid-feedback" />
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
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="Otro">Otro</option>
                </Field>
                <ErrorMessage name="modelo_vehiculo" component="div" className="invalid-feedback" />
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
                  <option value="Automóvil">Automóvil</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Taxi">Taxi</option>
                  <option value="Bus">Bus</option>
                  <option value="Camión">Camión</option>
                  <option value="Otro">Otro</option>
                </Field>
                <ErrorMessage name="clase_vehiculo" component="div" className="invalid-feedback" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observaciones" className="required">Observaciones</label>
            <Field
              as="textarea"
              id="observaciones"
              name="observaciones"
              rows="3"
              className={`form-control ${errors.observaciones && touched.observaciones ? 'is-invalid' : ''}`}
            />
            <ErrorMessage name="observaciones" component="div" className="invalid-feedback" />
          </div>
  <div className="floating-cart-icon" onClick={() => MySwal.fire({
            title: `Resumen de Compra - Año ${today.getFullYear()}`,
            html: (
              <div className="cart-container">
                {cart.length === 0 ? (
                  <p className="text-muted">No hay items en el carrito</p>
                ) : (
                  <div>
                    {cart.map((item, index) => (
                      <div key={index} className="mb-4">
                        <h5 className="d-flex justify-content-between align-items-center">
                          <span>{item.details}</span>
                          <span className="badge bg-primary">${item.total.toLocaleString('es-CO')}</span>
                        </h5>
                        
                        <ul className="list-group mb-3">
                          {item.monthsDetails.map((month, i) => (
                            <li key={i} className="list-group-item">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <strong>{month.month}:</strong> {month.days} ({month.count} días)
                                  <br />
                                  <small className="text-muted">
                                    Resolución {month.resolution} - {month.semestre}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <div>${month.value.toLocaleString('es-CO')} {month.type === 'month' ? 'por mes' : 'por día'}</div>
                                  {month.discount > 0 && (
                                    <div className="text-success">
                                      Descuento: ${(month.type === 'month' 
                                        ? (month.value * month.discount).toLocaleString('es-CO') 
                                        : (month.count * month.value * month.discount).toLocaleString('es-CO'))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>

                        <div className="cart-summary">
                          <div className="d-flex justify-content-between">
                            <span>Subtotal:</span>
                            <span>${item.total.toLocaleString('es-CO')}</span>
                          </div>
                          {item.discount > 0 && (
                            <div className="d-flex justify-content-between text-success">
                              <span>Descuento:</span>
                              <span>-${item.discount.toLocaleString('es-CO')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="cart-totals border-top pt-3">
                      <div className="d-flex justify-content-between">
                        <strong>Subtotal General:</strong>
                        <strong>${subtotal.toLocaleString('es-CO')}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <strong>Descuento Total:</strong>
                        <strong className="text-success">-${totalDiscount.toLocaleString('es-CO')}</strong>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2 mt-2">
                        <strong>TOTAL A PAGAR:</strong>
                        <strong className="text-primary">${finalTotal.toLocaleString('es-CO')}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
            showCloseButton: true,
            showConfirmButton: false,
            width: '700px',
            customClass: {
              popup: 'cart-popup'
            }
          })}>
            🛒 <span className="badge bg-danger">{cart.length}</span>
          </div>

          <div className="text-center mt-4 d-flex justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-warning btn-lg"
              onClick={() => MySwal.fire({
                title: 'Factura en PDF',
                html: (
                  <div>
                    <h4>Resumen de Factura</h4>
                    <p>Aquí iría el contenido del PDF con todos los detalles de la factura</p>
                    <div className="mt-3 border-top pt-2">
                      <div className="d-flex justify-content-between">
                        <strong>Subtotal:</strong>
                        <strong>${subtotal.toLocaleString('es-CO')}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <strong>Descuento total:</strong>
                        <strong className="text-danger">-${totalDiscount.toLocaleString('es-CO')}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <strong>Total a Pagar:</strong>
                        <strong>${finalTotal.toLocaleString('es-CO')}</strong>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          Swal.fire('PDF Generado', 'El PDF se ha generado correctamente', 'success');
                          Swal.close();
                        }}
                      >
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                ),
                showCloseButton: true,
                showConfirmButton: false,
                width: '700px'
              })}
              disabled={cart.length === 0}
            >
              Generar PDF
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || Object.keys(errors).length > 0 || cart.length === 0}
            >
              {isSubmitting ? 'Enviando...' : 'Pagar'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default Formulario1;
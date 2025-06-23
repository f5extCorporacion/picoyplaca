import React, { useState } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import download from 'downloadjs';
import JsBarcode from 'jsbarcode';

const PdfPreview = ({ cart, finalTotal, prevcart }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  // ✅ FUNCION PARA GENERAR CODIGO DE BARRAS
const generarCodigoDeBarras = (valor) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, valor, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: false,
    });
    resolve(canvas.toDataURL('image/png'));
  });
};

  const generarFactura = async () => {
    const existingPdfBytes = await fetch('/plantilla103new.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];
    const { height } = page.getSize();

    // ✅ Generar código de barras como imagen
    const barcodeDataUrl = await generarCodigoDeBarras("79100000750791000007507910000075078");
    const barcodeImageBytes = await fetch(barcodeDataUrl).then(res => res.arrayBuffer());
    const barcodeImage = await pdfDoc.embedPng(barcodeImageBytes);
    const barcodeDims = barcodeImage.scale(1);

    // ✅ Dibujar código de barras en el PDF
    page.drawImage(barcodeImage, {
      x: 66,
      y: height - 690,
      width: barcodeDims.width-70,
      height: barcodeDims.height+20,
    });

    // ✅ Resto de tu lógica (cart y prevcart)
    // ... tu código para dibujar texto (cart, prevcart, finalTotal, etc.)

    const posiciones = {
      Ene: { x: 64, y: height - 145, dx: 80, dy: height - 145 },
      Feb: { x: 64, y: height - 160, dx: 80, dy: height - 163 },
      Mar: { x: 64, y: height - 175, dx: 80, dy: height - 178 },
      Abr: { x: 188, y: height - 143, dx: 205, dy: height - 142 },
      May: { x: 188, y: height - 158, dx: 205, dy: height - 160 },
      Jun: { x: 188, y: height - 176, dx: 205, dy: height - 176 },
      Jul: { x: 334, y: height - 141, dx: 350, dy: height - 142 },
      Ago: { x: 334, y: height - 158, dx: 350, dy: height - 157 },
      Sep: { x: 334, y: height - 175, dx: 350, dy: height - 174 },
      Oct: { x: 462, y: height - 142, dx: 480, dy: height - 140 },
      Nov: { x: 462, y: height - 157, dx: 480, dy: height - 155 },
      Dic: { x: 462, y: height - 174, dx: 480, dy: height - 172 },
    };

    if (cart && Array.isArray(cart)) {
      cart.forEach(item => {
        if (item.monthsDetails && Array.isArray(item.monthsDetails)) {
          item.monthsDetails.forEach(({ month, days }) => {
            const pos = posiciones[month];
            if (pos) {
              page.drawText(`X`, { x: pos.x, y: pos.y, size: 11, color: rgb(0, 0, 0) });
              page.drawText(`${days}`, { x: pos.dx, y: pos.dy, size: 11, color: rgb(0, 0, 0) });
            }
          });
        }
      });
    }

    // Datos prevcart
    page.drawText(`${prevcart.nombre_razon_social}`, { x: 50, y: height - 250, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`79100000750`, { x: 310, y: height - 210, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.tipo_documento}`, { x: 50, y: height - 290, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.numero_documento}`, { x: 155, y: height - 290, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.dv}`, { x: 250, y: height - 290, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.telefono}`, { x: 310, y: height - 298, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.direccion_notificacion}`, { x: 50, y: height - 330, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.correo_electronico}`, { x: 50, y: height - 380, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.numero_placa}`, { x: 320, y: height - 380, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.marca_vehiculo}`, { x: 420, y: height - 380, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.modelo_vehiculo}`, { x: 50, y: height - 410, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.clase_vehiculo}`, { x: 320, y: height - 410, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`${prevcart.observaciones}`, { x: 50, y: height - 490, size: 11, color: rgb(0, 0, 0) });
    page.drawText(`  ${finalTotal.toLocaleString('es-CO')}`, { x: 320, y: height - 450, size: 12, color: rgb(0, 0, 0) });

    // Crear PDF final
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  const descargarPDF = async () => {
    const blob = await fetch(pdfUrl).then(res => res.blob());
    download(blob, 'factura-generada.pdf', 'application/pdf');
  };

  return (
    <div className="container mt-4">
      <button onClick={generarFactura} className="btn btn-outline-primary me-2">
        Generar Factura
      </button>

      {pdfUrl && (
        <>
          <iframe src={pdfUrl} width="100%" height="500px" className="my-3 border rounded" />
          <button onClick={descargarPDF} className="btn btn-success">
            Descargar PDF
          </button>
        </>
      )}
    </div>
  );
};

export default PdfPreview;

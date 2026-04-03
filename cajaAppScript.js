function doPost(e) {
  const ss = SpreadsheetApp.openById('18iAYNwCdkJ_DvkvDiOcEOw1nXJfxWHYNzAQKxSf7f0g');
  let sheet = ss.getSheetByName('OperativaDiaria');

  // Si la hoja no existe, la buscamos por nombre ignorando mayúsculas 
  if (!sheet) {
    const sheets = ss.getSheets();
    sheet = sheets.find(s => s.getName().toLowerCase() === 'OperativaDiaria');
  }

  let data = {};
  try {
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
  } catch (err) {
    // Si falla el parseo, intentamos seguir con lo que haya
  }

  // Si no hay datos, terminamos con error descriptivo pero controlado
  if (!data || Object.keys(data).length === 0) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'No se recibieron datos en el POST' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Columnas: Fecha | Tipo (Apertura/Cierre) | Wallet | Efectivo | Observaciones
    sheet.appendRow([
      data.fecha || new Date().toLocaleDateString('es-AR'),
      data.tipo || 'N/A',
      Number(data.wallet) || 0,
      Number(data.efectivo) || 0,
      data.observaciones || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: 'Fila agregada correctamente' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

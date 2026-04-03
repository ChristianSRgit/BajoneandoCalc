function doPost(e) {

    Logger.log('EVENTO COMPLETO');
    Logger.log(e);
  
    Logger.log('POST DATA');
    Logger.log(e.postData);
  
    Logger.log('POST CONTENTS');
    Logger.log(e.postData && e.postData.contents);
  
    Logger.log('PARAMETER');
    Logger.log(e.parameter);
  
    const sheet = SpreadsheetApp
      .openById('1Q30ZgLUAcwRPXma1PQIOO4kgEsPCsE83LxNYPcpwed0')
      .getSheetByName('VentasWpp');
  
    if (!sheet) {
      throw new Error('La hoja VentasWpp no existe');
    }
  
    let data = {};
  
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      }
    } catch (err) {}
  
    if (!data || Object.keys(data).length === 0) {
      data = e.parameter;
    }
  
    sheet.appendRow([
      data.nroPedido || '',
      data.fecha || '',
      data.canal || '',
      Number(data.cantidadHamburguesas) || 0,
      data.productos || '',
      Number(data.montoBruto) || 0,
      Number(data.montoNeto) || 0,
      data.metodoDePago || ''
    ]);
  
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
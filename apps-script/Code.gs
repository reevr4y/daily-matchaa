// ─────────────────────────────────────────────────────────────────────────────
// Daily Life Tracker — Google Apps Script v3
// Deploy as Web App: Execute as Me, Access: Anyone
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAMES = ['tasks', 'expenses', 'pap', 'streak'];

const HEADERS = {
  tasks:    ['id', 'title', 'status', 'date'],
  expenses: ['id', 'name', 'amount', 'date'],
  pap:      ['id', 'date', 'status', 'timestamp', 'photo_url'],
  streak:   ['date', 'streak_count', 'pap_done'],
};

// ── Google Drive folder for PAP photos ───────────────────────────────────────
const PAP_FOLDER_NAME = 'DailyLifeTracker_PAP';

function getPapFolder() {
  const folders = DriveApp.getFoldersByName(PAP_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(PAP_FOLDER_NAME);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

// ── GET handler (handles both reads AND writes via query params) ───────────────
function doGet(e) {
  const action    = e.parameter.action || 'read';
  const sheetName = e.parameter.sheet;

  // Special action: upload photo
  if (action === 'upload_photo') {
    return handlePhotoUploadGet(e);
  }

  if (!SHEET_NAMES.includes(sheetName)) {
    return jsonResponse({ error: 'Invalid sheet: ' + sheetName });
  }

  const sheet   = getSheet(sheetName);
  const headers = HEADERS[sheetName];

  // ── READ ──────────────────────────────────────────────────────────────────
  if (action === 'read') {
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1).filter(row => row[0]);
    const result = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
    return jsonResponse(result);
  }

  // ── INSERT ────────────────────────────────────────────────────────────────
  if (action === 'insert') {
    try {
      const data = JSON.parse(e.parameter.data);
      const row  = headers.map(h => data[h] !== undefined ? data[h] : '');
      sheet.appendRow(row);
      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ error: 'Insert failed: ' + err.message });
    }
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  if (action === 'update') {
    try {
      const data    = JSON.parse(e.parameter.data);
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]) === String(data.id)) {
          headers.forEach((h, idx) => {
            if (data[h] !== undefined) {
              sheet.getRange(i + 1, idx + 1).setValue(data[h]);
            }
          });
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse({ error: 'Not found' });
    } catch (err) {
      return jsonResponse({ error: 'Update failed: ' + err.message });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    try {
      const data    = JSON.parse(e.parameter.data);
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]) === String(data.id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse({ error: 'Not found' });
    } catch (err) {
      return jsonResponse({ error: 'Delete failed: ' + err.message });
    }
  }

  return jsonResponse({ error: 'Unknown action: ' + action });
}

// ── Photo upload via GET (base64 in query param) ─────────────────────────────
function handlePhotoUploadGet(e) {
  try {
    const base64Data = e.parameter.photo;
    const date       = e.parameter.date || new Date().toISOString().slice(0, 10);
    const mimeType   = e.parameter.mime || 'image/jpeg';

    if (!base64Data) {
      return jsonResponse({ error: 'No photo data provided' });
    }

    const blob     = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, 'pap_' + date + '.jpg');
    const folder   = getPapFolder();
    const file     = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId   = file.getId();
    const photoUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800';

    return jsonResponse({ success: true, photo_url: photoUrl, file_id: fileId });
  } catch (err) {
    return jsonResponse({ error: 'Photo upload failed: ' + err.message });
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    let payload;
    
    // ── Handle different content types (Simple requests vs JSON) ──────────────
    if (e.postData && e.postData.type === 'application/json') {
      payload = JSON.parse(e.postData.contents);
    } else {
      // Fallback: try to get from e.parameter (for application/x-www-form-urlencoded)
      // or try to parse postData.contents as JSON anyway
      payload = e.parameter;
      if (!payload.action && e.postData && e.postData.contents) {
        try { payload = JSON.parse(e.postData.contents); } catch(x) {}
      }
    }

    const { action, sheet: sheetName, data: rawData } = payload;
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    // Special action: upload photo via POST (for larger files)
    if (action === 'upload_photo') {
      return handlePhotoUploadPost(payload);
    }

    if (!SHEET_NAMES.includes(sheetName)) {
      return jsonResponse({ error: 'Invalid sheet' });
    }

    const sheet   = getSheet(sheetName);
    const headers = HEADERS[sheetName];

    if (action === 'insert') {
      const row = headers.map(h => data[h] !== undefined ? data[h] : '');
      sheet.appendRow(row);
      return jsonResponse({ success: true });
    }

    if (action === 'update') {
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]) === String(data.id)) {
          headers.forEach((h, idx) => {
            if (data[h] !== undefined) sheet.getRange(i + 1, idx + 1).setValue(data[h]);
          });
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse({ error: 'Not found' });
    }

    if (action === 'delete') {
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]) === String(data.id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse({ error: 'Not found' });
    }

    return jsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── Photo upload via POST (handles larger payloads) ──────────────────────────
function handlePhotoUploadPost(payload) {
  try {
    const photo    = payload.photo;
    const dateStr  = payload.date || new Date().toISOString().slice(0, 10);
    const mimeType = payload.mime || 'image/jpeg';

    if (!photo) {
      return jsonResponse({ error: 'No photo data provided (Payload empty)' });
    }

    // Clean up base64 if it has prefix (should be handled by client, but let's be safe)
    let cleanBase64 = photo;
    if (photo.indexOf(',') > -1) cleanBase64 = photo.split(',')[1];

    const blob     = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType, 'pap_' + dateStr + '.jpg');
    const folder   = getPapFolder();
    const file     = folder.createFile(blob);
    
    // Set sharing and wait a tiny bit to ensure Google Index catches up
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Utilities.sleep(200); 

    const fileId   = file.getId();
    const photoUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800';

    return jsonResponse({ success: true, photo_url: photoUrl, file_id: fileId });
  } catch (err) {
    return jsonResponse({ error: 'GAS Photo upload failed: ' + err.toString() });
  }
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

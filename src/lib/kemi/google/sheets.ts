import { getSheetsClient } from "./auth";

export async function getSheetValues(
  spreadsheetId: string,
  range: string,
) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return {
    values: res.data.values || [],
    rows: (res.data.values || []).length,
  };
}

export async function updateSheetValues(
  spreadsheetId: string,
  range: string,
  values: unknown[][],
) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
  return {
    updatedCells: res.data.updatedCells || 0,
    updatedRange: res.data.updatedRange || "",
  };
}

export async function appendRows(
  spreadsheetId: string,
  range: string,
  rows: unknown[][],
) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
  return {
    updatedRows: rows.length,
    updatedRange: res.data.updates?.updatedRange || "",
  };
}

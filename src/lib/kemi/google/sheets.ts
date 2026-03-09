import { getSheetsClient, type GoogleAccount } from "./auth";

export async function getSheetValues(
  spreadsheetId: string,
  range: string,
  account: GoogleAccount = "business",
) {
  const sheets = getSheetsClient(account);
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
  account: GoogleAccount = "business",
) {
  const sheets = getSheetsClient(account);
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
  account: GoogleAccount = "business",
) {
  const sheets = getSheetsClient(account);
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

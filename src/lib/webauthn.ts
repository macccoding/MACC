export const rpName = "MikeOS";
export const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
export const origin = process.env.WEBAUTHN_ORIGIN || `http://${rpID}:3000`;

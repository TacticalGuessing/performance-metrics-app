// src/lib/authUtils.js
import * as jose from 'jose'; // Using jose for verification (Edge compatible)

// --- JWT Secret Setup and Validation ---
// This runs once when the module is first imported by the server.
const JWT_SECRET_STRING_FOR_VERIFY = process.env.JWT_SECRET;
let JWT_SECRET_UINT8ARRAY_FOR_VERIFY;

if (!JWT_SECRET_STRING_FOR_VERIFY || JWT_SECRET_STRING_FOR_VERIFY.length < 32) {
    const errorMsg = "FATAL ERROR IN AUTH UTILS: JWT_SECRET is not defined or is too short in .env.local. Must be at least 32 characters for security.";
    console.error(errorMsg);
    // JWT_SECRET_UINT8ARRAY_FOR_VERIFY will remain undefined.
    // verifyToken will then fail gracefully.
    // For a production app, you might throw an error here to prevent startup with an insecure/missing secret.
    // throw new Error(errorMsg); 
} else {
    try {
        JWT_SECRET_UINT8ARRAY_FOR_VERIFY = new TextEncoder().encode(JWT_SECRET_STRING_FOR_VERIFY);
        console.log("AUTH UTILS: JWT_SECRET loaded and encoded successfully for jose verification.");
    } catch (e) {
        console.error("AUTH UTILS: Error encoding JWT_SECRET_STRING into Uint8Array:", e);
        // JWT_SECRET_UINT8ARRAY_FOR_VERIFY will remain undefined.
    }
}
// --- End JWT Secret Setup ---


export async function verifyToken(token) {
  console.log("--- verifyToken called (authUtils.js) ---");
  console.log("Token received by verifyToken:", token ? `Exists (length ${token.length})` : "MISSING");
  console.log("JWT_SECRET_STRING_FOR_VERIFY in verifyToken scope:", JWT_SECRET_STRING_FOR_VERIFY ? `Exists (length ${JWT_SECRET_STRING_FOR_VERIFY.length})` : "MISSING or empty");
  console.log("JWT_SECRET_UINT8ARRAY_FOR_VERIFY in verifyToken scope:", JWT_SECRET_UINT8ARRAY_FOR_VERIFY ? `Exists (byteLength ${JWT_SECRET_UINT8ARRAY_FOR_VERIFY.byteLength})` : "MISSING or not encoded");

  if (!token) {
    console.warn("verifyToken: No token provided to verify.");
    return null;
  }
  if (!JWT_SECRET_UINT8ARRAY_FOR_VERIFY || JWT_SECRET_UINT8ARRAY_FOR_VERIFY.byteLength === 0) { 
    console.error("verifyToken: Aborting verification. JWT_SECRET_UINT8ARRAY_FOR_VERIFY is not valid (check .env.local and server restart).");
    return null;
  }
  
  try {
    const { payload } = await jose.jwtVerify(
        token, 
        JWT_SECRET_UINT8ARRAY_FOR_VERIFY,
        { algorithms: ['HS256'] } // Assuming HS256 was used for signing by 'jsonwebtoken'
    );
    console.log("Token verified successfully by jose. Payload:", payload.email, "Role:", payload.role); // Log some payload data
    return payload; // payload contains userId, email, role etc.
  } catch (error) {
    // Log common JWT errors from 'jose'
    if (error.code === 'ERR_JWT_EXPIRED') console.warn('JWT Verification error (jose): Token expired.');
    else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') console.warn('JWT Verification error (jose): Signature verification failed. Check JWT_SECRET consistency between signing and verification, and algorithms.');
    else if (error.code === 'ERR_JWS_INVALID') console.warn('JWT Verification error (jose): JWS is invalid (malformed token).');
    else if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') console.warn('JWT Verification error (jose): Claim validation failed (e.g. nbf, exp).', error.claim, error.reason);
    else console.warn('JWT Verification error (jose) - Other:', error.message, error.code);
    return null; 
  }
}

export function getTokenFromRequest(request) {
    // For Next.js App Router API Routes (request is NextRequest)
    // and Middleware (request is NextRequest)
    const cookieStore = request.cookies;
    const token = cookieStore.get('authToken')?.value;
    // console.log("getTokenFromRequest: Extracted token from cookie ->", token ? "Token found" : "No token found");
    return token;
}
import axios from "axios";

const getWhatsAppApiConfig = () => {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const token = process.env.META_WA_TOKEN;

  if (!phoneNumberId || !token) {
    console.error("Meta WhatsApp credentials are not configured in environment variables.");
    throw new Error("Meta WhatsApp credentials not configured");
  }

  return {
    url: `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

/**
 * Normalizes phone numbers to a digits-only format containing the country code.
 * (e.g., 923001234567)
 * @param {string} phone 
 * @returns {string}
 */
export const normalizePhone = (phone) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Handle local Pakistani format (e.g., 03001234567 -> 923001234567)
  if (digits.startsWith("0") && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }

  // Handle cases where country code is missing for standard 10-digit number
  if (digits.length === 10) {
    return `92${digits}`;
  }

  return digits;
};

/**
 * Sends a text message to a WhatsApp number.
 * @param {string} to 
 * @param {string} textMessage 
 * @returns {Promise<Object>} API response data
 */
export const sendWhatsAppTextMessage = async (to, textMessage) => {
  const formattedTo = normalizePhone(to);
  if (!formattedTo) {
    throw new Error("Invalid recipient phone number");
  }

  const { url, headers } = getWhatsAppApiConfig();
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedTo,
    type: "text",
    text: {
      body: textMessage,
    },
  };

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp text message:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Sends a PDF document to a WhatsApp number.
 * @param {string} to 
 * @param {string} pdfUrl 
 * @param {string} fileName 
 * @param {string} caption 
 * @returns {Promise<Object>} API response data
 */
export const sendWhatsAppPdfDocument = async (to, pdfUrl, fileName, caption) => {
  const formattedTo = normalizePhone(to);
  if (!formattedTo) {
    throw new Error("Invalid recipient phone number");
  }

  const { url, headers } = getWhatsAppApiConfig();
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedTo,
    type: "document",
    document: {
      link: pdfUrl,
      filename: fileName || "Prescription.pdf",
      caption: caption || "Your official medical prescription from MediMate.",
    },
  };

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp PDF document:",
      error.response?.data || error.message
    );
    throw error;
  }
};

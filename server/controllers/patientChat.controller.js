const PATIENT_CHAT_DISABLED_MESSAGE =
  "Patient-doctor chat is currently disabled. We are building it and it is coming soon.";

const sendDisabledResponse = (res) =>
  res.status(503).json({ message: PATIENT_CHAT_DISABLED_MESSAGE });

export const listDoctorPatientChats = async (req, res) => {
  return sendDisabledResponse(res);
};

export const getDoctorPatientChat = async (req, res) => {
  return sendDisabledResponse(res);
};

export const sendDoctorPatientChatMessage = async (req, res) => {
  return sendDisabledResponse(res);
};

export const getPatientChat = async (req, res) => {
  return sendDisabledResponse(res);
};

export const sendPatientChatMessage = async (req, res) => {
  return sendDisabledResponse(res);
};

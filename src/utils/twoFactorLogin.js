import { applyLoginSession } from "./loginSession";

const pendingKey = "pendingAuthenticatorLogin";

export const isTwoFactorApplicable = (responseData) => {
  const role = String(responseData?.role || "").trim().toLowerCase();
  return responseData?.status === "Success" && role && role !== "student";
};

export const savePendingAuthenticatorLogin = (responseData, options = {}) => {
  sessionStorage.setItem(pendingKey, JSON.stringify({
    responseData,
    options,
    savedAt: Date.now()
  }));
};

export const readPendingAuthenticatorLogin = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(pendingKey) || "{}");
    return parsed?.responseData ? parsed : null;
  } catch {
    return null;
  }
};

export const clearPendingAuthenticatorLogin = () => {
  sessionStorage.removeItem(pendingKey);
};

export const continueAfterPrimaryLogin = async (responseData, navigate, options = {}) => {
  if (isTwoFactorApplicable(responseData)) {
    savePendingAuthenticatorLogin(responseData, options);
    navigate("/authenticator-setup");
    return null;
  }
  const destination = await applyLoginSession(responseData, options);
  navigate(destination);
  return destination;
};

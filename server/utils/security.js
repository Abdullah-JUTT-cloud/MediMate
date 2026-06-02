const DEFAULT_COOKIE_MAX_AGE = 15 * 24 * 60 * 60 * 1000;

export const getCookieOptions = (maxAge = DEFAULT_COOKIE_MAX_AGE) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

export const getClearCookieOptions = () => {
  const { maxAge, ...options } = getCookieOptions(0);
  return options;
};

export const createUnsafeRequestOriginGuard = (allowedOrigins) => {
  const trustedOrigins = new Set((allowedOrigins || []).filter(Boolean));
  const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  return (req, res, next) => {
    if (!unsafeMethods.has(req.method)) return next();

    const origin = req.get("origin");
    const referer = req.get("referer");
    const refererOrigin = referer ? safeOrigin(referer) : "";
    const requestOrigin = origin || refererOrigin;

    if (requestOrigin && trustedOrigins.has(requestOrigin)) {
      return next();
    }

    if (!requestOrigin && process.env.NODE_ENV !== "production") {
      return next();
    }

    return res.status(403).json({ message: "Untrusted request origin" });
  };
};

const safeOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

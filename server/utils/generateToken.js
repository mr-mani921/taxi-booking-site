const generateToken = (user, message, statusCode) => {
  const token = user.generateJWTToken();

  // Create cookie options object
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRY * 24 * 60 * 60 * 1000
    ),
  };

  // Return token and cookie information instead of sending response
  return {
    token,
    cookieName: user.role === "admin" ? "adminToken" : "userToken",
    cookieOptions,
    message,
    statusCode,
  };
};

module.exports = generateToken;

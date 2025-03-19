const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJWTToken();

  let cookieName = user.role === "admin" ? "adminToken" : "userToken";

  res.cookie(cookieName, token, {
    httpOnly: true, 
    secure: true, 
    sameSite: "None",
    path: "/",
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRY * 24 * 60 * 60 * 1000),
  });

  res.status(statusCode).json({
    success: true,
    message,
    user,
    token, 
  });
};

export default generateToken;
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface SuperRequest extends Request {
  isAuth: boolean;
  userId: string | undefined;
}

interface VerifiedToken {
  userId?: string;
  userEmail?: string;
}

export default (
  req: any,
  res: Response<any, Record<string, any>>,
  next: NextFunction
) => {
  let accessToken = req.cookies.access_token;
  if (!accessToken) {
    req.isAuth = false;
    return next();
  }
  let csrfToken = req.get("csrf_token");
  if (!csrfToken) {
    req.isAuth = false;
    return next();
  }
  let verifiedAccessToken: VerifiedToken | string;
  let verifiedCsrfToken: VerifiedToken | string;
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.CSRF_TOKEN_SECRET) {
    return res.sendStatus(500);
  }
  try {
    verifiedAccessToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    verifiedCsrfToken = jwt.verify(csrfToken, process.env.CSRF_TOKEN_SECRET);
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!verifiedAccessToken || !verifiedCsrfToken) {
    req.isAuth = false;
    return next();
  }
  if (
    typeof verifiedAccessToken === "object" &&
    typeof verifiedCsrfToken === "object"
  ) {
    req.userId = verifiedAccessToken.userId;
  }
  req.isAuth = true;
  next();
};

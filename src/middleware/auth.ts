import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface SuperRequest extends Request {
  isAuth: boolean;
  userId: string | undefined;
}

interface VerifiedToken {
  userId?: string;
}

export default (
  req: any,
  res: Response<any, Record<string, any>>,
  next: NextFunction
) => {
  let token = req.get("Authorization");
  if (!token) {
    req.isAuth = false;
    return next();
  }
  token = token?.split(" ")[1];
  let verifiedToken: VerifiedToken | string;
  try {
    verifiedToken = jwt.verify(token!, "fh23$rfcow0s!f9ewnd63@");
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!verifiedToken) {
    req.isAuth = false;
    return next();
  }
  if (typeof verifiedToken === "object") {
    req.userId = verifiedToken.userId;
  }
  req.isAuth = true;
  next();
};

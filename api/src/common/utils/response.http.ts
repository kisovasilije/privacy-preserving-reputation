import { Response } from 'express';

export const ok = (res: Response, data: unknown) => {
  return res.status(200).json(data);
};

export const created = <T>(res: Response, data?: T) => {
  return res.status(201).json(data);
};

export const badRequest = (res: Response, message: string) => {
  return res.status(400).json({ message });
};

export const unauthorized = (res: Response, message: string) => {
  return res.status(401).json({ message });
};

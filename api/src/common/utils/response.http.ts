import { Response } from 'express';

export const ok = <TValue = unknown>(res: Response<TValue>, data: TValue) => {
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

export const forbidden = (res: Response, message: string) => {
  return res.status(403).json({ message });
};

export const notFound = (res: Response, message: string) => {
  return res.status(404).json({ message });
};

export const conflict = (res: Response, message: string) => {
  return res.status(409).json({ message });
};

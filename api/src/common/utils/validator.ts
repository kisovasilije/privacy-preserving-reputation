import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

export function withBodyV2<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  handler: (req: Request, res: Response, body: z.infer<TSchema>) => Promise<Response | void> | void,
): RequestHandler {
  return async (req, res) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: parseResult.error.issues.map(issue => ({ message: issue.message, path: issue.path.join('.') })),
      });
    }

    await handler(req, res, parseResult.data);
  };
}

export function withBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  handler: (req: Request, res: Response) => Promise<Response | void> | void,
): RequestHandler {
  return async (req, res) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: parseResult.error.issues.map(issue => ({ message: issue.message, path: issue.path.join('.') })),
      });
    }

    await handler(req, res);
  };
}

export function validate<
  TSchema extends z.ZodTypeAny,
  TProperty extends keyof Pick<Request, 'body' | 'params' | 'query'>,
>(schema: TSchema, property: TProperty) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req[property]);
    if (!parseResult.success) {
      return res.status(422).json({
        message: `Invalid request ${property}`,
        errors: parseResult.error.issues.map(issue => ({ message: issue.message, path: issue.path.join('.') })),
      });
    }

    next();
  };
}

import { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

export function withBodyV2<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  handler: (req: Request, res: Response, body: z.infer<TSchema>) => Promise<Response | void> | void,
): RequestHandler {
  return async (req, res) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
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
      return res.status(400).json({
        message: 'Invalid request body',
        errors: parseResult.error.issues.map(issue => ({ message: issue.message, path: issue.path.join('.') })),
      });
    }

    await handler(req, res);
  };
}

// import z from 'zod';
// import { Request, Response, NextFunction } from 'express';

// export function validate<
//   TSchema extends z.ZodTypeAny,
//   TProperty extends keyof Pick<Request, 'body' | 'params' | 'query'>,
// >(schema: TSchema, property: TProperty) {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     const parseResult = schema.safeParse(req[property]);
//     if (!parseResult.success) {
//       return res.status(422).json({
//         message: `Invalid request ${property}`,
//         errors: parseResult.error.issues.map(issue => ({ message: issue.message, path: issue.path.join('.') })),
//       });
//     }

//     next();
//   };
// }

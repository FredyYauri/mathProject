import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

interface Schemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

// Valida y reemplaza body/params/query por la versión parseada (con defaults y
// coerciones aplicadas). Lanza ZodError -> lo captura errorHandler como 400.
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ZodTypeAny.parse is generically `any`; runtime shape is guaranteed by the schema itself
    if (schemas.body) req.body = schemas.body.parse(req.body);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (schemas.params) req.params = schemas.params.parse(req.params);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (schemas.query) req.query = schemas.query.parse(req.query);
    next();
  };
}

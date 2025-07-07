import { Router, Request, Response } from 'express';

const routes = Router();

routes.get('/', async (req: Request, res: Response) => {
  res.send({ status: true, msg: '3 Card Judgement Mini Game Testing Successfully 👍' });
});

export { routes };

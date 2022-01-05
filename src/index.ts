import 'dotenv/config';
import 'reflect-metadata';
import express, { Request, Response } from 'express';
import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server-express';
import { UserResolver } from './resolvers/user-resolvers';
import { createConnection } from 'typeorm';
import cookieParser from 'cookie-parser';
import { verify } from 'jsonwebtoken';
import { User } from './entity/User';
import { sendRefreshToken } from './utils/sendRefreshToken';
import { createAccessToken, createRefreshToken } from './utils/auth';

(async () => {
  const app = express();
  app.use(cookieParser());
  app.get('/', (_req: Request, res: Response) => {
    res.send({
      message: 'hello muthafucker!',
    });
  });

  app.post('/refresh_token', async (req: Request, res: Response) => {
    const token = req.cookies.jid;

    if (!token) {
      return res.send({ ok: false, accessToken: '' });
    }

    let payload: any = null;

    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (error) {
      console.log(error);
      return res.send({
        ok: false,
        accessToken: '',
        errorMessage: 'you are not authorized',
      });
    }

    // when token is valid
    // we can actually send back an access token
    const user = await User.findOne({ id: payload.userId });

    if (!user) {
      return res.send({
        ok: false,
        accessToken: '',
        errorMessage: 'there is no user logged in at the moment',
      });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: '' });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  await createConnection();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('express server run in port:4000');
  });
})();

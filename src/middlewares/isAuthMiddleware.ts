import { verify } from 'jsonwebtoken';
import { MyContext } from 'src/my-context';
import { MiddlewareFn } from 'type-graphql';

// user must send header authorization: bearer ... token ...

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  const authorization = context.req.headers['authorization'];

  if (!authorization) {
    throw new Error('you are not authenticated!');
  }

  try {
    const token = authorization.split(' ')[1]; // parsing token
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    context.payload = payload as any;
  } catch (error) {
    throw new Error(
      `something is wrong, you are not authenticated \err: ${error}`
    );
  }

  return next();
};

import {
  Arg,
  Ctx,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { compare, hash } from 'bcryptjs';
import { User } from '../entity/User';
import { MyContext } from '../my-context';
import { createAccessToken, createRefreshToken } from '../utils/auth';
import { isAuth } from '../middlewares/isAuthMiddleware';
import { sendRefreshToken } from '../utils/sendRefreshToken';
import { getConnection } from 'typeorm';
import { verify } from 'jsonwebtoken';

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;

  @Field()
  loggedIn: string;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return 'hi!';
  }

  @Query(() => String)
  @UseMiddleware(isAuth) // passing a func for checking whether the user has an access
  bye(@Ctx() { payload }: MyContext) {
    console.log(payload);
    return `your user id is: ${payload!.userId}`; // protected route
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() context: MyContext) {
    const authorization = context.req.headers['authorization'];

    if (!authorization) {
      return null;
    }

    try {
      const token = authorization.split(' ')[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return User.findOne(payload.userId);
    } catch (err) {
      return null;
    }
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string
  ) {
    const hashedPassword = await hash(password, 12);

    try {
      await User.insert({
        email,
        password: hashedPassword,
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokenForUser(@Arg('userId', () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, 'tokenVersion', 1);

    return {
      success: true,
      success_message: 'revoked all the token cookies successfully',
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, '');

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string, // args => email
    @Arg('password') password: string, // args => password
    @Ctx() { res }: MyContext // args => context
  ): Promise<LoginResponse> {
    // get user data based on email
    const user = await User.findOne({
      where: { email },
    });

    // if there is no user return error
    if (!user) {
      throw new Error('invalid login credentials');
    }

    // compare the password ==> boolean
    const valid = await compare(password, user.password);

    // if the validation of password return false
    if (!valid) {
      throw new Error('invalid password! try again');
    }

    // refresh token ===> cookie
    // when user hasn't logged in for some amount of time
    // it will be log out
    sendRefreshToken(res, createRefreshToken(user));

    // log in successfully
    return {
      loggedIn: `successfully logged in as ${user.email}`,
      accessToken: createAccessToken(user),
    };
  }
}

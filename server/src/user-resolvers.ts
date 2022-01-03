import {
  Arg,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { User } from './entity/User';

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

  @Query(() => [User])
  users() {
    return User.find();
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

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string
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

    // log in successfully
    return {
      loggedIn: `successfully logged in as ${user.email}`,
      accessToken: sign(
        {
          userId: user.id,
        },
        'envuzgvyymfy',
        { expiresIn: '15m' }
      ),
    };
  }
}

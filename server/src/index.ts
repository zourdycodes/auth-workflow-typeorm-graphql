import "reflect-metadata";
import express, { Request, Response } from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./user-resolvers";
import { createConnection } from "typeorm";

(async () => {
  const app = express();

  app.get("/", (_req: Request, res: Response) => {
    res.send({
      message: "hello muthafucker!",
    });
  });

  await createConnection();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("express server run in port:4000");
  });
})();

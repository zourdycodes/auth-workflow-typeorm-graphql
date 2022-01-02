import "reflect-metadata";
import express, { Request, Response } from "express";
import { ApolloServer } from "apollo-server-express";

(async () => {
  const app = express();

  app.get("/", (_req: Request, res: Response) => {
    res.send({
      message: "hello muthafucker!",
    });
  });

  const apolloServer = new ApolloServer({
    typeDefs: `
        type Query {
            hello: String!
        }
      `,
    resolvers: {
      Query: {
        hello: () => "hello world",
      },
    },
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("express server run in port:4000");
  });
})();

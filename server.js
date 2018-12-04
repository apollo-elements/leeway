import express from 'express';
import path from 'path';
import { createServer } from 'http';

import { apolloServer } from './apollo-server';

const port = 8000;
const app = express();
const http = createServer(app);

app.use(express.static('public'));
app.get(/^(?!.*(\.)|(graphi?ql).*)/, (req, res) =>
  res.sendFile(path.resolve('public', 'index.html'))
);

apolloServer.applyMiddleware({ app, path: '/graphql' })

apolloServer.installSubscriptionHandlers(http);

http.listen({ port }, () => {
  console.log(`🚀  Apollo Server at http://localhost:${port}${apolloServer.graphqlPath}`);
})

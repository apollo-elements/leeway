import compression from 'compression';
import express from 'express';
import path from 'path';
import { HTTPS } from 'express-sslify';
import { createServer } from 'http';

import { apolloServer } from './server/apollo-server';

const port = process.env.PORT || 8000;
const url = process.env.URL || `http://localhost:${port}`;
const app = express();
const http = createServer(app);

app.use(compression({ threshold: 0 }));
if (process.env.NODE_ENV === 'production') app.use(HTTPS({ trustProtoHeader: true }));
app.use(express.static('public'));

app.get(/^(?!.*(\.)|(graphi?ql).*)/, (req, res) =>
  res.sendFile(path.resolve('public', 'index.html'))
);

apolloServer.applyMiddleware({ app, path: '/graphql' });

apolloServer.installSubscriptionHandlers(http);

http.listen({ port }, () => {
  console.log(`🚀  Apollo Server at ${url}${apolloServer.graphqlPath}`);
});

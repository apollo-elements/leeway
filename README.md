[`#leeway`](https://leeway.apolloelements.dev) is an example chat PWA that uses `lit-apollo` to make it easier for you to avoid doing actual work. [Source Repository](https://github.com/apollo-elements/leeway)

## Features
- Works offline via Service Worker
- <abbr title="server side rendering">SSR for initial data payload via Apollo Server</abbr>
- Code Splitting with Rollup
- Aggressive minification, including `lit-html` template literals
- CSS-in-CSS ( e.g. `import shared from '../shared-styles.css';`)
- GQL-in-GQL ( e.g. `import query from './my-component-query.graphql';`)
- GraphQL Subscriptions over websocket

[![Lighthouse Scores: 98 (performance), 100 (accessibility), 93 (best practises), 100 (SEO), 12/12 (PWA)](https://user-images.githubusercontent.com/1466420/52176144-5c25f280-27b7-11e9-8e14-290651f98e36.png)](https://github.com/apollo-elements/apollo-elements/files/2825459/lit-apollo-subscriptions.herokuapp.com-20190203T132249.zip)

# Installation
```
npm i
```

# Run Locally
```
npm start
```

# Development Watch
```
npm run watch
```

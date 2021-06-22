# npm dependency server

A web server that provides a basic HTTP api for querying the dependency
tree of an [npm](https://npmjs.org) package.

## Prerequisites

* [Node v12 LTS](https://nodejs.org/download/release/latest-v12.x/)

## Getting Started

To install dependencies and start the server in development mode:

```sh
npm install
npm start
```

The server will now be running on an available port (defaulting to 3000) and
will restart on changes to the src files.

You can run the tests with:

```sh
npm run test

# Or in watch mode
npm run test -- --watch
```

The code is linted via eslint, you can run this via:

```sh
npm run lint
```

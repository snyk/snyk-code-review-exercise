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

Then we can try the `/package` endpoint. Here is an example that uses `curl` and
`jq`, but feel free to use any client.

```sh
curl -s http://localhost:3000/package/react/16.13.0 | jq .
```

Most of the code is boilerplate; the logic for the `/package` endpoint can be
found in [src/package.ts](src/package.ts), and some basic tests in
[test/package.test.ts](test/package.test.ts)

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

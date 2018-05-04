[![npm version](https://badge.fury.io/js/storage-based-queue.svg)](https://badge.fury.io/js/storage-based-queue)
[![Build Status](https://travis-ci.org/atayahmet/storage-based-queue.svg?branch=v0.0.5-beta5)](https://travis-ci.org/atayahmet/storage-based-queue)
[![Coverage Status](https://coveralls.io/repos/github/atayahmet/storage-based-queue/badge.svg?branch=master)](https://coveralls.io/github/atayahmet/storage-based-queue?branch=master)
[![Dependency Status](https://img.shields.io/david/atayahmet/storage-based-queue.svg?style=flat-square)](https://david-dm.org/atayahmet/storage-based-queue)
[![devDependencies Status](https://david-dm.org/atayahmet/storage-based-queue/dev-status.svg)](https://david-dm.org/atayahmet/storage-based-queue?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/atayahmet/storage-based-queue/badge.svg)](https://snyk.io/test/github/atayahmet/storage-based-queue)

# Persistent Queue For Browsers

## Introduction

Storage based queue processing mechanism. Today, many backend technology is a simple derivative of the queuing systems used in the browser environment.

You can run jobs over the channels as asynchronous that saved regularly.

This library just a solution method for some use cases. Today, there are different technologies that fulfill the similar process.

## Installation

```sh
$ npm install storage-based-queue --save
```

**import:**

```javascript
import Queue from "storage-based-queue";
```

## Basic Usage

**Worker class:**

```javascript
class SendMessageWorker {
  handle(message) {
    retry = 5;
    return new Promise((resolve, reject) => {
      const result = someMessageSenderFunc(message);
      if (result) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
}
```

**Register worker:**

```javascript
Queue.workers({ SendMessageWorker });
```

**Create channel:**

```javascript
const queue = new Queue();
const channel = queue.create("send-message");
```

**Add task to channel:**

```javascript
channel
  .add({
    label: "Send message",
    handler: "SendMessageWorker",
    args: "Hello world!",
  })
  .then(result => {
    // do something...
  });
```

**Start queue:**

```javascript
channel.start();
```

That's it!

## Documentaion

[Click for detailed documentation](https://github.com/atayahmet/storage-based-queue/wiki/Quick-Start)

## Tests

```ssh
$ npm test
```

## License

MIT license

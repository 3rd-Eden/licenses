# Licenses

[![Build Status](https://travis-ci.org/3rd-Eden/licenses.png)](https://travis-ci.org/3rd-Eden/licenses)

Licenses.. This is the most painful part about Open Source. There are so many
different licenses and they all have different restrictions. In order to know
the license footprint of your project you need to know how your modules are
licensed. You might be interested in your license footprint because:

- Some licenses might restrict you from selling your code or using it for
  commercial applications.
- There are unlicensed modules released in to npm on a daily basis. Just
  because they are added in the npm registry it doesn't mean that they are Open
  Source and just free to use.
- The code could be proprietary licensed.
- .. and the list goes on and on.

But the biggest problem is figuring out which license a module is actually
using. There are a lot of ways of saying that your code is licensed under MIT.
There are people who rather say licensed under MIT than just stating MIT. So the
way we write which license we use differ but also the location of our licenses.
It can be in the `package.json` hiding in various of properties or specified in
the `README.md` of the project or even a dedicated `LICENSE` file in the
repository.

Now that you've taken the time to read about some of these issues above, you
know why this module exists. It tries to fulfill one simple task. Get a human
readable license from a given node module.

However, this module isn't flawless as it tries to automate a task that usually
requires the interference and intelligence of a human. If you have module that
is incorrectly detected or not detected at all but does have licensing
information publicly available please create an issue about and we'll see if it
can get resolved.

<!-- many thanks stranger <script>alert('thanks')</script> -->

## Installation

The module is released through npm and can therefor be installed using:

```
npm install --save licenses
```

## CLI

There is CLI version of this module available as `licensing` which can be
installed locally using:

```
npm install -g licensing
```

See https://github.com/3rd-Eden/licensing for more information.

## Getting started with the API

The module exposes one single interface for retrieving the packages, which is a
simple exported function:

```js
'use strict';

var licenses = require('licenses');
```

The `licenses` function accepts the following arguments:

- The name of a module or the contents of it's `package.json`. The module name
  is preferred here as the registry contains more information about your package
  than is available in the `package.json` that you write.
- Options, this **optional** argument allows you to configure how the parsing
  works:
  - `registry` A valid npm registry endpoint, defaults to
  `http://registry.nodejitsu.com`
  - `order` The order of which we should attempt to detect licensing
  information. Defaults to: `[npm, github, content]`.
- And as last the callback function which receives an **optional** error or
  undefined as first argument and an `Array` of licenses (as people can dual
  license their code) or undefined.

With this knowledge, we can simply start detecting licensing using:

```js
licenses('primus', function fetched(err, license) {
  console.log(license.join(',')); // MIT
});
```

### License

MIT

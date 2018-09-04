# firefox-narrate-experiment

[![styled with prettier][prettier.icon]][prettier.url]

An experimental add-on to change how Firefox reader mode and narration are presented

## Usage

To get started fork or clone this template and install all the necessary toolchain via [npm][] or [yarn][].

```sh
npm install # or yarn
```

Template is setup such that it includes `run`, `test` and `build` your experiment.

### Run

You can run web-extension by running

```
npm start
```

You can also run with some dev tooling by running

```
npm run dev
```

### Test

You can write test WebExtensions like one in the `test` directory, which will run headless Firefox [Nightly][]

```
npm test
```

### Build

You can build WebExtension by running following command

```
npm run build
```

> **Note**: Will produce zip file in `web-ext-artifacts` directory

[webextension experiments]: https://webextensions-experiments.readthedocs.io/en/latest/index.html
[web-ext]: https://www.npmjs.com/package/web-ext
[libdweb]: https://github.com/mozilla/libdweb
[developer edition]: https://www.mozilla.org/en-US/firefox/channel/desktop/#developer
[nightly]: https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly
[npm]: http://npmjs.com/
[yarn]: http://yarnpkg.com/
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier
[webextensions]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
[install preview]: install.png

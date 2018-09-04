const iconURL = browser.extension.getURL("listen-with-label.svg")
const scriptURL = browser.extension.getURL("src/content-script.js")

const setIcon = async () => {
  await browser.readerIcon.change(iconURL, 52)
}

browser.windows.onCreated.addListener(setIcon)
browser.aboutScripts.register({
  matches: ["about:reader*"],
  js: [{ file: scriptURL }]
})

setIcon()

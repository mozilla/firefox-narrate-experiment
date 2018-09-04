const iconURL = browser.extension.getURL("listen-with-label.svg")

const setIcon = async () => {
  await browser.readerIcon.change(iconURL, 52)
}

browser.windows.onCreated.addListener(setIcon)
setIcon()

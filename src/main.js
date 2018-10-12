browser.narrate.activate({
  iconURL: browser.extension.getURL("listen-with-label.svg"),
  iconWidth: 52,
  popup: {
    iconURL: browser.extension.getURL("listen-without-label.svg"),
    title: "Want to listen instead ?",
    description: "Firefox can read you any page on the internet.",
    primaryButtonLabel: "Listen to this Article",
    secondaryButtonLabel: "Not Now"
  }
})

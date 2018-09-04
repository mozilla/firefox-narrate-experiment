/* global ExtensionAPI:false */
{
  const { classes: Cc, interfaces: Ci, utils: Cu } = Components

  const browsers = function*() {
    const windowMediator = Cc[
      "@mozilla.org/appshell/window-mediator;1"
    ].getService(Ci.nsIWindowMediator)
    const browsers = windowMediator.getEnumerator("navigator:browser")

    while (browsers.hasMoreElements()) {
      const browser = browsers.getNext()
      yield browser
    }
  }

  this.readerIcon = class readerIcon extends ExtensionAPI {
    getAPI(context) {
      return {
        readerIcon: {
          change: async (iconURL, width) => {
            for (const browser of browsers()) {
              const icon = browser.document.getElementById("reader-mode-button")
              icon.style.listStyleImage = `url(${iconURL})`
              icon.style.width = `${width}px`
            }
            return true
          }
        }
      }
    }
    onShutdown(reason) {
      for (const browser of browsers()) {
        const icon = browser.document.getElementById("reader-mode-button")
        icon.removeAttribute("style")
      }
    }
  }
}

{
  const { classes: Cc, interfaces: Ci, utils: Cu } = Components
  const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
  const ANCHOR_SUFFIX = "popupnotificationanchor"
  const ARCHOR_ID = "-notification-icon"
  const ID = "reader-mode-button"
  const POPUP_ID = "narrate-experiment-doorhanger"

  const { ExtensionParent } = Cu.import(
    "resource://gre/modules/ExtensionParent.jsm",
    {}
  )
  const { windowTracker } = ExtensionParent.apiManager.global

  class NarrateActor {
    static spawn(config) {
      const self = new this(config)
      self.init()
      return self
    }
    constructor(config) {
      this.config = config
      this.onOpenWindow = this.onOpenWindow.bind(this)
    }
    init() {
      if (this.config.popup) {
        Services.mm.addMessageListener("Reader:UpdateReaderButton", this)
      }

      windowTracker.addOpenListener(this.onWindowOpened)

      for (const window of windowTracker.browserWindows()) {
        this.onOpenWindow(window)
      }
    }
    exit(reason) {
      windowTracker.removeOpenListener(this.onWindowOpened)
      if (this.config.popup) {
        Services.mm.removeMessageListener("Reader:UpdateReaderButton", this)
      }

      for (const window of windowTracker.browserWindows()) {
        this.resetWindow(window)
      }
    }
    updateIcon(window) {
      const { iconURL, iconWidth } = this.config
      const icon = window.document.getElementById(ID)
      icon.style.listStyleImage = `url(${iconURL})`
      icon.style.width = `${iconWidth}px`
    }
    resetIcon(window) {
      const icon = window.document.getElementById("reader-mode-button")
      icon.removeAttribute("style")
    }
    onOpenWindow(window) {
      this.updateIcon(window)
    }
    receiveMessage(message) {
      switch (message.name) {
        case "Reader:UpdateReaderButton": {
          return this.onReaderButtonUpdate(message)
        }
      }
    }
    onReaderButtonUpdate({ target, data }) {
      if (data.isArticle) {
        this.showPopup(target)
      }
    }
    setPopupAnchor(browser, anchor) {
      browser[`${ID}${ANCHOR_SUFFIX}`] = anchor
    }
    resetPopupAnchor(browser) {
      delete browser[`${ID}${ANCHOR_SUFFIX}`]
    }
    showPopup(browser) {
      const { popup } = this.config
      const document = browser.ownerDocument
      const { PopupNotifications } = document.defaultView
      const anchor = document.getElementById(ID)
      if (anchor) {
        this.setPopupAnchor(browser, anchor)
        const ui = PopupNotifications.show(
          browser,
          POPUP_ID,
          "Need to multi-task or just rest your eyes? Firefox can read webpages to you.",
          ID,
          {
            label: "Listen to this Article",
            accessKey: "D",
            callback() {
              anchor.click()
            }
          },
          [
            {
              label: "Not Now",
              accessKey: "K",
              callback() {
                ui.remove()
              }
            }
          ],
          {
            popupIconURL: popup.iconURL
          }
        )
      }
    }
    resetWindow(window) {
      this.resetIcon(window)
      if (this.config.popup) {
        const browser = window.gBrowser.selectedBrowser
        this.resetPopupAnchor(browser)
      }
    }
  }

  this.readerIcon = class readerIcon extends ExtensionAPI {
    getAPI(context) {
      return {
        readerIcon: {
          activate: async config => {
            this.actor = NarrateActor.spawn(config)
          },
          showDoorHanger: async iconURL => {
            for (const browser of browsers()) {
              const anchor = browser.document.getElementById(ID)
              const selectedBrowser = browser.gBrowser.selectedBrowser

              if (anchor) {
                selectedBrowser[`${ID}${ANCHOR_SUFFIX}`] = anchor

                const notification = window.PopupNotifications.show(
                  browser,
                  POPUP_ID,
                  "Need to multi-task or just rest your eyes? Firefox can read webpages to you.",
                  ID,
                  {
                    label: "Listen to this Article",
                    accessKey: "D",
                    callback() {
                      browser.document.getElementById(ID).click()
                    }
                  },
                  [
                    {
                      label: "Not Now",
                      accessKey: "K",
                      callback() {
                        notification.remove()
                      }
                    }
                  ],
                  {
                    popupIconURL: iconURL,
                    persistWhileVisible: false,
                    dismissed: false
                  }
                )
              }
            }
          }
        }
      }
    }
    onShutdown(reason) {
      if (this.actor) {
        this.actor.exit(reason)
        delete this.actor
      }
    }
  }
}

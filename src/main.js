class Feature {
  static activate(studyInfo) {
    switch (studyInfo.variation.name) {
      case "feature-active": {
        browser.narrate.activate({
          iconURL: browser.extension.getURL("listen-with-label.svg"),
          iconWidth: 50,
          popup: {
            iconURL: browser.extension.getURL("listen-without-label-grey.svg"),
            title: "Want to listen instead ?",
            description: "Firefox can read you any page on the internet.",
            primaryButtonLabel: "Listen to this Article",
            secondaryButtonLabel: "Not Now"
          }
        })
        return new Feature(true)
      }
      case "feature-passive": {
        browser.narrate.activate({
          iconURL: browser.extension.getURL("listen-with-label.svg"),
          iconWidth: 50
        })
        return new Feature(true)
      }
      default: {
        return new Feature(false)
      }
    }
  }
  constructor(isActive) {
    this.isActive = isActive
    this.state = this.readState()
    this.ports = new Set()
    this.onReceive = this.onReceive.bind(this)
    this.onDisconnect = this.onDisconnect.bind(this)
    this.onConnect = this.onConnect.bind(this)
    browser.runtime.onConnect.addListener(this.onConnect)
  }
  async readState() {
    const state = await browser.storage.sync.get(["displaySurvey"])
    if (state.displaySurvey == null) {
      state.displaySurvey = true
    }
    return state
  }
  deactivate() {
    browser.narrate.deactivate()
    this.onConnect.removeListener(this.onConnect)
    for (const port of this.ports) {
      port.removeListener(this.onReceive)
      port.disconnect()
    }
  }
  onReceive(message, port) {
    if (message.type === "launch-survey") {
      this.displaySurvey()
    } else {
      const payload = {
        message: "narrate-playback",
        tab: `${port.sender.tab.id}`,
        duration: `${message.duration}`,
        stopReason: message.reason
      }

      browser.study.sendTelemetry(payload)
    }
  }
  onDisconnect(port) {
    this.ports.delete(port)
  }
  async onConnect(port) {
    if (this.isActive) {
      this.ports.add(port)
      port.onMessage.addListener(this.onReceive)
      port.onDisconnect.addListener(this.onDisconnect)
      const state = await this.state
      port.postMessage({ type: "init", state })
    } else {
      port.disconnect()
    }
  }
  displaySurvey() {
    // don't await since we don't really care.
    browser.storage.sync.set(this.state)
    this.state = { displaySurvey: false }
    for (const port of connections) {
      port.postMessage({ type: "disable-survey" })
    }
  }
}

class StudyLifeCycleHandler {
  constructor() {
    /*
     * IMPORTANT:  Listen for `onEndStudy` before calling `browser.study.setup`
     * because:
     * - `setup` can end with 'ineligible' due to 'allowEnroll' key in first session.
     *
     */
    this.handleStudyEnding = this.handleStudyEnding.bind(this)
    this.enableFeature = this.enableFeature.bind(this)

    browser.study.onEndStudy.addListener(this.handleStudyEnding)
    browser.study.onReady.addListener(this.enableFeature)
  }
  async cleanup() {
    const { feature } = this
    if (feature) {
      feature.deactivate()
    }
  }
  async enableFeature(studyInfo) {
    await browser.study.logger.log(["Enabling experiment", studyInfo])
    this.feature = Feature.activate(studyInfo)
  }
  async handleStudyEnding(ending) {
    await browser.study.logger.log([`Study wants to end:`, ending])
    for (const url of ending.urls) {
      await browser.tabs.create({ url })
    }

    switch (ending.endingName) {
      // could have different actions depending on positive / ending names
      default:
        await browser.study.logger.log(`The ending: ${ending.endingName}`)
        await this.cleanup()
        break
    }
    // actually remove the addon.
    await browser.study.logger.log("About to actually uninstall")
    return browser.management.uninstallSelf()
  }
}

const main = async () => {
  const studyHandler = new StudyLifeCycleHandler()
  const studySetup = await getStudySetup()
  await browser.study.logger.log(["Study setup: ", studySetup])
  await browser.study.setup(studySetup)
}

main()

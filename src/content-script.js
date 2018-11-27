class NarrateExperiment {
  static spawn() {
    console.log("spawn", document.readyState)
    const self = new this()
    self.init()
    return self
  }
  init() {
    this.startTime = null
    this.onReceive = this.onReceive.bind(this)
    this.onDisconnect = this.onDisconnect.bind(this)
    this.onMutation = this.onMutation.bind(this)

    this.port = browser.runtime.connect()
    this.port.onDisconnect.addListener(this.onDisconnect)
    this.port.onMessage.addListener(this.onReceive)
    if (this.isReaderReady()) {
      this.onReaderLoaded()
    } else {
      const observer = new MutationObserver(this.onMutation)
      observer.observe(document.body, {
        attributes: true,
        childList: false,
        subtree: false
      })
    }
  }
  onMutation(mutationsList, observer) {
    if (this.isReaderReady()) {
      observer.disconnect()
      this.onReaderLoaded()
    }
  }
  terminate(port) {
    this.port.onMessage.removeListener(this.onReceive)
    this.port.onDisconnect.removeListener(this.onDisconnect)
    document.removeEventListener("AboutReaderContentLoaded", this)

    this.disableSurvey()

    const narrateDropDown = document.querySelector(".narrate-dropdown")
    if (narrateDropDown) {
      narrateDropDown.removeLEventistener("click", this)
    }

    window.removeEventListener("beforeunload", this)
  }
  disableSurvey() {
    const survey = document.querySelector(".narrate-dropdown .narrate-survey")
    if (survey) {
      survey.removeEventListener("click", this)
      survey.removeEventListener("change", this)
      survey.remove()
    }
  }
  isReaderReady() {
    return document.body.classList.contains("loaded")
  }
  listen() {
    document.addEventListener("AboutReaderContentLoaded", this)
  }
  handleEvent(event) {
    switch (event.type) {
      case "AboutReaderContentLoaded":
        console.log("AboutReaderContentLoaded")
        return this.onReaderLoaded()
      case "change":
        return this.onRateChange(event)
      case "click": {
        switch (event.target) {
          case document.querySelector(".narrate-start-stop"): {
            return this.onPlaybackChange(event)
          }
          case document.querySelector(".narrate-survey"): {
            return this.onSurveyClicked(event)
          }
          default: {
            return
          }
        }
      }
      case "beforeunload": {
        return this.onBeforeUnload(event)
      }
    }
  }
  onBeforeUnload(event) {
    if (this.startTime != null) {
      const duration = Date.now() - this.startTime
      this.startTime = null
      this.port.postMessage({
        type: "stop-playback",
        reason: "unload",
        duration
      })
    }
  }
  onPlaybackChange(event) {
    if (this.startTime == null) {
      this.startTime = Date.now()
    } else {
      const duration = Date.now() - this.startTime
      this.startTime = null
      this.port.postMessage({
        type: "stop-playback",
        reason: "pause",
        duration
      })
    }
  }
  onDisconnect(message) {
    this.terminate()
  }
  onReceive(message) {
    switch (message.type) {
      case "init": {
        if (message.state.dispalySurvey) {
          this.diplaySurveyPrompt()
        }
        return
      }
      case "disable-survey": {
        return this.disableSurvey()
      }
    }
  }
  onSurveyClicked(event) {
    event.preventDefault()
    this.port.postMessage({ type: "launch-survey" })
    // Note: Remove listener as clicks occurs for both windows and labels.
    event.currentTarget.removeEventListener("click", this)
    window.open("https://www.research.net/r/FRLBYR5", "_blank")
  }
  onRateChange(event) {
    const rate = Number(event.target.value)
    const [...labels] = document.querySelectorAll(
      ".narrate-dropdown .narrate-survey label"
    )

    let index = 0
    for (let label of labels) {
      if (index++ < rate) {
        label.textContent = "★"
      } else {
        label.textContent = "☆"
      }
    }
  }
  diplaySurveyPrompt() {
    const survey = document.createElement("form")
    survey.addEventListener("change", this)
    survey.addEventListener("click", this)
    survey.classList.add("narrate-row", "narrate-survey")
    survey.style.backgroundColor = "rgb(233, 233, 233)"
    survey.style.padding = "0.9em"
    const link = document.createElement("a")
    link.textContent = "How would you rate this listening experience?"
    link.href = "https://www.research.net/r/FRLBYR5"
    link.target = "_blank"
    link.style.color = "#0095dd"
    link.style.lineheight = "1.2em"
    link.style.fontSize = "0.84em"
    link.style.textDecoration = "none"
    survey.append(link)

    const rating = document.createElement("fieldset")
    for (const index of [1, 2, 3, 4, 5]) {
      const input = document.createElement("input")
      input.type = "radio"
      input.name = "rate"
      input.id = `rate-${index}`
      input.value = index
      input.style.MozAppearance = "none"

      const label = document.createElement("label")
      label.setAttribute("for", `rate-${index}`)
      label.textContent = "☆"

      survey.append(input, label)
    }

    const voices = document.querySelector(".narrate-voices")
    voices.parentElement.insertBefore(survey, voices.nextSibling)
  }
  showControls(dropdown) {
    dropdown.click()
    dropdown.classList.add("open")
    const dropdownToggle = dropdown.querySelector(".dropdown-toggle")
    const dropdownPopup = dropdown.querySelector(".dropdown-popup")

    const toggleHeight = dropdownToggle.offsetHeight
    const toggleTop = dropdownToggle.offsetTop
    const popupTop = toggleTop - toggleHeight / 2

    dropdownPopup.style.top = `${popupTop}px`
  }
  onReaderLoaded() {
    try {
      window.addEventListener("beforeunload", this)

      const narrateDropDown = document.querySelector(".narrate-dropdown")
      this.showControls(narrateDropDown)

      const playbackButton = document.querySelector(".narrate-start-stop")
      playbackButton.addEventListener("click", this)
      playbackButton.dispatchEvent(new MouseEvent("click"))
    } catch (error) {
      console.error(error)
    }
  }
}

NarrateExperiment.spawn()

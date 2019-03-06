class NarrateExperiment {
  static spawn() {
    const self = new this()
    self.init()
    return self
  }
  init() {
    this.startTime = null
    this.onReceive = this.onReceive.bind(this)
    this.onDisconnect = this.onDisconnect.bind(this)
    this.onMutation = this.onMutation.bind(this)
    this.onPlaybackUpdate = this.onPlaybackUpdate.bind(this)
    this.playbackObserver = new MutationObserver(this.onPlaybackUpdate)

    this.port = browser.runtime.connect()
    this.port.onDisconnect.addListener(this.onDisconnect)
    this.port.onMessage.addListener(this.onReceive)
    if (!this.isReaderReady()) {
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
      // Add some delay because reflow is not finished yet which causes
      // incorrect positioning
      setTimeout(() => this.onReaderLoaded(), 100)
    }
  }
  onInit(state) {
    this.state = state
    if (this.isReaderReady()) {
      this.onReaderLoaded()
    }
  }
  terminate(port) {
    this.port.onMessage.removeListener(this.onReceive)
    this.port.onDisconnect.removeListener(this.onDisconnect)
    document.removeEventListener("AboutReaderContentLoaded", this)
    this.playbackObserver.disconnect()

    this.disableSurvey()

    const narrateDropDown = document.querySelector(".narrate-dropdown")
    if (narrateDropDown) {
      narrateDropDown.removeEventListener("click", this)
    }

    window.removeEventListener("beforeunload", this)
  }
  isReaderReady() {
    return document.body.classList.contains("loaded")
  }
  listen() {
    document.addEventListener("AboutReaderContentLoaded", this)
  }
  handleEvent(event) {
    switch (event.type) {
      case "change":
        return this.onRateChange(event)
      case "click": {
        switch (event.currentTarget) {
          case document.querySelector(".narrate-start-stop"): {
            return this.onPlaybackChange(event)
          }
          case document.querySelector(".narrate-survey"): {
            return this.onSurveyClicked(event)
          }
          default: {
            return void event
          }
        }
      }
      case "beforeunload": {
        return this.onBeforeUnload(event)
      }
      default: {
        return void event
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
  onPlaybackUpdate() {
    const narrateDropDown = document.querySelector(".narrate-dropdown")
    const isSpeaking = narrateDropDown.classList.contains("speaking")
    if (!isSpeaking && this.startTime != null) {
      const duration = Date.now() - this.startTime
      this.startTime = null
      this.port.postMessage({
        type: "stop-playback",
        reason: "finished",
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
        return this.onInit(message.state)
      }
      case "disable-survey": {
        return this.disableSurvey()
      }
      default: {
        return void message
      }
    }
  }
  onSurveyClicked(event) {
    event.preventDefault()
    this.port.postMessage({ type: "launch-survey" })
    // Note: Remove listener as clicks occurs for both windows and labels.
    event.currentTarget.removeEventListener("click", this)
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
  enableSurvey() {
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

    for (const index of [1, 2, 3, 4, 5]) {
      const input = document.createElement("input")
      input.type = "radio"
      input.name = "rate"
      input.id = `rate-${index}`
      input.value = index
      input.style.MozAppearance = "none"

      const label = document.createElement("label")
      label.style.color = "#333333"
      label.setAttribute("for", `rate-${index}`)
      label.textContent = "☆"

      survey.append(input, label)
    }

    const voices = document.querySelector(".narrate-voices")
    voices.parentElement.insertBefore(survey, voices.nextSibling)
  }
  disableSurvey() {
    const survey = document.querySelector(".narrate-dropdown .narrate-survey")
    if (survey) {
      survey.removeEventListener("click", this)
      survey.removeEventListener("change", this)
      survey.remove()
    }
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
    const { state } = this
    if (state) {
      this.setup(state)
    }
  }
  setup({ displaySurvey, isActive }) {
    try {
      window.addEventListener("beforeunload", this)

      this.port.postMessage({ type: "enter-reader" })

      const playbackButton = document.querySelector(".narrate-start-stop")
      playbackButton.addEventListener("click", this)

      const narrateDropDown = document.querySelector(".narrate-dropdown")
      this.playbackObserver.observe(narrateDropDown, {
        attributes: true,
        childList: false,
        subtree: false
      })

      if (isActive) {
        if (displaySurvey) {
          this.enableSurvey()
        }

        this.showControls(narrateDropDown)

        playbackButton.dispatchEvent(new MouseEvent("click"))
      }
    } catch (error) {
      console.error(error)
    }
  }
}

NarrateExperiment.spawn()

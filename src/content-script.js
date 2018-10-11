class NarrateExperiment {
  static spawn() {
    console.log("spawn", document.readyState)
    const self = new this()
    self.init()
    return self
  }
  init() {
    if (this.isReaderReady()) {
      this.onReaderLoaded()
    } else {
      document.addEventListener("AboutReaderContentLoaded", this)
    }
  }
  isReaderReady() {
    return document.querySelector(".narrate-start-stop") != null
  }
  listen() {
    document.addEventListener("AboutReaderContentLoaded", this)
  }
  handleEvent(event) {
    switch (event.type) {
      case "AboutReaderContentLoaded":
        return tihs.onReaderLoaded()
    }
  }
  onReaderLoaded() {
    document.querySelector(".narrate-start-stop").click()
  }
}

NarrateExperiment.spawn()

// TODO:

// - Replace survey URLs
// - Figure out how to target English only, United States and Canada
// - Exclude users with containers extensions to avoid awesome bar conflicts
// - Ping telemetry on start & on end
// - Ping on every page load that is an article
// - Need to handle end if occured through
//    - navigate away (beforeunload in contentscript ?)
//    - tab closed (beforeunload in content script ?)
//    - close window
//    - quit firefox
// - Not sure how to - 5% of users who engage with Narrate return to listen within 30 days. (Experiment branch only)

const baseStudySetup = {
  // used for activeExperiments tagging (telemetryEnvironment.setActiveExperiment)
  activeExperimentName: browser.runtime.id,

  // uses shield sampling and telemetry semantics.  Future: will support "pioneer"
  studyType: "shield",

  // telemetry
  telemetry: {
    // default false. Actually send pings.
    send: false,
    // Marks pings with testing=true.  Set flag to `true` before final release
    removeTestingFlag: false
  },

  // endings with urls
  endings: {
    /** standard endings */
    "user-disable": {
      baseUrls: [
        "https://qsurvey.mozilla.com/s3/Shield-Study-Example-Survey/?reason=user-disable"
      ]
    },
    ineligible: {
      baseUrls: []
    },
    expired: {
      baseUrls: [
        "https://qsurvey.mozilla.com/s3/Shield-Study-Example-Survey/?reason=expired"
      ]
    },

    /** Study specific endings */
    "user-used-the-feature": {
      baseUrls: [
        "https://qsurvey.mozilla.com/s3/Shield-Study-Example-Survey/?reason=user-used-the-feature"
      ],
      category: "ended-positive"
    },
    "hated-the-feature": {
      baseUrls: [
        "https://qsurvey.mozilla.com/s3/Shield-Study-Example-Survey/?reason=hated-the-feature"
      ],
      category: "ended-negative"
    }
  },

  // Study branches and sample weights, overweighing feature branches
  weightedVariations: [
    {
      name: "feature-active",
      weight: 1.5
    },
    {
      name: "feature-passive",
      weight: 1.5
    },
    {
      name: "control",
      weight: 1
    }
  ],

  // maximum time that the study should run, from the first run
  expire: {
    days: 30
  }
}

/**
 * Determine, based on common and study-specific criteria, if enroll (first run)
 * should proceed.
 *
 * False values imply that *during first run only*, we should endStudy(`ineligible`)
 *
 * Add your own enrollment criteria as you see fit.
 *
 * (Guards against Normandy or other deployment mistakes or inadequacies).
 *
 * This implementation caches in local storage to speed up second run.
 *
 * @returns {Promise<boolean>} answer An boolean answer about whether the user should be
 *       allowed to enroll in the study
 */
async function cachingFirstRunShouldAllowEnroll() {
  // Cached answer.  Used on 2nd run
  let allowed = await browser.storage.local.get("allowedEnrollOnFirstRun")
  if (allowed.allowedEnrollOnFirstRun === true) return true

  /*
  First run, we must calculate the answer.
  If false, the study will endStudy with 'ineligible' during `setup`
  */

  // could have other reasons to be eligible, such add-ons, prefs
  allowed = true

  // cache the answer
  await browser.storage.local.set({ allowedEnrollOnFirstRun: allowed })
  return allowed
}

/**
 * Augment declarative studySetup with any necessary async values
 *
 * @return {object} studySetup A complete study setup object
 */
async function getStudySetup() {
  /*
   * const id = browser.runtime.id;
   * const prefs = {
   *   variationName: `shield.${id}.variationName`,
   *   };
   */

  // shallow copy
  const studySetup = Object.assign({}, baseStudySetup)

  studySetup.allowEnroll = await cachingFirstRunShouldAllowEnroll()

  return studySetup
}

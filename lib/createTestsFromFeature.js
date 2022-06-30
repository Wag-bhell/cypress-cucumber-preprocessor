const { CucumberDataCollector } = require("./cukejson/cucumberDataCollector");
const { createTestFromScenarios } = require("./createTestFromScenario");
const { shouldProceedCurrentStep, getEnvTags, getFilterTags } = require("./tagsHelper");

const createTestsFromFeature = (filePath, spec) => {
    const testState = new CucumberDataCollector(filePath, spec);
    const featureTags = testState.feature.tags;
    const hasEnvTags = !!getEnvTags();
    const anyFocused =
        testState.feature.children.filter(
            (section) => section.tags && section.tags.find((t) => t.name === "@focus")
        ).length > 0;
    const backgroundSection = testState.feature.children.find(
        (section) => section.type === "Background"
    );
    var allScenarios = testState.feature.children.filter(
        (section) => section.type !== "Background"
    );

    // tags on features should be inherited by scenario's (https://cucumber.io/docs/cucumber/api/#tags)
    allScenarios.forEach((section) => {
        // eslint-disable-next-line no-param-reassign
        section.tags = section.tags.concat(featureTags);
    });



    const scenariosToRun = allScenarios.filter((section) => {
        let shouldRun;
        // only just run focused if no env tags set
        // https://github.com/TheBrainFamily/cypress-cucumber-example#smart-tagging
        if (!hasEnvTags && anyFocused) {
            shouldRun = section.tags.find((t) => t.name === "@focus");
        } else {
            shouldRun = !hasEnvTags || shouldProceedCurrentStep(section.tags);
        }
        return shouldRun;
    });
    // create tests for all the scenarios
    // but flag only the ones that should be run
    scenariosToRun.forEach((section) => {
        // eslint-disable-next-line no-param-reassign
        section.shouldRun = true;
    });
    //****** CARREFOUR ZONE *****************
    console.log("FOUND TAGS : " + getFilterTags())
    console.log("SCENARIO NUMBER BEFORE FILTER : " + allScenarios.length)
    if (getFilterTags() != "") {
        allScenarios.forEach(x => x.tags.forEach(y => console.log(y.name)))
        allScenarios = allScenarios.filter((section) => section.tags.filter((tag) => getFilterTags().includes(tag.name.toLowerCase())).length > 0)
            //Filter rejected tags

        var rejectedTags = getFilterTags().filter(tag => tag.includes('not '))

        if (rejectedTags) {
            allScenarios = allScenarios.filter((section) => section.tags.filter((tag) => rejectedTags.includes('not ' + tag.name)).length == 0)
        }
    }
    console.log("SCENARIO NUMBER AFTER FILTER : " + allScenarios.length)

    //****** CARREFOUR ZONE *****************
    createTestFromScenarios(allScenarios, backgroundSection, testState);
};

module.exports = {
    createTestsFromFeature,
};
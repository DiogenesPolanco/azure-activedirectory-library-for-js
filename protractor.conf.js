exports.config = {
    framework: 'jasmine',
    //'seleniumAddress': 'http://hub-cloud.browserstack.com/wd/hub',
    //'chromeDriver': 'C:\Program Files (x86)\chromedriver_win32',
    specs: ['tests/e2eTestsSpec.js'],
    capabilities: {
        //'os': 'Windows',
        //'os_version': '7',
        //'browserName': 'IE',
        'browserName': 'firefox',
        "loggingPrefs": { "browser": "ALL" },
        //'browser_version': '11.0',
        //'resolution': '1024x768', 
        //'browserstack.ie.enablePopups': true,
        //'browserstack.safari.enablePopups': true
    },
    //directConnect: true
}
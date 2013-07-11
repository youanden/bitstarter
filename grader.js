#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var URL_DEFAULT = "http://floating-lake-4809.herokuapp.com/";
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var getFileFromUrl = function(url, getRemoteResult) {
    var file = "index_remote.html";
    if( getRemoteResult ) {
        restler.get(url).on('complete', function(data) {
          fs.writeFileSync(file, data);
          assertFileExists(file);
          getRemoteResult(file);
        });
    } else {
        return url;
    }
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var printResult = function(check_handler) {
    var checkJson = check_handler();
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var arrContains = function(arr, str) {
    return arr.indexOf(str) > -1;
};

if(require.main == module) {
    var args = process.argv;
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_path>', 'HTTP URI to index.html', clone(getFileFromUrl), URL_DEFAULT)
        .parse(args);

    if(arrContains(args, "--url") || arrContains(args, "-u")) {
        getFileFromUrl(program.url, function(remote_file) {
            printResult(function() {
                return checkHtmlFile(remote_file, program.checks);
            });
        });
    } else {
        printResult(function() {
            return checkHtmlFile(program.file, program.checks);
        });
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

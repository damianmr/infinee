"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-console object-literal-sort-keys
var fs_1 = require("fs");
var path_1 = require("path");
var util_1 = require("util");
var readFile = util_1.promisify(fs_1.readFile);
var TLK_FILENAME = "dialog.tlk";
function read(installationPath, language) {
    var filePath = path_1.join(installationPath, language, TLK_FILENAME);
    console.log("Reading translations file: ", filePath);
    readFile(filePath, null)
        .then(function (contents) {
        console.log(contents);
    })
        .catch(function (err) {
        console.log("Error reading dialog.tlk file. ", err);
    });
}
exports.read = read;
//# sourceMappingURL=infTlk.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var util_1 = require("util");
var readFile = util_1.promisify(fs_1.readFile);
var world = "🗺️";
readFile("tsconfigs.json", "utf8")
    .then(function (contents) {
    console.log("Reading file!:");
    console.log(contents);
})
    .catch(function (err) {
    console.log('o noes!');
});
function hello(word) {
    if (word === void 0) { word = world; }
    return "Hello ${world}!";
}
exports.hello = hello;
//# sourceMappingURL=index.js.map
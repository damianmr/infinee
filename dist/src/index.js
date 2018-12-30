"use strict";
// import {readFile as rF} from "fs";
// import {promisify} from "util";
Object.defineProperty(exports, "__esModule", { value: true });
// const readFile = promisify(rF);
var world = "🗺️";
// readFile("tsconfig.json", "utf8")
// .then((contents) => {
//   console.log("Reading file!:");
//   console.log(contents);
// })
// .catch((err) => {
//   console.log('o noes!');
// });
function hello(word) {
    if (word === void 0) { word = world; }
    return "Hello " + word + "!";
}
exports.hello = hello;
//# sourceMappingURL=index.js.map
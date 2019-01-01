"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var constants_1 = require("../src/constants");
var infTlk_1 = require("../src/infTlk");
var constants_2 = require("./constants");
describe("Read of translations file", function () {
    it("should read the file properly", function (done) {
        infTlk_1.read(constants_2.MOCK_INSTALL, constants_1.Language.EnglishUS);
        done();
    });
});
//# sourceMappingURL=infTlk.js.map
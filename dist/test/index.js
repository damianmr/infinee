"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
require("mocha");
var index_1 = require("../src/index");
describe("Hello function", function () {
    it("should return hello world", function () {
        var result = index_1.hello("Che");
        chai_1.expect(result).to.equal("Hello Che!");
    });
});
//# sourceMappingURL=index.js.map
import { expect } from "chai";
import "mocha";
import { Language } from "../src/constants";
import { read } from "../src/infTlk";
import { MOCK_INSTALL } from "./constants";

describe("Read of translations file", () => {

  it("should read the file properly", (done) => {
    read(MOCK_INSTALL, Language.EnglishUS);
    done();
  });

});

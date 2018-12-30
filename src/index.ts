// import {readFile as rF} from "fs";
// import {promisify} from "util";

// const readFile = promisify(rF);

const world = "🗺️";

// readFile("tsconfig.json", "utf8")
// .then((contents) => {
//   console.log("Reading file!:");
//   console.log(contents);
// })
// .catch((err) => {
//   console.log('o noes!');
// });

export function hello(word: string = world ): string {
  return "Hello ${world}!";
}

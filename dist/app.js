"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const Downloader_js_1 = __importDefault(require("./Downloader.js"));
const downloader = new Downloader_js_1.default(process.cwd());
commander_1.program
    .name("song downloader")
    .option("-o, --output <type>", "setting output path", ".")
    .option("-p, --playlist", "changing mode to playlist", false)
    .addHelpText("after", `
        Example usage:

        sound-downloader <url> ...flags

        -o, --output  -set your output path (default: current directory)
        -p, --playlist -set mode to download playlist (default: false)
    `)
    .showHelpAfterError()
    .parse(process.argv);
const options = commander_1.program.opts();
console.log(options);
downloader.setUrl(commander_1.program.args[0]);
downloader.setPath(options.output);
downloader.setPlaylistMode(options.playlist);
try {
    downloader.start();
}
catch (e) {
    // console.error(e);
}
//# sourceMappingURL=app.js.map
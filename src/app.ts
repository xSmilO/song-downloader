import { program } from "commander";
import Downloader from "./Downloader.js";

const downloader = new Downloader(process.cwd());

program
    .name("song downloader")
    .option("-o, --output <type>", "setting output path", ".")
    .option("-p, --playlist", "changing mode to playlist", false)
    .addHelpText(
        "after",
        `
        Example usage:

        sound-downloader <url> ...flags

        -o, --output  -set your output path (default: current directory)
        -p, --playlist -set mode to download playlist (default: false)
    `
    )
    .showHelpAfterError()
    .parse(process.argv);

const options = program.opts();

console.log(options);

downloader.setUrl(program.args[0]);
downloader.setPath(options.output);
downloader.setPlaylistMode(options.playlist);

try {
    downloader.start();
} catch (e) {
    // console.error(e);
}

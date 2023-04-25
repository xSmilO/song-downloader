import { program } from "commander";
import Downloader from "./Downloader.js";

const downloader = new Downloader(process.cwd());

program
    .name("SONG DOWNLOADER")
    .option("-o, --output <type>", "setting output path", ".")
    .option("-p, --playlist", "changing mode to playlist", false)
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

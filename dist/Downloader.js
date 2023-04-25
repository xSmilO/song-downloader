"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const path_1 = __importDefault(require("path"));
const ytpl_1 = __importDefault(require("ytpl"));
class Downloader {
    constructor(relativePath) {
        this.url = "";
        this.videoInfo = null;
        this.playlistMode = false;
        this.path = "";
        this.relativePath = relativePath;
        this.songs = [];
        this.progressBar = new cli_progress_1.default.SingleBar({
            format: "{filename} |" +
                ansi_colors_1.default.yellowBright("{bar}") +
                "| {percentage}% | {index}/{length}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true,
        });
        this.allDownloaded = false;
    }
    setPath(path) {
        this.path = path;
    }
    setUrl(url) {
        this.url = url;
    }
    setPlaylistMode(enable) {
        this.playlistMode = enable;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.url)
                throw new Error("URL CAN'T BE NULL VALUE");
            if (!this.path)
                this.path = "";
            this.path = path_1.default.join(this.relativePath, this.path);
            if (this.playlistMode) {
                yield this.getPlaylistInfo();
                this.downloadPlaylist();
            }
            if (!this.playlistMode) {
                this.download(yield this.getVideoInfo());
            }
        });
    }
    validateTitle(song) {
        // song.title = song.title.replace(
        //     /[A-Za-z0-9\!\@\#\$\%\^\&\*\)\(+\=\._-]+$/g,
        //     ""
        // );
        song.title = song.title.replace(/\&|\||>|<|\^|\'/g, "");
        // song.title = song.title.replace(/\(/g, "^(");
        // song.title = song.title.replace(/\)/g, "^)");
    }
    getVideoInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield ytdl_core_1.default.getBasicInfo(this.url);
            return {
                url: this.url,
                title: info.videoDetails.title,
                duration: parseFloat(info.videoDetails.lengthSeconds),
                downloaded: false,
                downloading: false,
            };
        });
    }
    getPlaylistInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const playlistInfo = yield (0, ytpl_1.default)(this.url, { pages: Infinity });
            playlistInfo.items.map((song) => {
                this.songs.push({
                    url: song.shortUrl,
                    title: song.title,
                    duration: song.durationSec ? song.durationSec : 0,
                    downloaded: false,
                    downloading: false,
                });
            });
        });
    }
    download(song, index = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const video = (0, ytdl_core_1.default)(song.url, {
                filter: "audioonly",
                quality: "highestaudio",
            });
            fluent_ffmpeg_1.default.setFfmpegPath(`${ffmpeg_static_1.default}`);
            this.validateTitle(song);
            const fullSongPath = `${this.path}\\${song.title}.mp3`;
            this.progressBar.start(song.duration, 0, {
                filename: song.title,
                length: this.songs.length,
                index: index + 1,
            });
            song.downloading = true;
            try {
                (0, fluent_ffmpeg_1.default)({ source: video })
                    .toFormat("mp3")
                    .output(`${fullSongPath}`)
                    .on("progress", (progress) => {
                    // console.log(progress.timemark);
                    song.downloaded = false;
                    const timestamp = progress.timemark;
                    const timeChunks = timestamp.split(":");
                    const hours = parseFloat(timeChunks[0]);
                    const minutes = parseFloat(timeChunks[1]);
                    const seconds = parseFloat(timeChunks[2]);
                    const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds;
                    this.progressBar.increment(Math.round(totalSeconds));
                })
                    .on("end", () => {
                    // this.progressBar.stop();
                    song.downloaded = true;
                    song.downloading = false;
                })
                    .run();
            }
            catch (e) {
                console.error(e);
                song.downloaded = true;
                song.downloading;
            }
            // console.log(song);
        });
    }
    downloadPlaylist() {
        let index = 0;
        const loop = setInterval(() => {
            var _a, _b, _c, _d;
            if (index >= this.songs.length) {
                this.allDownloaded = true;
                clearInterval(loop);
            }
            if (((_a = this.songs[index]) === null || _a === void 0 ? void 0 : _a.downloading) == false &&
                ((_b = this.songs[index]) === null || _b === void 0 ? void 0 : _b.downloaded) == false) {
                this.download(this.songs[index], index);
            }
            if (((_c = this.songs[index]) === null || _c === void 0 ? void 0 : _c.downloaded) == true &&
                ((_d = this.songs[index]) === null || _d === void 0 ? void 0 : _d.downloading) == false)
                index++;
            if (this.allDownloaded) {
                console.log("kurwa");
                this.progressBar.stop();
            }
        }, 1000);
    }
}
exports.default = Downloader;
//# sourceMappingURL=Downloader.js.map
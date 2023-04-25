import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ytdl from "ytdl-core";
import cliProgress, { MultiBar } from "cli-progress";
import colors from "ansi-colors";
import path from "path";
import ytpl from "ytpl";

interface Song {
    url: string;
    title: string;
    filename: string;
    duration: number;
    downloaded: boolean;
    downloading: boolean;
}

class Downloader {
    url: string;
    videoInfo: ytdl.MoreVideoDetails | null;
    playlistMode: boolean;
    path: string;
    relativePath: string;
    songs: Song[];
    progressBar: cliProgress.SingleBar;
    allDownloaded: boolean;
    errorCount: number;

    constructor(relativePath: string) {
        this.url = "";
        this.videoInfo = null;
        this.playlistMode = false;
        this.path = "";
        this.relativePath = relativePath;
        this.songs = [];
        this.progressBar = new cliProgress.SingleBar({
            format:
                "{filename} |" +
                colors.yellowBright("{bar}") +
                "| {percentage}% | {index}/{length}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true,
        });
        this.allDownloaded = false;
        this.errorCount = 0;
    }

    setPath(path: string): void {
        this.path = path;
    }

    setUrl(url: string): void {
        this.url = url;
    }

    setPlaylistMode(enable: boolean): void {
        this.playlistMode = enable;
    }

    async start() {
        if (!this.url) throw new Error("URL CAN'T BE NULL VALUE");
        if (!this.path) this.path = "";
        this.path = path.join(this.relativePath, this.path);

        if (this.playlistMode) {
            await this.getPlaylistInfo();
            this.download();
        }

        if (!this.playlistMode) {
            this.songs.push(await this.getVideoInfo());
            this.download();
        }
    }

    validateTitle(song: Song): void {
        // song.title = song.title.replace(
        //     /[A-Za-z0-9\!\@\#\$\%\^\&\*\)\(+\=\._-]+$/g,
        //     ""
        // );
        // song.filename = song.filename.replace(/\&|\||>|<|\^|\'/g, "");
        song.filename = song.filename
            .replace(/\^/g, "^^")
            .replace(/\&/g, "^&")
            .replace(/\</g, "^<")
            .replace(/\>/g, "^>")
            .replace(/\|/g, "^|")
            .replace(/\"/g, "")
            .replace(/\//g, " ")
            .replace(/\\/g, " ");
        // song.title = song.title.replace(/\(/g, "^(");
        // song.title = song.title.replace(/\)/g, "^)");
    }

    async getVideoInfo(): Promise<Song> {
        const info = await ytdl.getBasicInfo(this.url);

        return {
            url: this.url,
            title: info.videoDetails.title,
            filename: info.videoDetails.title,
            duration: parseFloat(info.videoDetails.lengthSeconds),
            downloaded: false,
            downloading: false,
        };
    }

    async getPlaylistInfo() {
        try {
            const playlistInfo = await ytpl(this.url, { pages: Infinity });

            playlistInfo.items.map((song) => {
                this.songs.push({
                    url: song.shortUrl,
                    title: song.title,
                    filename: song.title,
                    duration: song.durationSec ? song.durationSec : 0,
                    downloaded: false,
                    downloading: false,
                });
            });
        } catch (e) {
            throw new Error("You need to provide valid playlist ID");
        }
    }

    async downloadSong(song: Song, index: number = 0): Promise<void> {
        const video = ytdl(song.url, {
            filter: "audioonly",
            quality: "highestaudio",
        });
        ffmpeg.setFfmpegPath(`${ffmpegPath}`);

        this.validateTitle(song);

        const fullSongPath = `${this.path}\\${song.filename}.mp3`;

        this.progressBar.start(song.duration, 0, {
            // filename: song.title,
            filename: song.filename,
            length: this.songs.length,
            index: index + 1,
        });

        song.downloading = true;
        try {
            ffmpeg({ source: video })
                .toFormat("mp3")
                .output(`${fullSongPath}`)
                .on("progress", (progress) => {
                    // console.log(progress.timemark);
                    song.downloaded = false;
                    const timestamp: string = progress.timemark;
                    const timeChunks = timestamp.split(":");
                    const hours = parseFloat(timeChunks[0]);
                    const minutes = parseFloat(timeChunks[1]);
                    const seconds = parseFloat(timeChunks[2]);
                    const totalSeconds =
                        hours * 60 * 60 + minutes * 60 + seconds;
                    this.progressBar.increment(Math.round(totalSeconds));
                })
                .on("error", (err, stdout, stderr) => {
                    // console.log("Cannot process video: " + err.message);
                    //Error counts
                    this.errorCount++;
                    if (this.errorCount >= 5) {
                        song.downloaded = true;
                        song.downloading = false;
                    } else {
                        song.downloaded = false;
                        song.downloading = false;
                    }
                })
                .on("end", () => {
                    // this.progressBar.stop();
                    this.errorCount = 0;

                    song.downloaded = true;
                    song.downloading = false;
                })
                .run();
        } catch (e) {
            console.error(e);
            song.downloaded = true;
            song.downloading = false;
        }
        // console.log(song);
    }

    download(): void {
        let index = 0;

        const loop = setInterval(() => {
            if (index >= this.songs.length) {
                this.allDownloaded = true;
                // this.progressBar.stop();
                clearInterval(loop);
            }

            if (
                this.songs[index]?.downloading == false &&
                this.songs[index]?.downloaded == false
            ) {
                this.downloadSong(this.songs[index], index);
            }

            if (
                this.songs[index]?.downloaded == true &&
                this.songs[index]?.downloading == false
            ) {
                index++;
            }

            if (this.allDownloaded) {
                this.progressBar.stop();
            }
        }, 1000);
    }
}

export default Downloader;

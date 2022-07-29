const chalk = require("chalk").default;
const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static").replace(/\//gi, "\\");
const fs = require("fs");
const inquirer = require("inquirer");
const ytdl = require("ytdl-core");
const { createSpinner } = require("nanospinner");
const yts = require("yt-search");
const { request } = require("http");
const { video_basic_info } = require("play-dl");

//!URL: https://www.youtube.com/watch?v=aDVzbFeGj0U
//!Playlist URL https://www.youtube.com/playlist?list=PLukDUAiQ_itbpCbRJOBNwPgSQD5R9BcRb

///mnt/c/Users/mateo/OneDrive/Pulpit/safd/song-downloader/node_modules/ffmpeg-static/ffmpeg
//ffmpeg -i ./music.ogg -vn -ar 44100 -ac 2 -ab 192 -f mp3 test.mp3

//C:\Users\mateo\OneDrive\Pulpit\safd\song-downloader\node_modules/ffmpeg-static/ffmpeg -i ./songs/'Gibbs - Nigdy albo zawsze.mp4' -vn -ar 44100 -ac 2 -ab 192 -f mp3 ./songs/'Gibbs - Nigdy albo zawsze.mp3'

// prettier-ignore
const YOUTUBE_PLAYLIST_REGEX = new RegExp(
    "(www\.youtube\.com/playlist)?list=(.{34})"
);

// const test = () => {
//     const url =
//         "https://www.youtube.com/watch?v=cvaIgq5j2Q8&list=PL_Hkwbp3Lq5YYxrX6hzlsJ633GWd4Npo2&index=2";

//     const res = YOUTUBE_PLAYLIST_REGEX.exec(url)[2];

//     console.log(res);
// };

// test();

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function start() {
    try {
        if (!fs.existsSync("./songs")) {
            fs.mkdirSync("./songs");
        }
    } catch (err) {
        console.error(err);
    }

    const choice = await inquirer.prompt({
        name: "Choose",
        type: "list",
        choices: ["Enter video url", "Enter playlist url"],
    });

    switch (choice.Choose) {
        case "Enter video url":
            downloadFromVideoUrl();
            break;
        case "Enter playlist url":
            downloadFromPlaylistUrl();
            break;
        default:
            process.exit(0);
            break;
    }
}

async function downloadFromVideoUrl() {
    const URL = await getUrl();
    await getStream("./songs/", URL);
}

async function downloadFromPlaylistUrl() {
    const URL = await getUrl();
    const songs = [];
    const listID = YOUTUBE_PLAYLIST_REGEX.exec(URL)[2];
    const res = await yts({ listId: listID });
    const playlistName = res.title
        .replace(/\s/gi, "_")
        .replace(/\'/g, "")
        .replace(/\'/g, "");

    for (let video of res.videos) {
        const song = await yts({ videoId: video.videoId });
        songs.push(song.url);
    }

    try {
        if (!fs.existsSync(`./songs/${playlistName}`)) {
            fs.mkdirSync(`./songs/${playlistName}`);
        }
    } catch (e) {
        console.error("Error when creating a directory");
    }

    for (let song of songs) {
        await getStream(`./songs/${playlistName}/`, song);
    }
}

async function getUrl() {
    const answer = await inquirer.prompt({
        name: "url",
        type: "input",
        message: "ENTER URL:",
    });

    return answer.url;
}

async function getVideoDetails(url) {
    try {
        // let data = await ytdl.getInfo(url, {
        //     requestOptions: {
        //         headers: {
        //             Cookie: "VISITOR_INFO1_LIVE=zIJkq-pOUY0; CONSENT=YES+cb.20210727-07-p1.pl+FX+298; PREF=tz=Europe.Warsaw&f6=40000000&f5=30000&volume=15&f4=4000000; SID=JAhu3gMIEl6OWL1N9x7077bmn-9lQMOzFbwLlmqy839yll2MuDGp-k-vlZHO9al7TETqQg; __Secure-1PSID=JAhu3gMIEl6OWL1N9x7077bmn-9lQMOzFbwLlmqy839yll2McSnJS3Vaj33JF2A4dLtaEw; __Secure-3PSID=JAhu3gMIEl6OWL1N9x7077bmn-9lQMOzFbwLlmqy839yll2MCTPxePcBrSST7nvOFr9aGg; HSID=AI6ymPyaAuZY_U2fI; SSID=AVO3_-acVpgk3X3FE; APISID=hEOj1PZGxW2vS6dl/A7L1TIFXRldFU4uCG; SAPISID=sVkvuFApflT7Cwuw/AaHbxWEHo9dOVIBmm; __Secure-1PAPISID=sVkvuFApflT7Cwuw/AaHbxWEHo9dOVIBmm; __Secure-3PAPISID=sVkvuFApflT7Cwuw/AaHbxWEHo9dOVIBmm; LOGIN_INFO=AFmmF2swRQIgblAqDDwgWGDmmSOQeJuIafF9rV7fPW9vYtS9KpwrnCsCIQCOW6-yNZb_o-Gt5Onk0XZ7IouoFmueLra-j6hk8vYFZA:QUQ3MjNmemh6R21sU0ZUR1ZOaHdSSkV2NkNHNnRyMU9nZXZhdkJrQi1DbGFfMW5fNDgzaHB5aHhnYWxUeXNFNmNtdFRnZVl2VWFESkNRUDN1c1ZiR2g1Smo4SVNZVlc5dUwyLXlMMGd6YlNGZU5YWnB3T3VTSW1LRk04NmU1TmVGYlVKNXVySEdiblNfUjlWamEwZUFoYkkxeUFDRlQtcVV3; SIDCC=AJi4QfHUDVGNsiPX38WNo0pac5r7KY0nI8S78brHU677Z0cFnh_O0lfyjkTzvWXBNX8I9ZF0_OY; __Secure-3PSIDCC=AJi4QfEGG0sAKQwAcMZMZbb-;",
        //         },
        //     },
        // });

        let data = await video_basic_info(url);
        printVideoDetails(data);

        return data;
    } catch (e) {
        console.error(e);
        // console.error(chalk.redBright("PLEASE ENTER VALID URL"));
        await sleep();
        process.exit(1);
    }
}

async function printVideoDetails(data) {
    const time = data.video_details.durationInSec;
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;

    console.log(`TITLE: ${chalk.green(data.video_details.title)}`);
    console.log(`DURATION: ${chalk.green(`${minutes}:${seconds}`)}`);
}

async function getStream(path, url) {
    try {
        const data = await getVideoDetails(url);
        const title = data.video_details.title
            .replace(/\'/g, "")
            .replace(/\\/g, "")
            .replace(/\//g, "");
        const downloadSpinner = createSpinner("Downloading video...").start();
        let stream = ytdl(url).pipe(
            fs.createWriteStream(`${path}${title}.mp4`)
        );

        stream.on("finish", () => {
            downloadSpinner.success({ text: "Succesfully downloaded" });

            const convertingSpinner = createSpinner(
                "Converting to mp3..."
            ).start();

            let command = `${ffmpegPath} -i ${path}'${title}.mp4' -vn -ar 44100 -ac 2 -ab 192 -f mp3 ${path}'${title}.mp3'`;
            command = command.replace(/\//gi, "\\");
            console.log(command);

            exec(command, (err, stdout, stderr) => {
                if (err) {
                    console.error(`exec error: ${err}`);
                    convertingSpinner.error({ text: "Error while converting" });
                    return;
                } else {
                    convertingSpinner.success({ text: "Video converted" });
                }
                fs.unlinkSync(`${path}${title}.mp4`);
            });
        });
    } catch (e) {
        console.error(e);
        await sleep();
        process.exit(1);
    }
}

start();

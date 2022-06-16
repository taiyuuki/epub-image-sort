const Epub = require("epub");
const fs = require("fs");
const cheerio = require("cheerio");
import { resolve } from "path";

const filesNameArr: string[] = fs.readdirSync(__dirname);

function getImageExt(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "image/tiff":
      return "tiff";
    case "image/svg+xml":
      return "svg";
    default:
      return "jpg";
  }
}

function getFileName(path: string): string {
  return path.substring(path.lastIndexOf("/") + 1);
}

function outputImages(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let count = 0;
    const epub = new Epub(path);
    const imgList = { length: 0 } as { [key: string]: string | number };
    try {
      epub.parse();
    } catch (e) {
      reject(e);
    }

    epub.on("end", () => {
      const title = epub.metadata.title;
      console.log(title + "解析完毕，正在导出图片...");
      fs.mkdir(title, { recursive: true }, (err: Error) => {
        if (err) console.log(err);
      });
      for (const key in epub.manifest) {
        if (epub.manifest[key]["media-type"].indexOf("image") !== -1) {
          const href = getFileName(epub.manifest[key].href);
          imgList[href] = epub.manifest[key].id;
          (<number>imgList.length)++;
        }
      }
      epub.flow.forEach((file: any, i: number) => {
        epub.getChapterRaw(file.id, (err: Error, text: string) => {
          if (err) console.log(err);
          const $ = cheerio.load(text);
          const src = $("img").attr("src");
          if (src) {
            const fileName = getFileName(src);
            epub.getImage(
              imgList[fileName],
              (err: Error, img: Buffer, mimeType: string) => {
                if (err) {
                  resolve("");
                }
                const ext = getImageExt(mimeType);
                const ws = fs.createWriteStream(`${title}/${i}.${ext}`);
                ws.write(img);
                ws.close();
                ws.on("close", () => {
                  count++;
                  if (count === imgList.length) {
                    console.log(title + "处理完毕");
                    resolve(title);
                  }
                });
              }
            );
          }
        });
      });
    });
  });
}

(async function () {
  for await (let fileName of filesNameArr) {
    if (fileName.endsWith(".epub")) {
      console.log("正在解析" + fileName);
      try {
        await outputImages(resolve(__dirname, fileName));
      } catch (error) {
        console.log(fileName + "无法解析");
        continue;
      }
    } else {
      continue;
    }
  }
})();

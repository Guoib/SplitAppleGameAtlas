import path from "path";
import walkSync from "walk-sync";
import fs, { readFile, readFileSync, writeFileSync } from "fs";
import fse from "fs-extra";
import plist from "plist";
import images from "images";
import { Plist } from "../types";
import { exec } from "child_process";
import cgbiToPng from "cgbi-to-png";
import ProgressBar from "progress";

interface SplitToolConstructorProps {
  sourcePath?: string;
  outputPath?: string;
}

class SplitTool {
  private count = 0;

  private sourcePath = path.join(__dirname, "../../source");
  private outputPath = path.join(__dirname, "../../output");

  constructor(props?: SplitToolConstructorProps) {
    props?.sourcePath && (this.sourcePath = props.sourcePath);
    props?.outputPath && (this.outputPath = props.outputPath);
  }

  /**
   * 检查路径上的文件夹是否存在，不存在则创建
   */
  private checkDir(path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  public async split() {
    this.checkDir(this.sourcePath);

    const plistArray = walkSync(this.sourcePath, { globs: ["**/*.plist"] });

    for (let i = 0; i < plistArray.length; i++) {
      const plist = plistArray[i];
      console.log(`正在处理第 ${i + 1} 个 plist 文件: ${plist}`);
      await this.splitPlist(plist);
    }

    console.log(`处理完成，共生成 ${this.count} 个图片`);
  }

  private convertBinaryPlistToXml(inputFilePath: string, outputFilePath: string) {
    return new Promise((resolve, reject) => {
      exec(`plutil -convert xml1 ${inputFilePath} -o ${outputFilePath}`, (error, stdout, stderr) => {
        if (error) {
          reject(`执行 plutil 命令时出错: ${error.message}`);
          return;
        }
        resolve(`plutil 命令执行成功: ${stdout}`);
      });
    });
  }

  private async convertCgBIPngToPng(inputFilePath: string, outputFilePath: string) {
    const cgbiBuffer = readFileSync(inputFilePath);
    const pngBuffer = cgbiToPng.revert(cgbiBuffer);
    writeFileSync(outputFilePath, pngBuffer);
  }

  private async splitPlist(plistPath: string) {
    const wholePlistPath = path.join(this.sourcePath, plistPath);
    const wholePngPath = wholePlistPath.split(".")[0] + ".png";

    await this.convertBinaryPlistToXml(wholePlistPath, wholePlistPath);
    await this.convertCgBIPngToPng(wholePngPath, wholePngPath);
    const plistFile = fs.readFileSync(wholePlistPath, "utf-8");
    const plistData = plist.parse(plistFile) as Plist;

    const dirName = plistPath.split(".")[0];
    fse.ensureDirSync(path.join(this.outputPath, dirName));

    const bigImage = images(path.join(this.sourcePath, dirName + ".png"));

    const total = Object.keys(plistData.frames).length;
    const progressBar = new ProgressBar("处理文件: :current/:total [:bar] :percent", { total, width: 40 });

    for (const key in plistData.frames) {
      /**
       * 总数累计
       */
      this.count++;
      progressBar.tick();
      const rectStr = plistData.frames[key].frame.match(/\d+(.\d+)?/g);
      const rectArr = rectStr.join(",").split(",");

      const wholeFrameOutputPath = path.join(this.outputPath, dirName, key);

      const dirPath = wholeFrameOutputPath.split("/").slice(0, -1).join("/");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      if (plistData.frames[key].rotated) {
        images(bigImage, Number(rectArr[0]), Number(rectArr[1]), Number(rectArr[3]), Number(rectArr[2]))
          .rotate(0)
          .save(wholeFrameOutputPath);
      } else {
        images(bigImage, Number(rectArr[0]), Number(rectArr[1]), Number(rectArr[2]), Number(rectArr[3])).save(
          wholeFrameOutputPath
        );
      }
    }
  }
}

export default SplitTool;

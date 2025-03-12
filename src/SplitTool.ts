import path from "path";
import walkSync from "walk-sync";
import fs from "fs";
import fse from "fs-extra";
import plist from "plist";
import images from "images";
import { Plist } from "./types";

interface SplitToolConstructorProps {
  sourcePath?: string;
  outputPath?: string;
}

class SplitTool {
  private sourcePath = path.join(__dirname, "../source");
  private outputPath = path.join(__dirname, "../output");

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

  public split() {
    this.checkDir(this.sourcePath);

    const plistArray = walkSync(this.sourcePath, { globs: ["**/*.plist"] });

    for (const plist of plistArray) {
      this.splitPlist(plist);
    }
  }

  private splitPlist(plistPath: string) {
    const wholePlistPath = path.join(this.sourcePath, plistPath);

    const plistFile = fs.readFileSync(wholePlistPath, "utf-8");
    const plistData = plist.parse(plistFile) as Plist;

    const dirName = plistPath.split(".")[0];
    fse.ensureDirSync(path.join(this.outputPath, dirName));

    const bigImage = images(path.join(this.sourcePath, dirName + ".png"));

    for (const key in plistData.frames) {
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

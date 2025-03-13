// @ts-ignore
import cgbiToPng from "cgbi-to-png";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import fastGlob from "fast-glob";
import { writeFileSync } from "fs";

interface CgBITransformerProps {
  /**
   * 工作目录，资源文件存放地址
   */
  dir: string;

  /**
   * 输出目录
   */
  outDir: string;
}

class CgBITransformer {
  private dir: string;
  private outDir: string;

  constructor(props: CgBITransformerProps) {
    this.dir = props.dir;
    this.outDir = props.outDir;
  }

  private getPath = (relativePath: string) => {
    return path.join(this.dir, relativePath);
  };

  private getOutPath = (relativePath: string) => {
    return path.join(this.outDir, relativePath);
  };

  private getAllFile = async () => {
    const paths = await fastGlob("*.png", {
      cwd: this.dir,
      onlyFiles: true,
    });
    return paths;
  };

  convertCgBIToPng = async (relativePath: string) => {
    const cgbiBuffer = await readFile(this.getPath(relativePath));
    const pngBuffer = cgbiToPng.revert(cgbiBuffer);
    const outPath = this.getOutPath(relativePath);
    writeFile(outPath, pngBuffer);
  };

  convertCgBIToPngAbsolutePath = async (inputPath: string, outputPath: string) => {
    const cgbiBuffer = await readFile(inputPath);
    const pngBuffer = cgbiToPng.revert(cgbiBuffer);
    writeFileSync(outputPath, pngBuffer);
  };

  convertAllCgBIToPng = async () => {
    const paths = await this.getAllFile();
    for (const path of paths) {
      this.convertCgBIToPng(path);
    }
  };
}

export default CgBITransformer;

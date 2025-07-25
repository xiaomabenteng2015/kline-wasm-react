#!/usr/bin/env node

/**
 * 模型下载脚本
 * 用于下载项目所需的AI模型文件
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// 模型配置
const MODELS = [
  {
    name: "Qwen 1.5 0.5B Chat",
    files: [
      "config.json",
      "tokenizer.json",
      "tokenizer_config.json",
      "onnx/model.onnx",
      "onnx/model_quantized.onnx",
    ],
    baseUrl: "https://huggingface.co/Qwen/Qwen1.5-0.5B-Chat/resolve/main/",
    localPath: "public/models/qwen1.5-0.5b-chat/",
  },
];

// 创建目录
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 创建目录: ${dirPath}`);
  }
}

// 下载文件
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 下载: ${url}`);

    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);

          file.on("finish", () => {
            file.close();
            console.log(`✅ 完成: ${path.basename(filePath)}`);
            resolve();
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        }
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {}); // 删除部分下载的文件
        reject(err);
      });
  });
}

// 主函数
async function main() {
  console.log("🚀 开始下载AI模型文件...\n");

  for (const model of MODELS) {
    console.log(`📦 处理模型: ${model.name}`);

    // 创建模型目录
    ensureDir(model.localPath);

    // 下载所有文件
    for (const file of model.files) {
      const url = model.baseUrl + file;
      const localFile = path.join(model.localPath, file);

      // 确保子目录存在
      ensureDir(path.dirname(localFile));

      try {
        // 检查文件是否已存在
        if (fs.existsSync(localFile)) {
          console.log(`⏭️  跳过已存在的文件: ${file}`);
          continue;
        }

        await downloadFile(url, localFile);
      } catch (error) {
        console.error(`❌ 下载失败 ${file}:`, error.message);
        console.log(`💡 提示: 可以手动从 ${url} 下载到 ${localFile}`);
      }
    }

    console.log(`✅ 模型 ${model.name} 处理完成\n`);
  }

  console.log("🎉 所有模型下载完成！");
  console.log("\n📝 注意事项:");
  console.log("1. 某些文件可能需要手动下载");
  console.log("2. 确保 public/models/ 目录有足够空间");
  console.log("3. 首次使用时浏览器会自动下载缺失的模型");
}

// 错误处理
process.on("unhandledRejection", (error) => {
  console.error("❌ 未处理的错误:", error);
  process.exit(1);
});

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadFile, ensureDir };

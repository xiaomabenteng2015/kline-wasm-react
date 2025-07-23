const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// 使用你已准备好的证书文件
const certFile = "10.20.10.43+2.pem"; // 证书文件名
const keyFile = "10.20.10.43+2-key.pem"; // 密钥文件名

const httpsOptions = {
  key: fs.readFileSync(path.join(process.cwd(), keyFile)),
  cert: fs.readFileSync(path.join(process.cwd(), certFile)),
};

// 获取本地IP地址
function getLocalIpAddress() {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部IP和非IPv4地址
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // 返回第一个找到的非内部IPv4地址
  for (const name of Object.keys(results)) {
    if (results[name].length > 0) {
      return results[name][0];
    }
  }

  return "localhost"; // 如果没有找到，返回localhost
}

const ipAddress = getLocalIpAddress();
const port = 3000;

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log(`> 服务已启动，可通过以下地址访问:`);
    console.log(`> https://${ipAddress}:${port}`);
    console.log(`> https://localhost:${port}`);
  });
});

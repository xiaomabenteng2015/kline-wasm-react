# HTTPS 配置说明

## 证书文件

项目使用以下证书文件：

- `10.20.10.43+2.pem` - 证书文件
- `10.20.10.43+2-key.pem` - 密钥文件

这些文件应该位于项目根目录中。如果你需要使用不同的证书文件，请在 `server.js` 中修改以下行：

```javascript
const certFile = "10.20.10.43+2.pem"; // 修改为你的证书文件名
const keyFile = "10.20.10.43+2-key.pem"; // 修改为你的密钥文件名
```

## 启动 HTTPS 服务器

### 开发环境

```bash
npm run dev:https
```

### 生产环境

```bash
npm run build
npm run start:https
```

## 访问应用

启动服务器后，你可以通过以下地址访问应用：

- `https://你的IP地址:3000`
- `https://localhost:3000`

## 注意事项

1. 如果使用自签名证书，浏览器会显示安全警告，需要手动确认继续访问。

2. 确保防火墙允许 3000 端口的访问：

   - macOS: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node`
   - Linux (ufw): `sudo ufw allow 3000`

3. 如果需要更改端口，请在 `server.js` 中修改 `port` 变量。

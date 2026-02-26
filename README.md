# repair-demo
a project for work

## COS 密钥配置

1. 复制 `.env.example` 为 `.env`，把 `COS_SECRET_ID`/`COS_SECRET_KEY`/`COS_BUCKET`/`COS_REGION` 填为真实值。
2. 运行 `npm install` 安装依赖（新增了 `dotenv`），然后执行 `npm run generate-cos-config`。
3. 脚本会把 `.env` 中的内容写入 `config/cos.private.json` 和 `config/cos.private.js`，小程序通过 `globalData.cosConfig` 使用它们。`.env` 以及这两个文件已在 `.gitignore` 中，确保不提交到 GitHub。

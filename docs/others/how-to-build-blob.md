# 如何构建当前笔记项目

## 1. 涉及组件
- [vitepress](tps://vitepress.dev/)
- [github Pages](https://docs.github.com/en/pages)


## 2. 构建流程

### 2.1 创建vitepress项目

- [vitepress 快速开始](https://vitepress.dev/zh/guide/getting-started)

### 2.2 配置github仓库 和 pages

- [github 仓库创建](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)

```bash
# 初始化仓库
git init
# 提交代码
git add .
git commit -m "init"
# 关联远程仓库
git remote add origin https://github.com/<username>/<repo-name>.git
git branch -M main
# 推送到远程仓库
git push -u origin main
```
- [github pages 配置](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

### 2.3 github actions 构建脚本

使用 github actions 构建脚本，需要在项目根目录创建并配置`.github/workflows/deploy.yml` ,   
```yaml{46-50}
# 构建 VitePress 站点并将其部署到 GitHub Pages 的示例工作流程
#
name: Deploy VitePress site to Pages

on:
  # 在针对 `main` 分支的推送上运行。如果你
  # 使用 `master` 分支作为默认分支，请将其更改为 `master`
  push:
    branches: [main]

  # 允许你从 Actions 选项卡手动运行此工作流程
  workflow_dispatch:

# 设置 GITHUB_TOKEN 的权限，以允许部署到 GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许同时进行一次部署，跳过正在运行和最新队列之间的运行队列
# 但是，不要取消正在进行的运行，因为我们希望允许这些生产部署完成
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # 构建工作
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 如果未启用 lastUpdated，则不需要
      # - uses: pnpm/action-setup@v3 # 如果使用 pnpm，请取消此区域注释
      #   with:
      #     version: 9
      # - uses: oven-sh/setup-bun@v1 # 如果使用 Bun，请取消注释
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm # 或 pnpm / yarn
      - name: Setup Pages
        uses: actions/configure-pages@v4
        with:
          registry-url: https://npm.pkg.github.com
          always-auth: true
      - name: Install dependencies before
        run: npm install # different with vitepress docs
      - name: Install dependencies
        run: npm ci   # 或 pnpm install / yarn install / bun install
      - name: Build with VitePress
        run: npm run docs:build # 或 pnpm docs:build / yarn docs:build / bun run docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  # 部署工作
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
大致和 vitepress 文档一致，额外增加了 npm install 命令, 以及设置了npm registry，因为官方文档没有提到这个命令，导致构建失败。  
添加后推送到远程仓库，即可在 github actions 中看到构建日志，构建成功后，即可在 github pages 中看到构建后的网站。

### 2.4 github acthions 执行失败问题汇总

- **问题1: Error: Cannot find module @rollup/rollup-linux-x64-gnu**

**解决** ：[参考链接](https://blog.csdn.net/weixin_45012973/article/details/144199095); 在 package.json 中添加如下代码：
```json
  "optionalDependencies": {
    "@rollup/rollup-linux-x64-gnu": "*"
  },
  "overrides": {
    "vite": {
      "rollup": "npm:@rollup/wasm-node"
    }
  }
```

- **问题2：GitHub Actions中setup-node项目npm ci报403错误**

**解决**: [参考链接](https://blog.gitcode.com/620ffa2fdcc4800e72a6e8d36f8cbe6d.html)   
1. 统一依赖来源策略, 当前环境执行`npm config set registry https://npm.pkg.github.com`. 在 `.github/workflows/deploy.yml` 中设置 npm 仓库地址.  
2. 本地删除 package-lock.json 文件, 执行 `npm install` 重新生成.








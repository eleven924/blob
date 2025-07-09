---
title: "git 常用命令组合汇总"
date: 2025-07-05
---
# git 常用命令组合汇总

## 项目整理管理
### 初始化项目
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
### 覆盖掉远程仓库所有commit记录
```bash
# 创建新分支（无父提交，孤立状态）
git checkout --orphan new-start
# 添加所有文件（保留工作区内容）
git add -A
# 提交作为新起点（可选）
git commit -m "全新的开始"
# 根据需要删除旧分支（如main/master）
git branch -D main  # 或 master
# 将当前分支重命名为main/master
git branch -m main
```
或者

```bash
rm -rf .git

# 重新初始化仓库, 并强制提交代码
```
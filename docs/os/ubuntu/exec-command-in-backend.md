---
title: "后端运行命令"
tags: ["ubuntu"]
date: 2025-08-04
---

# 后端运行命令

## 1. nohup 命令运行
```bash
# 后台运行命令，输出到 nohup.out 文件中, 
# nohup 表示无回显
# &>nohup.out 表示将输出重定向到 nohup.out 文件中,包括正确输出和错误输出
# & 表示在后台运行
nohup command &> nohup.out &
```

## 2. 将前台命令运行到后台
```bash
Ctrl+Z          # 暂停前台进程
bg %1           # %1代表jobs命令的第一个， 将进程放入后台
disown -h %1    # 解除进程与终端的关联
```
另外记录下, 当暂停前台命令后，可以使用 fg 命令恢复前台运行

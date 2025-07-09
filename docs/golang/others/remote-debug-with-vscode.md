---
title: "vscode 远程调试 golang 进程"
tags: ["golang"]
date: 2025-07-06
---
# vscode 远程调试 golang 进程
## 安装 dlv 命令
本地主机 和 服务运行主机 都需要安装 dlv 命令
```bash
go install github.com/go-delve/delve/cmd/dlv@latest
```

## dlv 远程监听对应进程
进入到服务运行的所在主机, ps进程关键字获取服务运行的进程 id, 例如此处 id 为 8911  
执行 dlv 命令 attach 此进程
```bash
dlv attach --headless --listen=:2345 --api-version=2 --accept-multiclient 8911
```
当然也可以考虑在容器中 执行 dlv attach , 这样需要在镜像中添加 dlv 命令,并将 2345 通过对应服务的 svc 进行暴露  

## vscode 中配置debug信息
在 .vscode 中创建 launch.json
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to Running Process",
            "type": "go",
            "request": "attach",
            "mode": "remote",
            "port": 2345,
            "host": "IP", // IP 地址
            "trace": true // 可选
        }
    ]
}
```

## 开始调试
添加断点,点击开始调试按钮.
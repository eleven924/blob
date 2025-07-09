---
title: "CGO 与静态编译"
tags: ["golang"]
date: 2025-07-05
---
# CGO 与静态编译

## CGO
- **相关介绍**:
    - [blog cgo](https://go.dev/blog/cgo)  
    - [pkg cgo](https://pkg.go.dev/cmd/cgo)  
- **允许使用 C 语言库**:
	- 启用 CGO 后，Go 编译器可以调用任何 C 语言库，以及使用 C 的功能。如果你的项目或依赖库需要使用 C 语言的特性，启用 CGO 是必需的。
- **自动链接 C 库**:
    - 当你在 Go 代码中使用 CGO 相关的功能时，编译器会自动链接所需的 C 库。这意味着只要代码中引用了 C 语言的函数，编译器就会尝试找到并链接这些库。
- **提高性能和功能**:
    - 许多库（如图像处理、网络协议、加密等）在 C 中实现的性能更高或功能更强大。启用 CGO 可以利用这些 C 库的优势。
- **依赖管理**:
    - 如果你的项目依赖于其他使用 C 的 Go 包，启用 CGO 可以确保这些库正确编译和链接，避免由于缺少 C 支持而导致的编译错误。

## CGO_ENABLED 的作用
`CGO_ENABLED` 环境变量配置支持两个参数
- 0: 禁用 `cgo` 命令进行构建, 所有的依赖都使用纯`go`的实现
- 1: 使用 `cgo` 命令进行构建, 尽量使用C的依赖编译

## 编译静态的二进制文件
- 场景1: 如果代码中用到依赖, 都是纯go实现的,那么指定 `CGO_ENABLED=0` 编译就好了 
- 场景2: 如果有绕不开的`C`代码依赖,那么可以尝试使用以下命令 `CGO_ENABLED=1 CC=musl-gcc go build -o myapp -linkmode external -extldflags '-static' main.go`


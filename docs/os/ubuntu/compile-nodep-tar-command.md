---
title: "ubuntu 下编译无依赖的 tar 命令"
tags: ["ubuntu"]
date: 2025-07-11
---

# ubuntu 下编译无依赖的 tar 命令

## 编译当前架构的 tar 命令
当前运行机器是 amd64 架构，所以编译出来的 tar 命令也是 amd64 的。

- 安装 musl 工具链  
> musl libc 是一个轻量级、快速且符合标准的 C 标准库实现，专为 Linux 系统设计。天生为静态编译优化，生成的自包含二进制文件无需外部依赖。
```bash
sudo apt-get install musl-tools
```

- 下载并解压 GNU tar 源码
```bash
wget https://ftp.gnu.org/gnu/tar/tar-latest.tar.gz
tar xvf tar-latest.tar.gz
cd tar-*
```

- 配置并编译
```bash
# 静态编译配置
./configure CC="musl-gcc -static" \
            --prefix=/usr/local \
            --disable-shared \
            --enable-static

# 编译并生成二进制
make
```

- 验证
```bash
file src/tar      # 应显示 "statically linked"
ldd src/tar       # 应显示 "not a dynamic executable"
```

## 跨平台编译 tar 命令

- 安装交叉编译工具链
```bash
# 安装 ARM64 交叉编译器 (x86_64 主机 → ARM64 目标)
sudo apt-get install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu

# 安装 musl 交叉编译支持
wget https://musl.cc/aarch64-linux-musl-cross.tgz
tar -xvf aarch64-linux-musl-cross.tgz
export PATH=$PATH:$(pwd)/aarch64-linux-musl-cross/bin
```

- 静态交叉编译 tar
``` bash
# 下载源码
wget https://ftp.gnu.org/gnu/tar/tar-latest.tar.gz
tar xvf tar-latest.tar.gz
cd tar-*

# 配置交叉编译环境
./configure \
  --host=aarch64-linux-musl \  # 目标平台
  CC="aarch64-linux-musl-gcc -static" \  # 静态编译
  --disable-shared

# 编译
make -j$(nproc)
```
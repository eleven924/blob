---
title: "ubuntu 下载deb包及其依赖"
tags: ["ubuntu"]
date: 2024-07-05
---
# ubuntu 下载deb包及其依赖

## 查看依赖
```bash
apt-cache depends $package_name
```

## 下载包及依赖
```bash
apt-get download $(apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances --no-pre-depends $package_name | grep -v i386 | grep "^\w")

```
## 安装包及依赖
```bash
dpkg -i *.deb
```
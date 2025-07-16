---
title: "ubuntu 下载deb包及其依赖"
tags: ["ubuntu"]
date: 2025-07-16
---
# ubuntu 下载deb包及其依赖

## 下载自己系统的依赖
### 查看依赖
```bash
apt-cache depends $package_name
```

### 下载包及依赖
```bash
apt-get download $(apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances --no-pre-depends $package_name | grep -v i386 | grep "^\w")

```
### 安装包及依赖
```bash
dpkg -i *.deb
```

## 下载其他系统的依赖(kali)
### 备份/etc/apt/source.list
```bash
mv /etc/apt/source.list /etc/apt/source.list.bak
```

### 修改/etc/apt/source.list为kali的源
```bash
echo 'deb https://mirrors.tuna.tsinghua.edu.cn/kali kali-rolling main non-free contrib non-free-firmware' > /etc/apt/sources.list

# 更新, 跳过校验
 sudo apt -o Acquire::AllowInsecureRepositories=true update
```

### 下载包及依赖
```bash
# 跳过校验和认证
sudo apt -o Acquire::AllowInsecureRepositories=true  -o APT::Get::AllowUnauthenticated=true  download $(apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances cloud-init | grep "^\w" | sort -u)
```

### 恢复/etc/apt/source.list
```bash
mv /etc/apt/source.list.bak /etc/apt/source.list
```
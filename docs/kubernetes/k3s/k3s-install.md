---
title: "安装K3S"
tags: ["k3s"]
date: 2025-07-05
---

# 安装K3S



## Ubuntu 安装K3S
> https://forums.rancher.cn/t/k3s/1416

**安装**
```bash
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn INSTALL_K3S_EXEC="--disable=traefik --disable=servicelb" sh -s - --system-default-registry "registry.cn-hangzhou.aliyuncs.com"
```

**卸载**
```bash
/usr/local/bin/k3s-uninstall.sh
```

**配置http,和镜像仓库**
```yaml
#cat /etc/rancher/k3s/registries.yaml 
mirrors:
  "docker.io":
    endpoint:
      - "https://docker.mirrors.ustc.edu.cn" # 可根据需求替换 mirror 站点
  "10.57.131.174:30079":
    endpoint:
      - "http://10.57.131.174:30079"
systemctl restart k3s 后 更新到/var/lib/rancher/k3s/agent/etc/containerd/certs.d/
```
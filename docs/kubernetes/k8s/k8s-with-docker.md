---
title: "k8s 1.26 版本使用 docker 作为运行时"
tags: ["k8s"]
date: 2024-07-06
---
# k8s 1.26 版本使用 docker 作为运行时
参考文档：  
> Docker Engine 安装： <https://docs.docker.com/engine/install/centos/>
> Kubernetes 1.26 CHANGELOG:　<https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.26.md>
> kubernetes 安装指南： <https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/>
> 安装容器运行时：<https://kubernetes.io/zh-cn/docs/setup/production-environment/container-runtimes/>

## 1. 安装docker

*  Set up the repository
```bash
#sudo yum install -y yum-utils
#sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
    
# 国内直接用阿里云镜像替换
wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo

yum list docker-ce --showduplicates
```

*   install docker

```bash
yum  -y install docker-ce-20.10.0-3.el7

sudo mkdir -p /etc/docker 


# 这里从阿里云获取自己的镜像加速器地址
cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": ["https://ecu3g632.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload 
sudo systemctl restart docker
sudo systemctl enable docker
```

## 2. 安装kubernetes

### 2.1 设置k8s yum仓库

```bash
cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF

yum makecache
```

### 2.2 安装cri-dockerd

自 1.24 版起，Dockershim 已从 Kubernetes 项目中移除，需要自己安装容器运行时

docker 在上面已经安装，只需要在安装cri-dockerd （这里也可以选择containerd容器）

<https://github.com/Mirantis/cri-dockerd>

```bash
# Run these commands as root
###Install GO###
wget https://storage.googleapis.com/golang/getgo/installer_linux
chmod +x ./installer_linux
./installer_linux
source ~/.bash_profile

cd cri-dockerd
mkdir bin
go build -o bin/cri-dockerd
mkdir -p /usr/local/bin
install -o root -g root -m 0755 bin/cri-dockerd /usr/local/bin/cri-dockerd
cp -a packaging/systemd/* /etc/systemd/system
sed -i -e 's,/usr/bin/cri-dockerd,/usr/local/bin/cri-dockerd,' /etc/systemd/system/cri-docker.service
systemctl daemon-reload
systemctl enable cri-docker.service
systemctl enable --now cri-docker.socket
```

### 2.3 安装kubeadm kubelet kubectl

```bash
yum install -y kubelet kubeadm kubectl
```

### 2.4 master init 初始化集群

```bash
[root@node03 cri-dockerd]# kubeadm init \
  --apiserver-advertise-address=192.168.56.106 \
  --image-repository registry.aliyuncs.com/google_containers \
  --kubernetes-version v1.26.3 \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16\
  --cri-socket=/var/run/cri-dockerd.sock
```

```bash

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.56.106:6443 --token rmhrlf.8250uprohom305a5 \
        --discovery-token-ca-cert-hash sha256:533986f789a8f5bf7cd2727db2800e6eef138d0daf8a602bff8f236a7f0e5dd2
```

### 2.5 work节点加入集群

需要指定cri-socket

```bash
kubeadm join 192.168.56.106:6443 --token rmhrlf.8250uprohom305a5 \
        --discovery-token-ca-cert-hash sha256:533986f789a8f5bf7cd2727db2800e6eef138d0daf8a602bff8f236a7f0e5dd2\
        --cri-socket=/var/run/cri-dockerd.sock
```

### 2.6 安装cni网络插件

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

## 3. 安装nginx测试

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl get pod,svc
```

本地主机curl(pod 在107上)

```bash
curl -X GET http://192.168.56.107:32089
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```


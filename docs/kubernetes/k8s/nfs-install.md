---
title: "使用NFS作为K8S的持久化存储"
tags: ["k8s"]
date: 2025-07-06
---
# NFS 安装

## 服务端 NFS 安装
### 安装nfs

```bash
yum install -y nfs-utils
```

###  添加nfs访问配置

```bash
vim /etc/exports
/usr/local/nfs 192.168.56.0/24(rw,sync)
```

同192.148.56.0/24一个网络号的主机可以挂载NFS服务器上的/home/nfs/目录到自己的文件系统中 rw表示可读写；sync表示同步写，fsid=0表示将/data找个目录包装成根目录

###  启动nfs

```bash
# 需要先启动rpcbind服务
systemctl enable rpcbind.service
systemctl enable nfs-server.service

systemctl start rpcbind.service
systemctl start nfs-server.service

# 使用rpcinfo命令检查是否启动成功
rpcinfo -p


# 使用 exportfs 命令进行挂载,并检查挂载情况
[root@node04 ~]# exportfs  -v
/usr/local/nfs  192.148.56.0/24(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,root_squash,no_all_squash)

```

##  客户端 NFS 安装 

### 安装nfs

```bash
yum install -y nfs-utils
```

### 客户端挂载nfs

**注意:  客户端并不需要启动nfs服务,但是要求rpcbind是启动状态,建议将此服务设置为开机自启动**

```bash
# 检查 NFS 服务器端是否有目录共享：showmount -e "nfs服务器的IP" 
showmount -e 192.168.56.107
#Export list for 192.168.56.107:
#/usr/local/nfs 192.168.56.0/24

# 通过mount命令对磁盘进行挂载   -vvvv 可以查看挂载的报错
mkdir /data01
mount -t  nfs -o nfsvers=3 -vvvv 192.168.56.107:/usr/local/nfs /usr/local/nfs-mount/

# 检查磁盘挂载状态
[root@node03 ~]# df -h  |grep nfs
192.168.56.107:/usr/local/nfs   36G  4.6G   32G   13% /usr/local/nfs-mount
```

### 客户端取消挂载

```bash
#注意不要挂载目录下执行此命令
umount /usr/local/nfs-mount/
```

## PV/PVC 的创建与使用
### 1. 创建pv和pvc

```yaml
apiVersion: v1
kind: PersistentVolume
metadata: 
  name: pv-nfs-01
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  nfs:
    # server是nfs的服务主机
    path: /usr/local/nfs
    server: 192.168.56.107
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: 
  name: pvc-nfs-01
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

### 2. 查看存储和存储卷

```bash
[root@node03 nfspv]# kubectl get pv,pvc
NAME                         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                STORAGECLASS   REASON   AGE
persistentvolume/pv-nfs-01   1Gi        RWO            Recycle          Bound    default/pvc-nfs-01                           16s

NAME                               STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/pvc-nfs-01   Bound    pv-nfs-01   1Gi        RWO                           16s
##### 可以看到pvc已经成功绑定到了pv(pv-nfs-01)上
[root@node03 nfspv]# kubectl describe persistentvolumeclaim/pvc-nfs-01
Name:          pvc-nfs-01
Namespace:     default
StorageClass:
Status:        Bound
Volume:        pv-nfs-01
Labels:        <none>
Annotations:   pv.kubernetes.io/bind-completed: yes
               pv.kubernetes.io/bound-by-controller: yes
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:      1Gi
Access Modes:  RWO
VolumeMode:    Filesystem
Used By:       <none>
Events:        <none>
```

### 3. 测试读写pv中的数据

*   现在这个pvc就可以被使用了。接下来通过一个创建一个pod向pv中写入数据,用另一个nginx 服务的pod将数据展示

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: edit-pvc-pod
spec:
  containers:
  - name: edit-pvc-container
    image: busybox
    volumeMounts:
    - name: mypvc
      mountPath: /data
    command:
    - "/bin/bash"
    - "-c"
    - "while true; do sleep 1000; done"
  volumes:
  - name: mypvc
    persistentVolumeClaim:
      claimName: pvc-nfs-01
```

注意:这里创建pod失败,查看pod事件,是因为mfs访问被拒绝导致的

这里修改nfs服务端的/etc/exports,并从新配置

```bash
[root@node04 ~]# cat /etc/exports
/usr/local/nfs *(rw,sync,no_root_squash)
[root@node04 ~]# exportfs  -r
[root@node04 ~]# exportfs  -v
/usr/local/nfs  <world>(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,no_root_squash,no_all_squash)
```

*   向挂载目录写入一个索引文件

```bash
[root@node03 nfspv]# kubectl exec -it edit-pvc-pod -- sh
/ # echo "Hello from Kubernetes storage" > /data/index.html
/ # exit
[root@node03 nfspv]# kubectl exec -it edit-pvc-pod -- cat /data/index.html
Hello from Kubernetes storage
```

*   创建一个nginx的pod,看看能否访问到对应的数据(nginx pod只给到只读界面)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: read-pv-pod
spec:
  volumes:
    - name: read-pv-storage
      persistentVolumeClaim:
        claimName: pvc-nfs-01
  containers:
    - name: task-pv-container
      image: nginx
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 80
          name: "http-server"
      volumeMounts:
        - mountPath: "/usr/share/nginx/html"
          name: read-pv-storage
          readOnly: true
```

*   通过nginx 的pod ip对nginx进行访问,可以看到

```bash
[root@node03 nfspv]# curl 10.244.1.30
Hello from Kubernetes storage
```

**尝试通过nginx的pod向pvc中写入数据失败,虽然是ReadWriteOnce的pvc,但是通过再pod的mount策略中限制,让他成为了一个只读的挂载目录**

```bash
# echo 123>test
sh: 4: cannot create test: Read-only file system
# pwd
/usr/share/nginx/html
```

### 4. 环境清理

```bash
# 再pvc被使用的场景下删除pvc,会一直不返回,ctrl+C后查看状态
kubectl delete pvc pvc-nfs-01

[root@node03 nfspv]# kubectl get pvc -o wide
NAME         STATUS        VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS   AGE   VOLUMEMODE
pvc-nfs-01   Terminating   pv-nfs-01   1Gi        RWO                           41m   Filesystem

#删除pod
kubectl delete pod read-pv-pod edit-pvc-pod

#再次查看pvc已被删除

#此时pv已经变成了Recycle状态,pv中的数据已经被删除可再次被挂载使用
[root@node03 nfspv]# kubectl get pv
NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
pv-nfs-01   1Gi        RWO            Recycle          Available                                   44m

# 删除pv
kubectl delete pv pv-nfs-01
```

## NFS动态提供Kubernetes后端存储卷
访问官方文档, 发现kubernetes官方并没有提供NFS卷插件提供的制备器，这里使用第三方制备器nfs-client-provisioner：<https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner>

**前提：** 已经安装好的NFS服务器，并且NFS服务器与Kubernetes的Slave节点都能网络连通。

### nfs-client-provisioner

nfs-client-provisioner 是一种自动供应器，它使用您现有的和已经配置的NFS服务器，通过持久卷声明支持Kubernetes持久卷的动态供应。持久卷以`${namespace}-$`{pvcName}-\${pvName}的形式提供。

#### 安装：

官方文档中提供了三种安装方式：

##### 通过Helm安装

```shell
$ helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
$ helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
    --set nfs.server=node04.com \
    --set nfs.path=/usr/local/nfs
```

只需要将 `nfs.server` 和 `nfs.path` 修改对应的nfs服务器和其目录即可

安装后增加了如下资源

```bash
[root@node03 ~]# kubectl get deploy
NAME                              READY   UP-TO-DATE   AVAILABLE   AGE
nfs-subdir-external-provisioner   1/1     1            1           21m
[root@node03 ~]# kubectl get clusterrole|grep nfs
nfs-subdir-external-provisioner-runner                                 2023-04-03T07:18:11Z
[root@node03 ~]# kubectl get sa|grep nfs
nfs-subdir-external-provisioner   0         21m
[root@node03 ~]# kubectl get clusterrolebindings |grep nfs
run-nfs-subdir-external-provisioner                    ClusterRole/nfs-subdir-external-provisioner-runner                                 21m
[root@node03 ~]# kubectl get StorageClass |grep nfs
nfs-client   cluster.local/nfs-subdir-external-provisioner   Delete          Immediate           true                   23m
```

***

还支持 手动安装 和 Kustomize

### 使用PVC动态制备

#### 创建pvc

*   创建pvc来请求对应的pv

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: nfs-client
  resources:
    requests:
      storage: 1Mi
```

创建成功后会请求资源并创建pv

```bash
[root@node03 nfspv]# kubectl get pvc
NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
test-claim   Bound    pvc-40eb390c-cd02-4782-9186-d34497aeacc6   1Mi        RWX            nfs-client     4m46s
[root@node03 nfspv]# kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                STORAGECLASS   REASON   AGE
pvc-40eb390c-cd02-4782-9186-d34497aeacc6   1Mi        RWX            Delete           Bound    default/test-claim   nfs-client              35s
```

*   创建pod进行测试

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: edit-pvc-pod
spec:
  containers:
  - name: edit-pvc-container
    image: busybox
    volumeMounts:
    - name: mypvc
      mountPath: /data
    command:
      - "/bin/sh"
    args:
      - "-c"
      - "touch /data/SUCCESS ;sleep 3600"
  volumes:
  - name: mypvc
    persistentVolumeClaim:
        claimName: test-claim
```

查看pod中的文件已经被创建

```bash
[root@node03 nfspv]# kubectl exec -it edit-pvc-pod -- stat /data/SUCCESS
  File: /data/SUCCESS
  Size: 0               Blocks: 0          IO Block: 524288 regular empty file
Device: 5fh/95d Inode: 816862      Links: 1
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2023-04-03 08:08:33.777273870 +0000
Modify: 2023-04-03 08:08:33.777273870 +0000
Change: 2023-04-03 08:08:33.777273870 +0000
```

#### 删除pvc

```bash
[root@node03 nfspv]# kubectl delete -f autoPVCpod.yaml
pod "edit-pvc-pod" deleted
[root@node03 nfspv]# kubectl delete -f autoPVC.yaml
persistentvolumeclaim "test-claim" deleted

[root@node03 nfspv]# kubectl get pv
No resources found
[root@node03 nfspv]# kubectl get pvc
No resources found in default namespace.
```

先删除使用的pod,再删除pvc, 都删除后,对应的pv也被删除.查看nfs的目录下,有一个archive目录

```bash
[root@node04 nfs]# pwd
/usr/local/nfs
[root@node04 nfs]# ls
archived-default-test-claim-pvc-40eb390c-cd02-4782-9186-d34497aeacc6
```



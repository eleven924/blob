---
title: "禁用系统 USB 存储模块"
tags: ["ubuntu"]
date: 2024-07-05
---
# 禁用系统 USB 存储模块

有些场景,主机要求禁用外接usb存储设备. 

系统: Ubuntu22.04

禁用模块
```bash

echo "blacklist usb_storage">>/etc/modprobe.d/blacklist.conf 

modprobe -r usb_storage

# 查看是否还存在
lsmod|grep usb_storage

```

问题1 : 再插入U盘后,依然会自动安装 usb_stroage, 以下方案解决
```bash
echo "install usb-storage /bin/true" > /etc/modprobe.d/usb-storage.conf
chmod 644 /etc/modprobe.d/usb-storage.conf
update-initramfs -u
reboot
```
文档:https://askubuntu.com/questions/888052/how-to-block-all-usb-storage-devices-in-ubuntu


问题2:  执行 modprobe -r 移除时有报错  Module usb_storage is in use.
```bash
lsmod|grep usb_storage
usb_storage            77824  1  uas
```
先移除对应的 uas, 再移除 usb_storage 就好了
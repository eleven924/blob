---
title: "ubuntu安装系统桌面及VNC服务"
date: 2025-08-05
tags: ["ubuntu"]
---

# ubuntu安装系统桌面及VNC服务

## xfce4 + tinyvnc
参考文档：[How to Install a GUI Desktop for Ubuntu Server with XFCE and VNC](https://docs.vultr.com/install-gui-environment-for-ubuntu)


## gnome + tinyvnc
 
参考文档：[How to Install a GUI Desktop for Ubuntu Server with GNOME and VNC](https://cloud.tencent.com/document/product/213/46001)
注意： 使用哪个用户启动vncserver，客户端登陆后，就是该用户的桌面环境。

 ### 问题1： vnc客户端链接出现灰屏

 修改 .vnc/xstartup文件：

 ```bash
#!/bin/bash
export $(dbus-launch)  # 注意这里如果没有命令，根据提示安装一下
export XKL_XMODMAP_DISABLE=1
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
gnome-panel &
gnome-settings-daemon &
metacity &
nautilus &
gnome-terminal &
xsetroot -solid grey
vncconfig -iconic &
VNCSERVERS="1:ubuntu" 
gnome-session --session=gnome-flashback-metacity --disable-acceleration-check &
 ```

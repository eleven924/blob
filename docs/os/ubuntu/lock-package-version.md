# 禁止安装包更新

某些场景需要禁用系统包自动更新.

涉及到的命令：
- dpkg：列出当前系统安装的包
- apt-mark: 标记指定包的状态

```bash
# 获取linux 内核相关包
dpkg --get-selections | grep -E '^linux-headers-|^linux-image-'|awk '{print $1}'

# 锁定指定包的版本
apt-mark hold $pkg_name

# 查看被锁定的包
apt-mark showhold
# result:
#linux-headers-5.15.0-43
#linux-headers-5.15.0-43-generic
#linux-headers-generic
#linux-image-5.15.0-43-generic
#linux-image-generic

# 解锁指定包
apt-mark unhold $pkg_name
```
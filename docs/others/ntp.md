---
title: "ntp 服务"
tags: ["linux-app"]
date: 2024-07-06
---

# ntp 服务

## ntp 服务介绍

### ntp 服务的几种模式

NTP 中存在三种主要的操作模式：客户端/服务器、对称主动/被动和广播/多播。

*   Client/Server Mode
    客户端/服务器模式是当今 Internet 中最常见的配置。在这种模式下，主机向指定的服务器发送客户端请求，并期望服务器在将来某个时间回复。在某些情况下，这将被描述为“拉”操作，因为主机从服务器拉取时间和相关值。
*   Symmetric Active/Passive Mode
*   Broadcast/Multicast Modes
*   Manycast and Pool Modes

### Burst 选项

当需要以小于最小轮询间隔的时间发送数据包时,会用到 Burst 选项
Burst 有两个选项: burst 和 iburst, 需要配置 server 和 pool 命令使用

*   burst: 此命令在网络抖动严重的情况下或网络连接需要初始呼叫或训练序列时很有用。当最小轮询指数大于 10（1024 秒）时，建议使用此选项。仅当服务器可达时才发送
*   iburst: 仅当服务器无法访问时才发送；特别是第一次启动时。server 和 pool 命令推荐使用该选项。

### Poll 间隔管理

NTP 使用复杂的启发式算法自动控制轮询间隔，以实现与最小网络开销相一致的最大准确性。该算法测量附带偏移和抖动以确定最佳轮询间隔。启动时 ntpd，间隔是默认的最小 64 秒。在时钟规则稳定的正常情况下，间隔会逐步增加到默认的最大值 1024 秒。此外，如果某个服务器在一段时间后变得无法访问，则间隔会逐步增加到最大值，以减少网络开销。

轮询指数: 通过 server 命令的 minpoll 和 maxpoll 选项约束,如果没有配置,则使用默认值: 6（64 秒）和 10（1024 秒），这适用于绝大多数情况。

## ntpd

ntpd 程序是一个操作系统守护进程，可将系统时钟同步到远程 NTP 时间服务器或本地参考时钟。可以在多种模式中的任何一种下运行，包括客户端/服务器、对称和广播模式。

### 常用命令行参数

`-g:` 通常，ntpd 如果 offset 超过 panic 阈值（默认情况下为 1000 秒），则会退出并在系统日志中显示一条消息。此选项允许将时间 设置为任何值而不受限制；但是，这只能发生一次。如果在此之后超过阈值，ntpd 将退出并在系统日志中显示一条消息。该选项可以与 -q 和选项 -x 一起使用。
`-x:` 通过设置此参数,来保证时钟保持渐进的调整,而不会跳跃调整. 以此来防止时间出现向前跳跃调整; 当设置了此项参数最大渐进率被限制为 500 百万分之一.也就是说, 如果本地时钟的偏移量每秒钟超出了 500 PPM（即 0.05%），那么调整本地时钟将需要大约 2000 秒才能使其逐渐(slew)调整到正确的时间。因此，如果需要快速同步网络时间并且需要正确同步分布式应用程序，使用"-x"选项可能不是最好的选择。
`-q:` ntpd 在第一次设置时钟后 退出。此行为模仿将 ntpdate 要停用的程序的行为。和选项可以与此选项-g 一起-x 使用。
`-c:` 指定配置文件的名称和路径。如果没有该选项，则默认为/etc/ntp.conf.
`-f:` 指定频率文件的名称和路径。这与配置命令的操作相同: driftfile driftfile

### 配置文件 ntp.conf

配置格式， [官方文档](https://www.ntp.org/documentation/4.2.8-series/ntp.conf/)

```bash
dpool address [burst] [iburst] [version version] [prefer] [minpoll minpoll] [maxpoll maxpoll] [xmtnonce]

server address [key key | autokey] [burst] [iburst] [version version] [prefer] [minpoll minpoll] [maxpoll maxpoll] [true] [xmtnonce]

peer address [key key | autokey] [version version] [prefer] [minpoll minpoll] [maxpoll maxpoll] [true] [xleave]

broadcast address [key key | autokey] [version version] [prefer] [minpoll minpoll] [ttl ttl] [xleave]

manycastclient address [key key | autokey] [version version] [prefer] [minpoll minpoll] [maxpoll maxpoll] [ttl ttl]
```

key: 认证相关的参数
burst: 当服务器可达时，发送一连串的八个数据包而不是通常的一个。包间隔一般为 2s；但是，可以使用命令更改第一个和第二个数据包之间的间隔 calldelay
iburst: 当服务器无法访问时，发送一连串的八个数据包而不是通常的数据包。包间隔一般为 2s；但是，可以使用命令更改前两个数据包之间的间隔 calldelay
minpoll/maxpoll: 这些选项指定 NTP 消息的最小和最大轮询间隔，以秒为单位的 2 的幂。最大轮询间隔默认为 10（1,024 秒），但可以通过该选项增加到上限 17（36.4 小时）maxpoll。最小轮询间隔默认为 6（64 秒），但可以通过选项将其降低 minpoll 到 4（16 秒）的下限。
prefer: 将服务器标记为首选。在所有其他条件相同的情况下，将选择此主机在一组正确运行的主机之间进行同步。

**访问控制命令:**
`discard`: 用于指定 NTP 客户端是否应该丢弃某些类型的 NTP 数据包。例如，如果 discard 选项设置为 all，则 NTP 客户端将不接收任何 NTP 数据包，这将导致本地计算机的时钟无法与 NTP 服务器进行同步。但是，如果 discard 选项设置为 none，则 NTP 客户端将接收所有类型的 NTP 数据包。通常情况下，discard 选项应该设置为默认值，即不丢弃任何类型的 NTP 数据包。
`restrict`: 选项用于指定 NTP 客户端与 NTP 服务器之间通信的访问控制规则。(部分参数如下)

*   ignore: 拒绝各种数据包，包括 ntpq 和 ntpdc 查询。
*   nomodify: 拒绝 ntpq 和 ntpdc 查询试图修改服务器的状态（即运行时重新配置）。允许返回信息的查询。
*   noquery: 拒绝 ntpq 和 ntpdc 查询。授时不受影响。
*   nopeer: 用于禁止 NTP 客户端作为对等体(peer)与其他 NTP 客户端进行通信。具体来说，nopeer 选项用于限制 NTP 客户端与其他 NTP 客户端之间的通信，只允许它们与 NTP 服务器进行通信。
*   noserve: 拒绝除 ntpq 和 ntpdc 查询之外的所有数据包。
*   version: 拒绝与当前 NTP 版本不匹配的数据包。
*   notrust：不接受没有经过认证的客户端的请求
*   notrap：不接受远程登录请求
    例如下面配置：

```ini
restrict default ignore
restrict 127.0.0.1
```

restrict default ignore 指定默认规则为忽略所有数据包，restrict 127.0.0.1 指定允许本地计算机上的 NTP 服务器与 NTP 客户端进行通信。

**其他配置项：**
tinker \[allan allan | dispersion dispersion | freq freq | huffpuff huffpuff | panic panic | step step | stepback stepback | stepfwd stepfwd | stepout stepout]

*   panic： 参数是阈值，通常为 1000 秒。如果设置为零，则禁用紧急完整性检查，并且将接受任何值的时钟偏移。
*   stepout: 用于指定stepout调整的最大调整量，即本地计算机时钟在一次stepout调整中可以调整的最大时间量
*   stepback: 参数是向后方向的步长阈值，默认为 0.128 s。它可以设置为以秒为单位的任何正数。如果前向和后向步长阈值都设置为零，则永远不会发生步长调整。
*   step: 步长阈值，默认为 0.128 秒。它可以设置为以秒为单位的任何正数。如果设置为零，则永远不会进行阶跃调整。注意：如果步骤阈值设置为零或大于默认值，则内核时间规则将被禁用。当本地计算机的时钟与NTP服务器时间之间的误差超过一定阈值时，ntpd服务将执行step调整，以尽快将本地计算机的时钟与NTP服务器时间同步。tinker step选项用于指定step调整的最大调整量，即本地计算机时钟在一次step调整中可以调整的最大时间量。如果误差超过该阈值，ntpd服务将执行stepout操作，先进行一次短暂的时间跳跃，再执行step调整。

## ntpq

这里列出 ntpq -p 的各列说明。 [官方文档地址](https://www.ntp.org/documentation/4.2.8-series/ntpq/)

| 属性       | 说明                                                                        |
| -------- | ------------------------------------------------------------------------- |
| \[tally] | 表示当前的状态，一个单字符值                                                            |
| remote   | 远端主机名或者IP                                                                 |
| refid    | association ID or kiss code                                               |
| st       | 层级                                                                        |
| t        | u：单播或多播客户端 、 b：广播或多播客户、 p ：池源、l：本地（参考时钟）、s：对称（对等）、A：多播服务器、B：广播服务器、M：多播服务器 |
| when     | 自上次收到数据包以来的秒/分钟/小时,表示远程服务器最后一次响应本地系统的时间，以秒为单位。                            |
| poll     | 轮询间隔（log 2秒）                                                              |
| reach    | 到达移位寄存器（八进制）                                                              |
| delay    | 往返延迟                                                                      |
| offset   | 服务器相对于此主机的偏移量                                                             |
| jitter   | 抖动                                                                        |

| Code | Message        | T  | Description            |
| ---- | -------------- | -- | ---------------------- |
| 0    | sel\_reject    |    | 因无效而丢弃 (TEST10-TEST13) |
| 1    | sel\_falsetick | x  | 被交集算法丢弃                |
| 2    | sel\_excess    | .  | 被表溢出丢弃（未使用）            |
| 3    | sel\_outlier   | -  | 被聚类算法丢弃                |
| 4    | sel\_candidate | +  | 包含在组合算法中               |
| 5    | sel\_backup    | #  | 备份（多于tos maxclock来源）   |
| 6    | sel\_sys.peer  | \* | 系统对端                   |
| 7    | sel\_pps.peer  | o  | PPS 对等体（当首选对等体有效时）     |

链接:
<https://blog.csdn.net/qq_35663625/article/details/103064495>

[什么是NTP](https://info.support.huawei.com/info-finder/encyclopedia/zh/NTP.html)

## 特殊场景实验

### 节点间时区不一致的情况

NTP服务并不会同步时区,但是会考虑时区间的时差  
当手动修改从节点的时间后,经过ntp同步之后,也还是有着时区间的时差，也就是说UTC时间戳一致，但是显示的时间不同

```bash
# 主节点设置时区
[root@4rimehzpwmqv ~]# timedatectl set-timezone America/New_York
[root@4rimehzpwmqv ~]# date
Sat Jun 24 23:37:30 EDT 2023
# ---
# 从节点修改时间
#修改从节点时间,大概15分钟后后查看同步状态。此处应该会触发panic，因为此时的时间已经超过了panic阈值。
[root@4rimehzpwmpv sbin]# ./ntpq -p
     remote           refid      st t when poll reach   delay   offset  jitter
==============================================================================
 4rimehzpwmqv.zs LOCAL(0)         6 u    8   64  377    0.155  +362094 1935476
[root@4rimehzpwmpv sbin]# ./ntpq -p
     remote           refid      st t when poll reach   delay   offset  jitter
==============================================================================
*4rimehzpwmqv.zs LOCAL(0)         6 u   19   32  377    0.183   +0.019   0.011
# 上边可以看到时间虽然同步了，但是显示时间因为时区的时差，所以显示的还是本地时间
[root@4rimehzpwmpv sbin]# date
Sun Jun 25 12:16:18 CST 2023
```


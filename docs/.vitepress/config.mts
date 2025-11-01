import { defineConfig } from 'vitepress'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blob/',
  title: "ElevenNote",
  description: "A notebook",
  themeConfig: {
    footer: {
      message: '本博客内容采用 <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">知识共享署名 4.0 国际许可协议</a> 进行许可。',
      copyright: '<div style="text-align: center; margin-top: 8px;">Copyright © 2025-present <a href="">eleven</a></div>'
    },
    outline: [2,6],
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    //顶部右侧
    // nav: [
    //   { text: 'Home', link: '/' },
    //   // { text: 'Examples', link: '/markdown-examples' }
    // ],
    nav: [
      // ... existing nav items ...
      { text: '标签', link: '/tags' },
      { text: '归档', link: '/archives' }
    ],
    sidebar: {
      "/golang/":[
      {
        text: 'Golang Build',
        items: [
          { text: 'golang 编译二进制文件', link: '/golang/build/go-compile-build' },
          // { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },      
      {
        text: 'Golang Test',
        items: [
          { text: '通过go语言学习测试驱动开发', link: '/golang/test/learn-go-with-test' },
          // { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },
      {
        text: 'Other',
        items: [
          { text: 'windows 下 goland 使用 *_linux.go 代码', link: '/golang/others/goland-use-linuxdep-on-win' },
          { text: 'goland-remote-dev', link: '/golang/others/goland-remote-dev' },
          { text: 'vscode 远程调试 golang 进程', link: '/golang/others/remote-debug-with-vscode' },
          { text: 'Go 开发工具集', link: '/golang/others/dev-tools' },
          // { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],
    "/cicd/":[
      {
        text: 'gitlab CI/CD',
        items: [
          { text: 'gitlab runner install', link: '/cicd/gitlab/gitlab-runner' },
          // { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],
    // os 相关
    "/os/ubuntu":[
      {
        text: 'Ubuntu 系统设置相关',
        items: [
          { text: 'disable usb storage model', link: '/os/ubuntu/disable-usb-stroage-mod'},
          { text: 'lock package verison', link: '/os/ubuntu/lock-package-version'},
          { text: 'download deb package', link: '/os/ubuntu/download-deb-package'},
          { text: 'compile no depend tar command', link: '/os/ubuntu/compile-nodep-tar-command'},
          { text: 'exec command in backend', link: '/os/ubuntu/exec-command-in-backend'},
          { text: 'install desktop', link: '/os/ubuntu/install-desktop-vncserver'},
        ]
      },
    ],
    // kubernetes
    "/kubernetes/k8s":[
      {
        text: 'k8s',
        items: [
          { text: 'k8s 二进制部署', link: '/kubernetes/k8s/binary-installation'},
          { text: 'ingress-nginx 的安装与使用', link: '/kubernetes/k8s/ingress-nginx-install'},
          { text: 'Lease 分布式锁', link: '/kubernetes/k8s/lease-demo'},
          { text: 'k8s 1.26 版本使用 docker 作为运行时', link: '/kubernetes/k8s/k8s-with-docker'},
          { text: '使用NFS作为K8S的持久化存储', link: '/kubernetes/k8s/nfs-install'},
        ]
      },
    ],
    "/kubernetes/k3s":[
      {
        text: 'k3s',
        items: [
          { text: 'k3s install', link: '/kubernetes/k3s/k3s-install'},
        ]
      },
    ],
    "/kubernetes/kubebuilder":[
      {
        text: 'kubebuilder',
        items: [
          { text: 'kubebuilder 初步使用', link: '/kubernetes/kubebuilder/learn-kubebuilder'},
          { text: 'kubebuilder usage issues', link: '/kubernetes/kubebuilder/usage-issues'},
        ]
      },
    ],
    "/kubernetes/controller-runtime":[
      {
        text: 'controller-runtime',
        items: [
          { text: 'ControllerReference or OwnerReference', link: '/kubernetes/controller-runtime/ControllerReference-OwnerReference'},
        ]
      },
    ],
    "/kubernetes/kubevirt":[
      {
        text: 'kubevirt',
        items: [
          { text: 'kubevirt vm 快照回滚', link: '/kubernetes/kubevirt/vm-snapshot-restore'},
        ]
      },
    ],
        "/kubernetes/docker":[
      {
        text: 'docker',
        items: [
          { text: 'docker 多架构构建', link: '/kubernetes/docker/docker-build'},
        ]
      },
    ],
    // elasticsearch started
    "/elasticsearch/base-usage/":[
      {
        text: 'elasticsearch base usage',
        items: [
          { text: '写在开头', link: '/elasticsearch/base-usage/beginning' },
          { text: 'elasticsearch 基础命令示例', link: '/elasticsearch/base-usage/base-command' },
        ]
      }, 
    ],
    // elasticsearch end
    "/others/":[
      {
        text: 'build blob',
        items: [
          { text: 'how to create a blob website', link: '/others/how-to-build-blob' },
          // { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },
      {
        text: 'git operation',
        items: [
          { text: 'git commands', link: '/others/git-command' },
          // { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },
      {
        text: 'gRPC',
        items: [
          { text: 'gRPC 简介', link: '/others/gRPC' },
          { text: 'gRPC 初步学习', link: '/others/gRPC/grpc-learn' },
          { text: 'proto buffer介绍', link: '/others/gRPC/proto-buffer' },
        ]
      },
      {
        text: 'linux-app',
        items: [
          { text: 'ntp服务', link: '/others/ntp' },
        ]
      },
      {
        text: 'tools',
        items: [
          { text: '生成随机密码', link: '/others/tools/random-pwd' },
        ]
      },
      {
        text: '低代码平台',
        items: [
          { text: '低代码平台介绍', link: '/others/low-code-platform' },
        ]
      }
    ],
    "/database/":[
      {
        text: 'point',
        items: [
          { text: 'NULL值问题', link: '/database/point/null-value' },
        ]
      }
    ],},

    // 可以设置外部连接地址
    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    // ]
  }
})

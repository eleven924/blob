import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blob/',
  title: "ElevenNote",
  description: "A notebook",
  themeConfig: {
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
          { text: 'local package verison', link: '/os/ubuntu/lock-package-version'},
        ]
      },
    ],
    // kubernetes
        // os 相关
    "/kubernetes/k3s":[
      {
        text: 'k3s',
        items: [
          { text: 'k3s install', link: '/kubernetes/k3s/k3s-install'},
        ]
      },
    ],

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
      }
    ]},

    // 可以设置外部连接地址
    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    // ]
  }
})

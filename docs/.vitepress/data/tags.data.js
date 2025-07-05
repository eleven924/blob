import { createContentLoader } from 'vitepress'

export default createContentLoader('../**/*.md', {
  includeSrc: true,
  transform(rawData) {
    const tagMap = new Map()
    
    rawData.forEach((page) => {  // 参数改为page以获取完整页面数据
      if (page.frontmatter?.tags) {
        page.frontmatter.tags.forEach(tag => {
          const entry = tagMap.get(tag) || { 
            name: tag, 
            count: 0, 
            posts: []  // 新增文章列表字段
          }
          entry.count++
          entry.posts.push({
            title: page.frontmatter.title || page.url.replace(/\/$/, '')         // 移除末尾斜杠
              .split('/')                 // 分割路径
              .pop()                      // 获取最后一段
              .replace(/\.\w+$/, ''),  
            url: `/blob${page.url}`,
            date: page.frontmatter.date  // 添加日期信息
          })
          tagMap.set(tag, entry)
        })
      }
    })

    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count)
  }
})
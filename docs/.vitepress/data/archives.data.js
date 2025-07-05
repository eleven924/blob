import { createContentLoader } from 'vitepress'

export default createContentLoader('../**/*.md', {
  includeSrc: true,
  transform(rawData) {
    const archiveMap = new Map()

    rawData.forEach(page => {
      if (!page.frontmatter?.date) return
      const date = new Date(page.frontmatter.date)
      const monthKey = date.toISOString().slice(0, 7) // 格式: YYYY-MM
      
      const entry = archiveMap.get(monthKey) || {
        month: monthKey,
        posts: [],
        tags: new Set()
      }

      entry.posts.push({
        title: page.frontmatter.title || page.url.replace(/\/$/, '')         // 移除末尾斜杠
        .split('/')                 // 分割路径
        .pop()                      // 获取最后一段
        .replace(/\.\w+$/, ''),  
        url: `/blob${page.url}`,
        date: date,
        tags: page.frontmatter.tags || []
      })

      if (page.frontmatter.tags) {
        page.frontmatter.tags.forEach(tag => entry.tags.add(tag))
      }

      archiveMap.set(monthKey, entry)
    })

    return Array.from(archiveMap.values())
      .map(archive => ({
        ...archive,
        posts: archive.posts.sort((a, b) => b.date - a.date),
        tags: Array.from(archive.tags)
      }))
      .sort((a, b) => b.month.localeCompare(a.month)) // 按月份倒序
  }
})
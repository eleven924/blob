---
layout: doc
title: 文章归档
---

<script setup>
import { data } from '../.vitepress/data/archives.data.js'
</script>

<div class="archive-list">
  <div v-for="archive in data" class="archive-item">
    <h2 class="month-title">{{ archive.month }}</h2>
          <div 
        v-for="post in archive.posts" 
        :key="post.url" 
        class="post-item">
        <div style="display: flex; justify-content: space-between; align-items: center">
          <a :href="post.url" class="post-link">{{ post.title }}</a>
          <div v-if="post.tags && post.tags.length">
            <span v-for="tag in post.tags" class="tag-item-for-archives" style="display: inline-block; margin-left: 12px; padding: 4px 8px;">
              {{ tag }}
            </span>
          </div> 
        </div>
      </div>
  </div>
</div>
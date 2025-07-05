---
layout: doc
title: 标签总览
---

<script setup>
import { data } from '../.vitepress/data/tags.data.js'
</script>   

<div class="tag-cloud" style="display: flex; gap: 20px; flex-direction: column; row-gap: 20px;">
  <div  
    v-for="tag in data" 
    class="tag-item"
    style="margin-bottom: 20px;">
    {{ tag.name }} ({{ tag.count }})
    <div v-if="tag.posts && tag.posts.length" class="post-list" >
        <div 
          v-for="post in tag.posts" 
          :key="post.url" 
          class="post-item"
          style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <a :href="post.url" class="post-link">{{ post.title }}</a>
          <span style="color: #666; font-size: 0.9em;">{{ post.date }}</span>
        </div>
    </div>
  </div> 
</div>
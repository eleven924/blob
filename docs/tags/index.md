---
layout: doc
title: 标签总览
---

<script setup>
import { data } from '../.vitepress/data/tags.data.js'
</script>   

<div class="tag-cloud" style="display: flex; gap: 40px">
  <div  
    v-for="tag in data" 
    class="tag-item"
    style="margin-bottom: 20px;">
    {{ tag.name }} ({{ tag.count }})
    <div v-if="tag.posts && tag.posts.length" class="post-list" >
        <div 
          v-for="post in tag.posts" 
          :key="post.url" 
          class="post-item">
          <a :href="post.url" class="post-link">{{ post.title }}</a>
        </div>
    </div>
  </div> 
</div>
import './style.css'
import DefaultTheme from 'vitepress/theme';
import { onMounted, onBeforeUnmount } from 'vue';
import mediumZoom from 'medium-zoom';
import { useRouter } from 'vitepress';

export default {
  ...DefaultTheme,
  setup() {
    const router = useRouter();
    let zoom;

    const initZoom = () => {
      if (zoom) zoom.detach(); // 清除旧实例
      zoom = mediumZoom('img:not(.not-zoom)', {
        background: 'var(--vp-c-bg)',
        margin: 24,
        container: {
            top: 60,          // 减少顶部间距
          checkBounds: true ,
        }
      });
    };

    onMounted(() => {
      initZoom();
      router.onAfterRouteChange = () => {
        // 路由变化后重新初始化
        setTimeout(initZoom, 100); // 等待 DOM 更新
      };
    });

    onBeforeUnmount(() => {
      if (zoom) zoom.detach();
    });
  },
};

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 將 base 設為相對路徑，這樣放上 GitHub Pages 任何儲存庫名稱都不會出錯
})

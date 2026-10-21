import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Configura o empacotamento das três partes do Electron:
// - main:     o "cérebro" (Node.js) que roda em segundo plano
// - preload:  a ponte segura entre o cérebro e a interface
// - renderer: a interface visual (React) que você vê na tela
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react()]
  }
})

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.', // Define o diretório raiz como o frontend/
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5041',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'pages/tela-login.html'),
        cadastro: resolve(__dirname, 'pages/tela-cadastro.html'),
        dashboard: resolve(__dirname, 'pages/tela-dashboard.html'),
        gastos: resolve(__dirname, 'pages/tela-gastos.html'),
        categorias: resolve(__dirname, 'pages/tela-categorias.html'),
        relatorios: resolve(__dirname, 'pages/tela-relatorios.html'),
        alertas: resolve(__dirname, 'pages/tela-alertas.html'),
        insights: resolve(__dirname, 'pages/tela-insights.html')
      }
    }
  }
});

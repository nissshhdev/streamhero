// Preload script for StreamHero Electron Desktop App
const { contextBridge } = require('electron');

if (contextBridge && typeof contextBridge.exposeInMainWorld === 'function') {
  contextBridge.exposeInMainWorld('electronDesktop', {
    isDesktop: true,
    platform: process.platform,
    version: process.versions.electron
  });
}

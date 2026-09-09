import '../css/app.css';
import './bootstrap';
import { initThemeSwitcher } from './frontend/themeSwitcher';
import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('theme-switcher-root');
    if (!root) return;
    
    let themes = [];
    let defaultKey = '';

    try {
        themes = JSON.parse(root.dataset.themes || '[]');
        defaultKey = root.dataset.default || '';
    } catch (error) {
        console.error('Invalid theme switcher data', error);
        return;
    }

    initThemeSwitcher(themes, defaultKey);
});

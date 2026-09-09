import { buildPalettesFromTypes } from '../Utils/colorPalettes';
import { applyThemeColors } from '../Utils/applyThemeColors';

const STORAGE_KEY = 'nestify-site-color-theme';

function createMockupHtml(colors) {
    return `
        <div class="w-full rounded-lg overflow-hidden border border-black/5 shadow-sm" style="background-color:${colors.bg}">
            <div class="h-2.5 px-1 flex items-center" style="background-color:${colors.primary}">
                <span class="inline-block size-1 rounded-full bg-white/50"></span>
            </div>
            <div class="p-1.5 flex gap-1">
                <div class="w-1/3 rounded-sm" style="background-color:${colors.accent}; min-height: 22px;"></div>
                <div class="flex-1 flex flex-col gap-0.5 justify-center">
                    <div class="h-1 w-full rounded-sm opacity-80" style="background-color:${colors.heading}"></div>
                    <div class="h-1 w-2/3 rounded-sm opacity-60" style="background-color:${colors.res}"></div>
                    <div class="h-1.5 w-1/2 rounded-sm mt-0.5" style="background-color:${colors.primary}"></div>
                </div>
            </div>
        </div>
    `;
}

function paletteToColors(palette) {
    const colors = { ...palette };
    delete colors.label;
    delete colors.swatch;
    return colors;
}

function renderOptions(container, palettes, activeKey, onSelect) {
    container.innerHTML = '';

    Object.entries(palettes).forEach(([key, palette]) => {
        const colors = paletteToColors(palette);
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.themeKey = key;
        button.title = palette.label || key;
        button.className = [
            'theme-switcher-option flex flex-col gap-2 rounded-xl border-2 p-2.5 min-w-[108px] max-w-[120px] transition-all text-left',
            key === activeKey
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5',
        ].join(' ');

        button.innerHTML = `
            ${createMockupHtml(colors)}
            <span class="text-xs font-semibold capitalize text-center ${key === activeKey ? 'text-primary' : 'text-gray-600'}">${palette.label || key}</span>
        `;

        button.addEventListener('click', () => onSelect(key));
        container.appendChild(button);
    });
}

function updateActiveOption(panel, activeKey) {
    panel.querySelectorAll('.theme-switcher-option').forEach((button) => {
        const isActive = button.dataset.themeKey === activeKey;
        button.classList.toggle('border-primary', isActive);
        button.classList.toggle('ring-2', isActive);
        button.classList.toggle('ring-primary/20', isActive);
        button.classList.toggle('bg-primary/5', isActive);
        button.classList.toggle('scale-[1.02]', isActive);
        button.classList.toggle('border-gray-200', !isActive);
        button.classList.toggle('bg-white', !isActive);

        const label = button.querySelector('span');
        if (label) {
            label.classList.toggle('text-primary', isActive);
            label.classList.toggle('text-gray-600', !isActive);
        }
    });
}

export function initThemeSwitcher(themes = [], defaultKey = '') {
    const root = document.getElementById('theme-switcher-root');
    if (!root || !Array.isArray(themes) || themes.length === 0) {
        return;
    }

    const palettes = buildPalettesFromTypes(themes);
    const paletteKeys = Object.keys(palettes);
    if (paletteKeys.length === 0) {
        return;
    }

    const savedKey = localStorage.getItem(STORAGE_KEY);
    let activeKey = savedKey && palettes[savedKey] ? savedKey : (defaultKey && palettes[defaultKey] ? defaultKey : paletteKeys[0]);

    if (activeKey && palettes[activeKey]) {
        applyThemeColors(paletteToColors(palettes[activeKey]));
    }

    root.innerHTML = `
        <button
            type="button"
            id="theme-switcher-toggle"
            class="fixed z-[130] bottom-[10%] left-5 size-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 transition-all"
            aria-label="Change color appearance"
        >
            <i class="ri-palette-line text-2xl"></i>
        </button>
        <div
            id="theme-switcher-panel"
            class="fixed z-[130] bottom-[10%] left-20 w-[min(92vw,360px)] hidden opacity-0 translate-y-2 transition-all duration-200"
        >
            <div class="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h3 class="text-sm font-bold text-gray-800 capitalize">Color Appearance</h3>
                        <p class="text-xs text-gray-500">Tap a theme to change site colors</p>
                    </div>
                    <button type="button" id="theme-switcher-close" class="size-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center">
                        <i class="ri-close-line text-lg"></i>
                    </button>
                </div>
                <div id="theme-switcher-options" class="flex flex-wrap gap-3 max-h-[50vh] overflow-y-auto"></div>
            </div>
        </div>
    `;

    const toggle = root.querySelector('#theme-switcher-toggle');
    const panel = root.querySelector('#theme-switcher-panel');
    const close = root.querySelector('#theme-switcher-close');
    const options = root.querySelector('#theme-switcher-options');

    const openPanel = () => {
        panel.classList.remove('hidden');
        requestAnimationFrame(() => {
            panel.classList.remove('opacity-0', 'translate-y-2');
        });
    };

    const closePanel = () => {
        panel.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => panel.classList.add('hidden'), 200);
    };

    const selectTheme = (key) => {
        if (!palettes[key]) return;
        activeKey = key;
        localStorage.setItem(STORAGE_KEY, key);
        applyThemeColors(paletteToColors(palettes[key]));
        updateActiveOption(panel, key);
    };

    renderOptions(options, palettes, activeKey, selectTheme);

    toggle.addEventListener('click', () => {
        if (panel.classList.contains('hidden')) {
            openPanel();
        } else {
            closePanel();
        }
    });

    close.addEventListener('click', closePanel);

    document.addEventListener('click', (event) => {
        if (!root.contains(event.target)) {
            closePanel();
        }
    });
}

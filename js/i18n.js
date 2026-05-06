const supportedLangs = ['fr', 'nl', 'en'];
let currentLang = 'fr';
let translations = {};

// Helper to determine base path for GitHub Pages compatibility
const getBasePath = () => {
    // Check if we're not on the root level (e.g. inside rendez-vous/)
    const depth = window.location.pathname.split('/').filter(x => x).length;
    let path = '';
    
    // If running on github.io, the first part of the path is the repo name
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    // If inside a subfolder, we need to go up one level to find the lang directory
    // This is a simple heuristic assuming maximum 1 level deep (rendez-vous/)
    if (window.location.pathname.includes('/rendez-vous/')) {
        return '../';
    }
    
    return './';
};

// Initialize language
async function initLanguage() {
    // 1. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    // 2. Check localStorage
    const storedLang = localStorage.getItem('language');
    
    // 3. Check browser language
    const browserLang = navigator.language.split('-')[0];
    
    if (langParam && supportedLangs.includes(langParam)) {
        currentLang = langParam;
    } else if (storedLang && supportedLangs.includes(storedLang)) {
        currentLang = storedLang;
    } else if (supportedLangs.includes(browserLang)) {
        currentLang = browserLang;
    }
    
    // Save preference
    localStorage.setItem('language', currentLang);
    
    // Set html lang attribute
    document.documentElement.lang = currentLang;
    
    // Update active button
    updateLangButtons();
    
    // Load and apply translations
    await loadTranslations(currentLang);
}

// Load translation file
async function loadTranslations(lang) {
    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang} translations`);
        }
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to french if loading fails and we're not already trying to load french
        if (lang !== 'fr') {
            loadTranslations('fr');
        }
    }
}

// Apply translations to DOM
function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            if (element.tagName === 'META' && element.getAttribute('name') === 'description') {
                element.setAttribute('content', translation);
            } else if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                element.setAttribute('placeholder', translation);
            } else {
                // If it contains HTML inside, we shouldn't overwrite child nodes indiscriminately
                // But for simplicity in this static site, innerHTML works fine.
                element.innerHTML = translation;
            }
        }
    });
}

// Get nested object property using dot notation (e.g., 'nav.home')
function getNestedTranslation(obj, path) {
    return path.split('.').reduce((prev, curr) => {
        return prev ? prev[curr] : null;
    }, obj || self);
}

// Update language buttons UI
function updateLangButtons() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Change language
function setLanguage(lang) {
    if (!supportedLangs.includes(lang) || lang === currentLang) return;
    
    currentLang = lang;
    localStorage.setItem('language', currentLang);
    document.documentElement.lang = currentLang;
    
    // Update URL without reloading
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.pushState({}, '', url);
    
    updateLangButtons();
    loadTranslations(currentLang);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    
    // Language switcher click events
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
});

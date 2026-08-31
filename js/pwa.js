// Bismillah Clinic — js/pwa.js (Service Worker register + Install prompt)
if ('serviceWorker' in navigator && location.protocol !== 'chrome-extension:' && location.hostname !== 'localhost') {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(reg) { console.log('✅ PWA registered'); })
            .catch(function() { /* SW not available */ });
    });
}
// Suppress unhandled SW errors
self.addEventListener('error', function(e) { e.preventDefault(); });

let deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.createElement('button');
    installBtn.textContent = '📥 Install App';
    installBtn.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 25px;background:#27ae60;color:white;border:none;border-radius:25px;font-weight:bold;box-shadow:0 5px 20px rgba(0,0,0,0.3);z-index:9999;cursor:pointer;font-family:inherit;';
    installBtn.onclick = async function() {
        installBtn.remove();
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    };
    document.body.appendChild(installBtn);
    setTimeout(function() { if (installBtn.parentNode) installBtn.remove(); }, 15000);
});

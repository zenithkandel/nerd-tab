// modules/ui.js
export function initUI() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            if(!targetId) return;

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Update active view
            viewSections.forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });
            
            const targetView = document.getElementById('view-' + targetId);
            if(targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active');
            }
        });
    });

    // Time and Date Update
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');

    function updateTime() {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
    
    updateTime();
    setInterval(updateTime, 60000);
}

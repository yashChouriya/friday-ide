class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.sidebarPanel = document.querySelector('.sidebar-panel');
        this.collapseButton = document.querySelector('.collapse-button');
        this.activityButtons = document.querySelectorAll('.activity-button');
        
        this.initialize();
    }

    initialize() {
        // Set up collapse button handler
        this.collapseButton.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Set up activity button handlers
        this.activityButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleActivityButtonClick(button);
            });
        });
    }

    toggleSidebar() {
        const isCollapsed = this.sidebarPanel.classList.toggle('collapsed');
        
        // Store the state
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        
        // Rotate the collapse button icon
        const icon = this.collapseButton.querySelector('i');
        icon.style.transform = isCollapsed ? 'rotate(180deg)' : '';
    }

    handleActivityButtonClick(clickedButton) {
        // Toggle active state
        this.activityButtons.forEach(button => {
            button.classList.toggle('active', button === clickedButton);
        });

        // If clicking the active button when sidebar is collapsed, expand it
        if (clickedButton.classList.contains('active') && 
            this.sidebarPanel.classList.contains('collapsed')) {
            this.sidebarPanel.classList.remove('collapsed');
            localStorage.setItem('sidebarCollapsed', false);
        }
    }

    // Restore saved state
    restoreState() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            this.sidebarPanel.classList.add('collapsed');
            const icon = this.collapseButton.querySelector('i');
            icon.style.transform = 'rotate(180deg)';
        }
    }
}
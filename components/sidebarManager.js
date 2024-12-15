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

        // Set up explorer toggle button
        const explorerButton = document.getElementById('toggle-explorer');
        if (explorerButton) {
            explorerButton.addEventListener('click', () => {
                // Toggle the sidebar state
                this.toggleSidebar();
                // Keep the explorer button active
                explorerButton.classList.add('active');
            });
        }

        // Set up other activity button handlers
        this.activityButtons.forEach(button => {
            if (button.id !== 'toggle-explorer') { // Skip explorer button as it's handled above
                button.addEventListener('click', () => {
                    this.handleActivityButtonClick(button);
                });
            }
        });
    }

    toggleSidebar(forceState = null) {
        // If forceState is provided, set that state
        // Otherwise toggle current state
        const willCollapse = forceState !== null ? forceState : !this.sidebarPanel.classList.contains('collapsed');
        
        if (willCollapse) {
            this.sidebarPanel.classList.add('collapsed');
        } else {
            this.sidebarPanel.classList.remove('collapsed');
        }
        
        // Store the state
        localStorage.setItem('sidebarCollapsed', willCollapse);
        
        // Rotate the collapse button icon
        const icon = this.collapseButton.querySelector('i');
        icon.style.transform = willCollapse ? 'rotate(180deg)' : '';
        
        return willCollapse;
    }

    handleActivityButtonClick(clickedButton) {
        // Special handling for explorer button
        if (clickedButton.id === 'toggle-explorer') {
            // Keep explorer button active unless another button is clicked
            if (!clickedButton.classList.contains('active')) {
                clickedButton.classList.add('active');
            }
        } else {
            // For other buttons, toggle active state as usual
            this.activityButtons.forEach(button => {
                button.classList.toggle('active', button === clickedButton);
            });
        }

        // Handle sidebar expansion
        if (clickedButton.classList.contains('active') && 
            this.sidebarPanel.classList.contains('collapsed')) {
            this.sidebarPanel.classList.remove('collapsed');
            localStorage.setItem('sidebarCollapsed', false);
            
            // Update collapse button icon
            const icon = this.collapseButton.querySelector('i');
            icon.style.transform = '';
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
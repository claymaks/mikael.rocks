document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-toggle-icon');
    const body = document.body;

    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply the saved theme
    if (currentTheme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    } else {
        body.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }

    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
        const currentTheme = body.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            // Switch to light mode
            body.removeAttribute('data-theme');
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to dark mode
            body.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    });

    // Text box functionality
    initTextBoxes();
});

function initTextBoxes() {
    const textBoxes = document.querySelectorAll('.text-box');
    
    textBoxes.forEach(textBox => {
        // Add resize anchors
        addResizeAnchors(textBox);
        
        // Load saved position and size
        loadTextBoxState(textBox);
        
        // Add event listeners
        setupTextBoxEvents(textBox);
    });
    
    // Add global click handler to clear selection when clicking outside text boxes
    document.addEventListener('click', function(e) {
        // Check if the click was on a text box or its children (including anchors)
        const clickedTextBox = e.target.closest('.text-box');
        
        if (!clickedTextBox) {
            // Click was outside all text boxes, clear all selections
            textBoxes.forEach(textBox => {
                textBox.classList.remove('selected');
            });
        }
    });
    
    // Add global touch handler for mobile
    document.addEventListener('touchstart', function(e) {
        // Check if the touch was on a text box or its children (including anchors)
        const touchedTextBox = e.target.closest('.text-box');
        
        if (!touchedTextBox) {
            // Touch was outside all text boxes, clear all selections
            textBoxes.forEach(textBox => {
                textBox.classList.remove('selected');
            });
        }
    });
}

function addResizeAnchors(textBox) {
    const anchors = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    
    anchors.forEach(position => {
        const anchor = document.createElement('div');
        anchor.className = `resize-anchor ${position}`;
        anchor.dataset.position = position;
        textBox.appendChild(anchor);
    });
}

function setupTextBoxEvents(textBox) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    let dragStartX, dragStartY;
    let currentAnchor = null;
    
    // Helper function to get coordinates from mouse or touch events
    function getEventCoordinates(e) {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    }
    
    // Helper function to select a text box (show anchors)
    function selectTextBox() {
        // Clear selection from all other text boxes
        document.querySelectorAll('.text-box').forEach(box => {
            if (box !== textBox) {
                box.classList.remove('selected');
            }
        });
        // Select this text box
        textBox.classList.add('selected');
    }
    
    // Handler for starting drag operation
    function handleDragStart(e) {
        // Don't start drag if clicking on a resize anchor
        if (e.target.classList.contains('resize-anchor')) {
            return;
        }
        
        // Select the text box when touched/clicked
        selectTextBox();
        
        const coords = getEventCoordinates(e);
        isDragging = true;
        dragStartX = coords.clientX;
        dragStartY = coords.clientY;
        startX = coords.clientX;
        startY = coords.clientY;
        
        const rect = textBox.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        startLeft = (rect.left / viewportWidth) * 100;
        startTop = (rect.top / viewportHeight) * 100;
        
        textBox.classList.add('dragging');
        e.preventDefault();
    }
    
    // Mouse and touch down on text box (for dragging)
    textBox.addEventListener('mousedown', handleDragStart);
    textBox.addEventListener('touchstart', handleDragStart);
    
    // Handler for starting resize operation
    function handleResizeStart(e) {
        if (!e.target.classList.contains('resize-anchor')) {
            return;
        }
        
        // Select the text box when resizing starts
        selectTextBox();
        
        const coords = getEventCoordinates(e);
        isResizing = true;
        currentAnchor = e.target.dataset.position;
        startX = coords.clientX;
        startY = coords.clientY;
        
        const rect = textBox.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        startLeft = (rect.left / viewportWidth) * 100;
        startTop = (rect.top / viewportHeight) * 100;
        startWidth = (rect.width / viewportWidth) * 100;
        startHeight = (rect.height / viewportHeight) * 100;
        
        textBox.classList.add('resizing');
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Mouse and touch down on resize anchors
    textBox.addEventListener('mousedown', handleResizeStart);
    textBox.addEventListener('touchstart', handleResizeStart);
    
    // Mouse/touch move handler
    function handleMouseMove(e) {
        const coords = getEventCoordinates(e);
        
        if (isDragging) {
            const deltaX = coords.clientX - startX;
            const deltaY = coords.clientY - startY;
            
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const newLeft = startLeft + (deltaX / viewportWidth) * 100;
            const newTop = startTop + (deltaY / viewportHeight) * 100;
            
            // Keep within viewport bounds
            const clampedLeft = Math.max(0, Math.min(newLeft, 95));
            const clampedTop = Math.max(0, Math.min(newTop, 95));
            
            textBox.style.left = clampedLeft + '%';
            textBox.style.top = clampedTop + '%';
        }
        
        if (isResizing) {
            handleResize(coords, textBox, startX, startY, startLeft, startTop, startWidth, startHeight, currentAnchor);
        }
    }
    
    // Mouse/touch up handler
    function handleMouseUp() {
        if (isDragging) {
            isDragging = false;
            textBox.classList.remove('dragging');
            saveTextBoxState(textBox);
        }
        
        if (isResizing) {
            isResizing = false;
            textBox.classList.remove('resizing');
            saveTextBoxState(textBox);
        }
        
        // Remove global listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
    }
    
    // Add global listeners when dragging/resizing starts
    function addGlobalListeners() {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove);
        document.addEventListener('touchend', handleMouseUp);
    }
    
    textBox.addEventListener('mousedown', addGlobalListeners);
    textBox.addEventListener('touchstart', addGlobalListeners);
    
    // Handle link clicks vs drags for both mouse and touch
    if (textBox.tagName === 'A') {
        function handleLinkClick(e) {
            // Only check drag distance if we have valid start coordinates
            if (dragStartX !== undefined && dragStartY !== undefined) {
                const coords = getEventCoordinates(e);
                const dragDistance = Math.sqrt(
                    Math.pow(coords.clientX - dragStartX, 2) + 
                    Math.pow(coords.clientY - dragStartY, 2)
                );
                
                // If mouse moved more than 5px, prevent navigation
                if (dragDistance > 5) {
                    e.preventDefault();
                    return false;
                }
            }
        }
        
        textBox.addEventListener('click', handleLinkClick);
        textBox.addEventListener('touchend', handleLinkClick);
    }
}

function handleResize(coords, textBox, startX, startY, startLeft, startTop, startWidth, startHeight, currentAnchor) {
    const deltaX = coords.clientX - startX;
    const deltaY = coords.clientY - startY;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const deltaXPercent = (deltaX / viewportWidth) * 100;
    const deltaYPercent = (deltaY / viewportHeight) * 100;
    
    let newLeft = startLeft;
    let newTop = startTop;
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    // Handle different anchor positions
    switch (currentAnchor) {
        case 'nw':
            newLeft = startLeft + deltaXPercent;
            newTop = startTop + deltaYPercent;
            newWidth = startWidth - deltaXPercent;
            newHeight = startHeight - deltaYPercent;
            break;
        case 'n':
            newTop = startTop + deltaYPercent;
            newHeight = startHeight - deltaYPercent;
            break;
        case 'ne':
            newTop = startTop + deltaYPercent;
            newWidth = startWidth + deltaXPercent;
            newHeight = startHeight - deltaYPercent;
            break;
        case 'e':
            newWidth = startWidth + deltaXPercent;
            break;
        case 'se':
            newWidth = startWidth + deltaXPercent;
            newHeight = startHeight + deltaYPercent;
            break;
        case 's':
            newHeight = startHeight + deltaYPercent;
            break;
        case 'sw':
            newLeft = startLeft + deltaXPercent;
            newWidth = startWidth - deltaXPercent;
            newHeight = startHeight + deltaYPercent;
            break;
        case 'w':
            newLeft = startLeft + deltaXPercent;
            newWidth = startWidth - deltaXPercent;
            break;
    }
    
    // Enforce minimum sizes (in percentage)
    const minWidth = 5; // 5% of viewport width
    const minHeight = 3; // 3% of viewport height
    
    if (newWidth < minWidth) {
        if (currentAnchor.includes('w')) {
            newLeft = startLeft + startWidth - minWidth;
        }
        newWidth = minWidth;
    }
    
    if (newHeight < minHeight) {
        if (currentAnchor.includes('n')) {
            newTop = startTop + startHeight - minHeight;
        }
        newHeight = minHeight;
    }
    
    // Keep within viewport bounds
    newLeft = Math.max(0, Math.min(newLeft, 95));
    newTop = Math.max(0, Math.min(newTop, 95));
    
    // Apply the changes
    textBox.style.left = newLeft + '%';
    textBox.style.top = newTop + '%';
    textBox.style.width = newWidth + '%';
    textBox.style.height = newHeight + '%';
}

function saveTextBoxState(textBox) {
    const id = getTextBoxId(textBox);
    const state = {
        left: textBox.style.left,
        top: textBox.style.top,
        width: textBox.style.width,
        height: textBox.style.height
    };
    
    localStorage.setItem(`textbox-${id}`, JSON.stringify(state));
}

function loadTextBoxState(textBox) {
    const id = getTextBoxId(textBox);
    const savedState = localStorage.getItem(`textbox-${id}`);
    
    if (savedState) {
        const state = JSON.parse(savedState);
        textBox.style.left = state.left;
        textBox.style.top = state.top;
        textBox.style.width = state.width;
        textBox.style.height = state.height;
    }
}

function getTextBoxId(textBox) {
    // Create a unique ID based on class and content
    const classes = Array.from(textBox.classList).filter(c => c !== 'text-box').join('-');
    const content = textBox.textContent.trim().substring(0, 20).replace(/\s+/g, '-');
    return `${classes}-${content}`;
}

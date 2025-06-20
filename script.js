document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-toggle-icon');
    const body = document.body;

    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    
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
    
    // Mouse down on text box (for dragging)
    textBox.addEventListener('mousedown', (e) => {
        // Don't start drag if clicking on a resize anchor
        if (e.target.classList.contains('resize-anchor')) {
            return;
        }
        
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseFloat(textBox.style.left) || 0;
        startTop = parseFloat(textBox.style.top) || 0;
        
        textBox.classList.add('dragging');
        e.preventDefault();
    });
    
    // Mouse down on resize anchors
    textBox.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resize-anchor')) {
            return;
        }
        
        isResizing = true;
        currentAnchor = e.target.dataset.position;
        startX = e.clientX;
        startY = e.clientY;
        
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
    });
    
    // Handle link clicks vs drags
    if (textBox.tagName === 'A') {
        textBox.addEventListener('click', (e) => {
            const dragDistance = Math.sqrt(
                Math.pow(e.clientX - dragStartX, 2) + 
                Math.pow(e.clientY - dragStartY, 2)
            );
            
            // If mouse moved more than 5px, prevent navigation
            if (dragDistance > 5) {
                e.preventDefault();
                return false;
            }
        });
    }
}

// Global mouse move and up events
document.addEventListener('mousemove', (e) => {
    const draggingBox = document.querySelector('.text-box.dragging');
    const resizingBox = document.querySelector('.text-box.resizing');
    
    if (draggingBox) {
        handleDrag(e, draggingBox);
    }
    
    if (resizingBox) {
        handleResize(e, resizingBox);
    }
});

document.addEventListener('mouseup', () => {
    const draggingBox = document.querySelector('.text-box.dragging');
    const resizingBox = document.querySelector('.text-box.resizing');
    
    if (draggingBox) {
        draggingBox.classList.remove('dragging');
        saveTextBoxState(draggingBox);
    }
    
    if (resizingBox) {
        resizingBox.classList.remove('resizing');
        saveTextBoxState(resizingBox);
    }
});

function handleDrag(e, textBox) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
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

function handleResize(e, textBox) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
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

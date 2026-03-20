function openInvitation() {
    const btn = document.querySelector('.open-btn');
    const container = document.querySelector('.card-container');
    
    // Temporarily pause the animation and add a click effect
    btn.style.animation = 'none';
    btn.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
        
        // Trigger the transition to show inner section
        container.classList.add('opened');
        
        // Autoplay background music
        const musicIframe = document.getElementById('bgMusic');
        if (musicIframe) {
            let src = musicIframe.src;
            
            // Convert standard share links to embed links for iframe compatibility
            const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            if (ytMatch && ytMatch[1]) {
                src = `https://www.youtube.com/embed/${ytMatch[1]}`;
            }
            
            if (!src.includes('autoplay=1')) {
                musicIframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
            }
        }
    }, 200);
}

function openPopup(popupId) {
    const container = document.querySelector('.card-container');
    
    // Hide all popup contents first
    document.querySelectorAll('.popup-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show requested content
    const target = document.getElementById('popup-' + popupId);
    if(target) {
        target.classList.add('active');
        container.classList.add('popup-active');
    }
}

function closePopup() {
    const container = document.querySelector('.card-container');
    container.classList.remove('popup-active');
}

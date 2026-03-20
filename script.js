function openInvitation() {
    const btn = document.querySelector('.open-btn');
    const container = document.querySelector('.card-container');
    
    // --- FIX: Play music synchronously ---
    // Browsers block autoplay if the code is inside an asynchronous setTimeout because it loses the "user click" permission.
    const musicIframe = document.getElementById('bgMusic');
    if (musicIframe) {
        let src = musicIframe.src;
        
        // If enablejsapi=1 is present, use postMessage for instant, seamless playback without reloading the iframe
        if (src.includes('enablejsapi=1')) {
            // Seek to exactly 0.01 seconds first, then play
            musicIframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0.01, true]}', '*');
            musicIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } else {
            // Fallback: reload the iframe with autoplay=1 SYNCHRONOUSLY
            if (!src.includes('youtube.com/embed') && !src.includes('youtube-nocookie.com/embed')) {
                const ytMatch = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                if (ytMatch && ytMatch[1]) {
                    src = `https://www.youtube.com/embed/${ytMatch[1]}?`;
                }
            }
            if (!src.includes('autoplay=1')) {
                musicIframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
            } else if (!src.includes('clicked=1')) {
                musicIframe.src = src + '&clicked=1';
            }
        }
    }

    // Temporarily pause the animation and add a click effect
    btn.style.animation = 'none';
    btn.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
        
        // Trigger the transition to show inner section
        container.classList.add('opened');
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

// Countdown Logic
function updateCountdown() {
    const targetDate = new Date("May 16, 2026 00:00:00").getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        if(daysEl) {
            daysEl.innerText = days.toString().padStart(2, '0');
            document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
            document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
            document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
        }
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();

// Scroll Animation Observer
document.addEventListener("DOMContentLoaded", () => {
    const scrollContainer = document.querySelector('.invitation-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Because we are now observing the parent sections, we animate their children
            const animatables = entry.target.querySelectorAll('.scroll-flower, .glass-panel, .doa-section');
            if (entry.isIntersecting) {
                animatables.forEach(el => el.classList.add('animate-in'));
            } else {
                animatables.forEach(el => el.classList.remove('animate-in'));
            }
        });
    }, { 
        root: scrollContainer,
        threshold: 0.1 
    });

    // Observe the giant static parent divs, NOT the absolute positioned images!
    document.querySelectorAll('.details-section, .aturcara-section').forEach(section => {
        observer.observe(section);
    });

    // Observer for Hero Section (Rise up and fade out)
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio < 0.6) {
                entry.target.classList.add('fade-up-out');
            } else {
                entry.target.classList.remove('fade-up-out');
            }
        });
    }, { 
        root: scrollContainer,
        threshold: [0, 0.6] 
    });

    const heroSection = document.querySelector('.hero-section');
    if (heroSection) heroObserver.observe(heroSection);
});

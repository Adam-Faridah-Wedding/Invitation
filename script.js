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
        
        // Completely unlock native browser root scrolling so AOS reads manual smartphone touch events flawlessly
        document.body.style.overflow = 'visible';

        // Extremely critical: AOS initialized while the container was display:none, so it set all Y-coordinates to 0.
        // We must force a hard refresh now that the layout exists so it resets animations to their true bottom coordinates!
        setTimeout(() => {
            AOS.refresh();
        }, 100);

        // Start an elegant auto-scroll shortly after the initial cover fade-in
        setTimeout(() => {
            let isAutoScrolling = true;
            let currentY = window.scrollY;

            // Immediately stop auto-scrolling if the guest touches the screen or scrolls manually
            const stopScroll = () => { isAutoScrolling = false; };
            window.addEventListener('touchstart', stopScroll, { once: true, passive: true });
            window.addEventListener('wheel', stopScroll, { once: true, passive: true });
            window.addEventListener('mousedown', stopScroll, { once: true, passive: true });

            let lastTime = null;
            function scrollStep(timestamp) {
                if (!isAutoScrolling) return;

                if (!lastTime) lastTime = timestamp;
                const deltaTime = timestamp - lastTime;
                lastTime = timestamp;

                // Real-world speed: 25 pixels per literal second exactly.
                currentY += (25 * deltaTime) / 1000; 
                window.scrollTo(0, currentY);

                // Continue recursively until hit absolute bottom of native body
                if (currentY < document.body.scrollHeight - window.innerHeight) {
                    requestAnimationFrame(scrollStep);
                }
            }
            
            requestAnimationFrame(scrollStep);
        }, 500);

    }, 200);
}

function openPopup(popupId) {
    if (window.event) window.event.preventDefault(); // Stop the 'href=#' from shooting the page back to the top
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
    if (window.event) window.event.preventDefault();
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

// AOS Animation Library Initialization
document.addEventListener("DOMContentLoaded", () => {
    
    // Initialize standard AOS
    AOS.init({
        duration: 1000,
        once: true, // Crucial for mobile touchscreen: locks animations ON so finger swipe micro-stutters don't erase them
        mirror: false, // Prevents elements from disappearing instantly when scrolling backwards
        offset: 50,
        easing: 'ease'
    });

    // Keep custom parallax floating logic strictly for the hero section since AOS is entrance-heavy
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio < 0.6) {
                entry.target.classList.add('fade-up-out');
            } else {
                entry.target.classList.remove('fade-up-out');
            }
        });
    }, { 
        // We use default window root now because layout transitioned to native scrolling
        threshold: [0, 0.6] 
    });

    const heroSection = document.querySelector('.hero-section');
    if (heroSection) heroObserver.observe(heroSection);
});

// Global GSAP timeline/tweens
let bounceTween;

function openInvitation() {
    const btn = document.querySelector('.open-btn');
    const container = document.querySelector('.card-container');

    // Kill the infinite GSAP bounce cleanly before we animate
    if (bounceTween) bounceTween.kill();
    gsap.set(btn, { y: 0 }); // Reset position safely
    
    // Play music synchronously
    const musicIframe = document.getElementById('bgMusic');
    if (musicIframe) {
        let src = musicIframe.src;
        if (src.includes('enablejsapi=1')) {
            musicIframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0.01, true]}', '*');
            musicIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } else {
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


    // GSAP Timeline for opening exactly replacing the CSS behavior
    const tl = gsap.timeline({
        onStart: () => {
            document.body.style.overflow = 'visible';
            // Need to remove display:none on invitation-section early so GSAP can calculate it
            const invSection = document.querySelector('.invitation-section');
            invSection.style.display = 'block';
            invSection.style.opacity = '1'; // Make it visible IMMEDIATELY so entrance animations can be seen!
        },
        onComplete: () => {
            container.classList.add('opened');
            setTimeout(() => { ScrollTrigger.refresh(); }, 100);

            // Start continuous GSAP inner flower sway natively!
            gsap.to('.inner-flower', {
                rotation: 3,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: 0.2
            });
            
            // Auto-scroll logic
            setTimeout(() => {
                let isAutoScrolling = true;
                let currentY = window.scrollY;

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

                    currentY += (25 * deltaTime) / 1000; 
                    window.scrollTo(0, currentY);

                    if (currentY < document.body.scrollHeight - window.innerHeight) {
                        requestAnimationFrame(scrollStep);
                    }
                }
                requestAnimationFrame(scrollStep);
            }, 500);
        }
    });

    // 1. Button press effect (snappy press and pop)
    tl.to(btn, { scale: 0.9, duration: 0.1, ease: "power1.out" })
        .to(btn, { scale: 1, duration: 0.2, ease: "back.out(2)" })
      // 2. Cover Section morphs away overlapping the pop-back effect!
        .to('.cover-section', { scale: 1.05, autoAlpha: 0, duration: 0.8, ease: "power2.inOut" }, "<0.1")
      // 3. Inner Flowers smoothly slide in from the outer edge to their origin
        .fromTo('.inner-flower', 
            { 
                x: (i, target) => target.classList.contains('flower-5') ? 0 : -150, 
                y: (i, target) => target.classList.contains('flower-5') ? 150 : 0, 
                opacity: 0 
            },
            { x: 0, y: 0, opacity: 1, duration: 1.8, ease: "power2.out" }, 
            "-=0.5"
        )
      // 4. Invitation Content gently lifts into place
        .fromTo('.invitation-content', 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
            "-=0.9"
        );
}

// Global Timeline for Modals
let popupTl = null;

function initPopupTimeline() {
    if (popupTl) return; // Only initialize once
    
    // Explicitly zero out absolute pixel translations and safely animate using pure Percentages
    gsap.set('.popup-overlay', { autoAlpha: 0 });
    gsap.set('.popup-container', { x: 0, y: 0, xPercent: -50, yPercent: 100 });
    
    // Create explicitly paused timeline
    popupTl = gsap.timeline({ paused: true })
        .to('.popup-overlay', { autoAlpha: 1, duration: 0.3, pointerEvents: 'all' }, 0)
        .to('.popup-container', { yPercent: 0, duration: 0.4, ease: "power3.out" }, 0);
}

function openPopup(event, popupId) {
    if (event) event.preventDefault();
    if (!popupTl) initPopupTimeline();
    
    // Hide all popup contents directly
    document.querySelectorAll('.popup-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // Show requested content block
    const target = document.getElementById('popup-' + popupId);
    if(target) {
        target.style.display = 'flex';
        target.classList.add('active');
        
        // Play GSAP slide-up animation
        popupTl.play();
    }
}

function closePopup(event) {
    if (event) event.preventDefault();
    if (popupTl) {
        // Reverse GSAP animation perfectly back to hidden state
        popupTl.reverse();
        // Since timelines are extremely fast, we don't strictly need to reset display:none on children,
        // but it's good practice to ensure cleanliness
    }
}

// iOS Safari / Multi-Platform native Apple Calendar ICS file generator
function downloadICS(event) {
    if (event) event.preventDefault();
    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260516T033000Z
DTEND:20260516T090000Z
SUMMARY:Majlis Perkahwinan Adam & Faridah
DESCRIPTION:Dengan segala hormatnya kami menjemput ke majlis perkahwinan putera kami.
LOCATION:Dewan Seri Mutiara, Karangan, Kedah
END:VEVENT
END:VCALENDAR`;

    // Detect iOS specifically because it notoriously blocks Data URI Blob downloads but natively parses explicit Base64 text/calendar
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        window.location.href = "data:text/calendar;base64," + btoa(icsContent);
    } else {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'majlis_adam_faridah.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
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

// Animation Initialization
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initialize GSAP bounce on the Open Button
    bounceTween = gsap.to('.open-btn', {
        y: -12,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });

    // 2. Infinitely sway background scroll flowers relatively from their resting CSS rotation
    gsap.to('.scroll-flower', {
        rotation: "+=4", 
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5
    });

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Scroll animations using GSAP ScrollTrigger
    const scrollElements = gsap.utils.toArray('.countdown-wrapper, .glass-panel, .glass-panel > *, .aturcara-panel > *, .doa-section > *, .scroll-flower-wrapper');
    
    scrollElements.forEach(el => {
        // Headers get a gentle zoom-in, normal content gets a slide-up
        const isHeader = el.tagName.toLowerCase() === 'h2' || el.tagName.toLowerCase() === 'h3';
        
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%", // Trigger when top of element hits 85% down viewport
                toggleActions: "play none none reverse" // Replays seamlessly on scroll up and down
            },
            y: isHeader ? 0 : 50,
            scale: isHeader ? 0.8 : 1,
            opacity: 0,
            duration: 1.2,
            ease: "power2.out"
        });
    });

    // Smooth GSAP scroll-driven fade out for the Hero section (replaces custom IntersectionObserver)
    gsap.to('.hero-section', {
        scrollTrigger: {
            trigger: '.hero-section',
            start: "top top",
            end: "bottom 30%",
            scrub: true // Ties the animation smoothly directly to the scrollbar
        },
        y: -80,
        opacity: 0,
        ease: "none"
    });
});

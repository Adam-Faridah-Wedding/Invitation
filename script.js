// Global GSAP timeline/tweens
let bounceTween;

function openInvitation() {
    const btn = document.querySelector('.open-btn');
    const container = document.querySelector('.card-container');

    // Kill the infinite GSAP bounce cleanly before we animate
    if (bounceTween) bounceTween.kill();
    gsap.set(btn, { y: 0 }); // Reset position safely
    
    // Play background video strictly natively
    const bgAudio = document.getElementById('bgAudio');
    if (bgAudio) {
        bgAudio.play().catch(e => console.warn("Video autoplay blocked by browser:", e));
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

            // Initialize Scatter Effect strictly AFTER entrance animation concludes
            const heroFlowers = [
                { selector: '.flower-1', x: -150, y: -150, rotation: -15 }, // Top flora
                { selector: '.flower-2', x: -200, y: -50, rotation: -25 },  // Mid flora
                { selector: '.flower-3', x: -250, y: 0, rotation: 15 },     // Lower flora
                { selector: '.flower-4', x: -200, y: 100, rotation: -20 },  // Bottom flora
                { selector: '.flower-5', x: 0, y: 250, rotation: 15 } // Corner flora: aggressively peels straight down the Y axis
            ];
        
            heroFlowers.forEach(flower => {
                gsap.to(flower.selector, {
                    scrollTrigger: {
                        trigger: '.hero-section',
                        start: "top top",
                        end: "bottom center",
                        scrub: true
                    },
                    x: flower.x,
                    y: flower.y,
                    rotation: flower.rotation,
                    opacity: 0,
                    ease: "none"
                });
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

// Copy to Clipboard Utility
function copyText(button, text) {
    // Elegant fallback for non-secure contexts (http) or older iOS
    if (!navigator.clipboard || !window.isSecureContext) {
        fallbackCopy(text, button);
        return;
    }
    navigator.clipboard.writeText(text).then(() => showCopySuccess(button)).catch(() => fallbackCopy(text, button));
}

function fallbackCopy(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showCopySuccess(button);
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
}

function showCopySuccess(button) {
    const originalClass = button.className;
    const originalColor = button.style.color;
    
    button.className = 'fa-solid fa-check copy-icon';
    button.style.color = '#25D366'; // Green success visual
    
    setTimeout(() => {
        button.className = originalClass;
        button.style.color = originalColor;
    }, 2000);
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
    
    // Dynamically fetch the video and assign it as a Blob URL!
    fetch('song/background-music.mp4')
        .then(res => res.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const bgAudio = document.getElementById('bgAudio');
            if (bgAudio) {
                bgAudio.src = blobUrl;
                bgAudio.load(); // Intelligently tells the browser to load the new Blob source
            }
        })
        .catch(err => console.error('Error creating Blob URL:', err));

    // 0. Dial out to database and silently retrieve the live Wish list
    fetchWishes();

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
    const scrollElements = gsap.utils.toArray('.countdown-wrapper, .glass-panel, .glass-panel > *, .aturcara-panel > *, .doa-section > *, .wish-section > *');
    
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


    // Reveal Inwards Effect for Details Section Flowers
    // Flowers start pushed outward (off-screen) and majestically assemble INWARDS to their resting CSS positions as you scroll!
    const detailsFlowers = [
        { selector: '.s-flower-1', x: 250, y: -200, rotation: 30 }, // Top Right flora starts far up-right
        { selector: '.s-flower-2', x: 200, y: -100, rotation: 20 }, // Mid Right flora starts far right
        { selector: '.s-flower-3', x: 250, y: 50, rotation: -15 },  // Lower Right flora starts far right
        { selector: '.s-flower-4', x: -250, y: 150, rotation: -25 },// Bottom Left flora starts far down-left
        { selector: '.s-flower-5', x: 200, y: 200, rotation: 35 }   // Bottom Right flora starts far down-right
    ];

    detailsFlowers.forEach(flower => {
        gsap.from(flower.selector, {
            scrollTrigger: {
                trigger: '.details-section',
                start: "top 90%", // Starts assembling right as the section enters the bottom of the screen
                end: "center center", // Fully assembled gracefully at their real CSS positions when centered
                scrub: true
            },
            x: flower.x,
            y: flower.y,
            rotation: flower.rotation,
            opacity: 0,
            ease: "none" // Crucial for smooth scrubbing
        });
    });

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

// Submit RSVP form and securely transmit data to Google Sheets via Apps Script Fetch API
function submitRSVP(event) {
    event.preventDefault();
    const form = document.getElementById('rsvpForm');
    const guestName = document.getElementById('rsvpName').value.trim();
    const wish = document.getElementById('rsvpWish').value.trim();
    const guests = document.getElementById('rsvpGuests').value;
    
    // IMPORTANT: Replace this placeholder with your generated Google Web App URL!
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyECOWRFdPID9Zc0tfXIgvMaOpyM0QxVW66AxRfg5yKJ5_TrOp1u51CCnkY1lNVujKRbQ/exec';
    
    // Disabling button to prevent double-clicks during transmission loading time
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sending safely...";
    submitBtn.disabled = true;

    // Pack the fields identically to the Google Apps Script expected keys
    const formData = new FormData();
    formData.append('Name', guestName);
    formData.append('name', guestName);
    formData.append('Nama', guestName);
    formData.append('Name ', guestName);
    formData.append('Guest', guests);
    formData.append('Wish', wish);

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            // Only gracefully inject the wish visually into the DOM if the database successfully accepted it
            if (wish !== '') {
                const wishBoard = document.getElementById('wishBoard');
                
                // Remove the empty state placeholder if it exists!
                const emptyState = document.getElementById('emptyWishState');
                if (emptyState) {
                    emptyState.remove();
                }

                const newWishHtml = `
                    <div class="glass-panel wish-card new-wish">
                        <p class="wish-message">"${wish}"</p>
                        <p class="wish-name">- ${guestName}</p>
                    </div>
                `;
                
                wishBoard.insertAdjacentHTML('beforeend', newWishHtml);
                
                // Animate newly injected wish card natively
                gsap.from('.new-wish', {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.out"
                });
                
                document.querySelector('.new-wish').classList.remove('new-wish');
                
                // Gracefully mathematically refresh all scroll triggers for the expanded height
                setTimeout(() => ScrollTrigger.refresh(), 100);
            }
            
            alert('Success! Your RSVP and wishes have been permanently recorded.');
            closePopup();
            form.reset();
        })
        .catch(error => {
            console.error('Transmission Error!', error.message);
            alert('Something went wrong connecting to the database. Please try again.');
        })
        .finally(() => {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        });
}

// Fetch existing wishes securely from Google Sheets on page load!
function fetchWishes() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyECOWRFdPID9Zc0tfXIgvMaOpyM0QxVW66AxRfg5yKJ5_TrOp1u51CCnkY1lNVujKRbQ/exec';
    const wishBoard = document.getElementById('wishBoard');
    
    fetch(scriptURL)
        .then(response => response.json())
        .then(res => {
            if (res.result === 'success' && res.data) {
                // Clear the hardcoded placeholder samples completely!
                wishBoard.innerHTML = '';
                
                // Reverse the array so the newest wishes dynamically spawn at the top of the wall!
                const wishes = res.data.reverse();
                let validWishesCount = 0;
                
                wishes.forEach(row => {
                    // Only render people who actually wrote a wish string mathematically
                    if (row.Wish && row.Wish.trim() !== '') {
                        const wishHtml = `
                            <div class="glass-panel wish-card">
                                <p class="wish-message">"${row.Wish}"</p>
                                <p class="wish-name">- ${row.Name || row.name || row['Name '] || row.Nama || 'Guest'}</p>
                            </div>
                        `;
                        wishBoard.insertAdjacentHTML('beforeend', wishHtml);
                        validWishesCount++;
                    }
                });
                
                if (validWishesCount === 0) {
                    wishBoard.innerHTML = `
                        <div class="glass-panel wish-card" id="emptyWishState">
                            <p class="wish-message" style="font-style: normal; text-align: center; color: #777;">Be the first to leave a wish!</p>
                        </div>
                    `;
                }
                
                // Safely rebuild the entire page's GSAP scroll height constraints to accommodate the new DOM nodes!
                setTimeout(() => ScrollTrigger.refresh(), 500);
            }
        })
        .catch(error => console.error('Silent error fetching database wishes:', error));
}

document.addEventListener("DOMContentLoaded", () => {
    // 0. Accessibility: respect the visitor's reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 0.1 Header Scroll State Management
    const header = document.querySelector("header");
    
    if (header) {
        const toggleHeaderScrollState = () => {
            if (window.scrollY > 20) {
                header.classList.add("is-scrolled");
            } else {
                header.classList.remove("is-scrolled");
            }
        };

        window.addEventListener("scroll", toggleHeaderScrollState);
        toggleHeaderScrollState();
    }

    // 1. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        let savedTheme = null;
        try {
            savedTheme = localStorage.getItem('theme');
        } catch (e) {
            console.warn("localStorage is inaccessible.");
        }

        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
        }

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');

            if (themeIcon) {
                themeIcon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
            }
            try {
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            } catch (e) {}
        });
    }

    // 2. Current Dynamic Year
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // 3. Mobile Navigation Menu Toggle with ARIA State Support
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            const isOpen = nav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isOpen);
            if (header) {
                header.classList.toggle('nav-open', isOpen);
            }
        });

        nav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                if (header) header.classList.remove('nav-open');
            });
        });

        document.addEventListener('click', (e) => {
            const isClickInsideNav = nav.contains(e.target) || menuToggle.contains(e.target);
            if (!isClickInsideNav && nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                if (header) header.classList.remove('nav-open');
            }
        });
    }

    // 4. Custom Mouse Glow Tracker - Hardware Accelerated version
    const cursorGlow = document.getElementById('cursorGlow');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    if (cursorGlow) {
        if (prefersReducedMotion) {
            cursorGlow.style.display = 'none';
        } else {
            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            const animateGlow = () => {
                glowX += (mouseX - glowX) * 0.15;
                glowY += (mouseY - glowY) * 0.15;
                cursorGlow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
                requestAnimationFrame(animateGlow);
            };
            animateGlow();
        }
    }

    // 5. Interactive Particle Canvas
    const canvas = document.getElementById('bg-canvas');
    if (canvas && prefersReducedMotion) {
        canvas.style.display = 'none';
    } else if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let isPageVisible = true;

        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;
        });

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            radius: Math.random() * 2 + 1
        }));

        function renderParticles() {
            if (!isPageVisible) {
                requestAnimationFrame(renderParticles);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
                ctx.fill();

                let distMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
                if (distMouse < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.strokeStyle = `rgba(192, 132, 252, ${0.2 * (1 - distMouse / 150)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }

                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 140) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 140)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(renderParticles);
        }
        renderParticles();
    }

    // 6. Scroll-Triggered Stat Counter Animation
    const statsSection = document.querySelector('.stats-grid');
    const counters = document.querySelectorAll('.counter');
    let countersStarted = false;

    if (statsSection && counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersStarted) {
                    countersStarted = true;
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('data-target');
                        const duration = 1500;
                        const stepTime = 20;
                        const steps = duration / stepTime;
                        const increment = target / steps;
                        let current = 0;

                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                counter.textContent = target;
                                clearInterval(timer);
                            } else {
                                counter.textContent = Math.ceil(current);
                            }
                        }, stepTime);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        counterObserver.observe(statsSection);
    }

    // 7. General Scroll-Reveal Animation for Cards
    const revealElements = document.querySelectorAll('.service-card, .stat-card, .resume-card, .channel-card, .terminal-container');
    revealElements.forEach(el => el.classList.add('reveal-item'));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach(el => revealObserver.observe(el));

    // 8. 3D Tilt Effect for Main Profile Photo (Mouse + Mobile Gyroscope)
    const tiltCard = document.getElementById('tiltCard') || document.querySelector('.profile-photo-box');
    const tiltContainer = document.querySelector('.profile-card-container');

    if (tiltCard && !prefersReducedMotion) {
        if (tiltContainer) {
            tiltContainer.addEventListener('mousemove', (e) => {
                const rect = tiltContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = -((y - centerY) / centerY) * 15;
                const rotateY = ((x - centerX) / centerX) * 15;

                tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                tiltCard.style.boxShadow = `${-rotateY}px ${rotateX + 10}px 30px rgba(56, 189, 248, 0.25)`;
            });

            tiltContainer.addEventListener('mouseleave', () => {
                tiltCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                tiltCard.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            });
        }

        const handleOrientation = (event) => {
            if (event.beta === null || event.gamma === null) return;
            let beta = Math.max(-45, Math.min(45, event.beta - 45));
            let gamma = Math.max(-45, Math.min(45, event.gamma));

            const rotateX = (beta / 45) * 15;
            const rotateY = (gamma / 45) * 15;

            tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
            tiltCard.style.boxShadow = `${-rotateY}px ${rotateX + 10}px 30px rgba(56, 189, 248, 0.25)`;
        };

        const initGyro = () => {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.body.addEventListener('touchstart', () => {
                    DeviceOrientationEvent.requestPermission()
                        .then((permissionState) => {
                            if (permissionState === 'granted') {
                                window.addEventListener('deviceorientation', handleOrientation);
                            }
                        })
                        .catch(console.error);
                }, { once: true });
            } else if ('DeviceOrientationEvent' in window) {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        initGyro();
    }

    // 9. DYNAMIC DATA EXTRACTOR & INTERACTIVE CLI SYSTEM
    const pageCache = {};

    async function fetchAndParsePage(url) {
        if (pageCache[url]) return pageCache[url];
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            pageCache[url] = doc;
            return doc;
        } catch (err) {
            console.warn(`Dynamic fetch failed for ${url}:`, err);
            return null;
        }
    }

    async function getDocumentForPage(filename) {
        const currentPath = window.location.pathname;
        if (currentPath.endsWith(filename) || (filename === 'index.html' && (currentPath === '/' || currentPath.endsWith('/')))) {
            return document;
        }
        return await fetchAndParsePage(filename);
    }

    async function getAboutData() {
        const doc = await getDocumentForPage('index.html');
        if (!doc) return "Edrees Dahlan - E-commerce Manager & Computer Engineer.";
        
        const title = doc.querySelector('.hero-details h1')?.textContent.trim() || "EDREES DAHLAN";
        const subtitle = doc.querySelector('.hero-details h4')?.textContent.trim() || "Computer Engineer | E-commerce Manager";
        const bio = doc.querySelector('.hero-details p')?.textContent.trim() || "";
        
        return `<strong style="color: var(--neon-blue);">${title}</strong> (${subtitle})<br>${bio}`;
    }

    async function getSkillsData() {
        const docResume = await getDocumentForPage('resume.html');
        let skillTags = [];
        
        if (docResume) {
            const tags = docResume.querySelectorAll('.skills-tags-grid .skill-tag');
            tags.forEach(t => skillTags.push(t.textContent.trim()));
        }

        if (skillTags.length === 0) {
            return `• <strong style="color: var(--neon-purple);">E-Commerce:</strong> Magento 2, WooCommerce, Platform Migrations<br>` +
                   `• <strong style="color: var(--neon-purple);">Engineering:</strong> Cloudflare Workers, APIs, Networks, Technical SEO`;
        }

        return `<strong style="color: var(--neon-purple);">Extracted Technical Skills:</strong><br>` + 
               skillTags.map(s => `  • ${s}`).join('<br>');
    }

    async function getExperienceData() {
        const docResume = await getDocumentForPage('resume.html');
        if (!docResume) return "Experience data currently unavailable.";

        const cards = docResume.querySelectorAll('.resume-card');
        let expText = [];

        cards.forEach(card => {
            const badge = card.querySelector('.date-badge')?.textContent.trim();
            const title = card.querySelector('h3')?.textContent.trim();
            const company = card.querySelector('.company')?.textContent.trim();
            
            if (title && company) {
                expText.push(`• <strong style="color: var(--neon-pink);">${title}</strong> @ ${company} <span style="color: var(--neon-purple);">[${badge || ''}]</span>`);
            }
        });

        return expText.length > 0 ? expText.join('<br>') : "No work experience details found.";
    }

    async function getCertsData() {
        const docResume = await getDocumentForPage('resume.html');
        if (!docResume) return "Certifications data unavailable.";

        const certElements = docResume.querySelectorAll('.cert-card, .certificates-list li');
        let certs = [];

        certElements.forEach(c => certs.push(`  • ${c.textContent.trim()}`));

        if (certs.length === 0) {
            return `<strong style="color: var(--neon-blue);">Core Certifications & Training:</strong><br>` +
                   `  • E-Commerce Platform Management & SEO Systems<br>` +
                   `  • Computer Engineering & Network Architecture`;
        }

        return `<strong style="color: var(--neon-blue);">Extracted Certifications:</strong><br>` + certs.join('<br>');
    }

    async function getContactData() {
        const docContact = await getDocumentForPage('contact.html');
        let contacts = [];

        if (docContact) {
            const cards = docContact.querySelectorAll('.channel-card');
            cards.forEach(card => {
                const label = card.querySelector('h3')?.textContent.trim();
                const link = card.querySelector('a');
                const p = card.querySelector('p');
                const val = link ? link.outerHTML : (p ? p.textContent.trim() : '');
                if (label && val) {
                    contacts.push(`  • <strong>${label}:</strong> ${val}`);
                }
            });
        }

        if (contacts.length === 0) {
            return `Direct Contact Channels:<br>` +
                   `  • Email: <a href="mailto:e.dahlan@gmail.com" style="color: var(--neon-blue);">e.dahlan@gmail.com</a><br>` +
                   `  • WhatsApp: <a href="https://wa.me/966568329898" target="_blank" style="color: #25d366;">+966 56 832 9898</a>`;
        }

        return `Direct Contact Channels (Live extracted):<br>` + contacts.join('<br>');
    }

    async function getProjectsData() {
        const docIndex = await getDocumentForPage('index.html');
        let services = [];

        if (docIndex) {
            const cards = docIndex.querySelectorAll('.service-card');
            cards.forEach(c => {
                const h4 = c.querySelector('h4')?.textContent.trim();
                const p = c.querySelector('p')?.textContent.trim();
                if (h4 && p) services.push(`  • <strong style="color: var(--neon-blue);">${h4}:</strong> ${p}`);
            });
        }

        return services.length > 0 ? services.join('<br>') : "Projects and integrations initialized.";
    }

    const terminalInput = document.querySelector('.terminal-input') || document.getElementById('cliInput');
    const terminalBody = document.querySelector('.terminal-body') || document.getElementById('terminalBody');
    const cliChips = document.querySelectorAll('.cli-chip');

    async function processCommand(cmd) {
        const cleanCmd = cmd.trim().toLowerCase();
        if (!cleanCmd || !terminalBody) return;

        if (cleanCmd === 'clear') {
            terminalBody.innerHTML = '';
            return;
        }

        const outputLine = document.createElement('div');
        outputLine.className = 'terminal-output';
        outputLine.style.marginBottom = '12px';

        const promptHeader = `<div style="margin-bottom: 4px;"><span style="color: var(--neon-pink); font-weight: bold;">edrees@cli:~$</span> ${escapeHtml(cmd)}</div>`;
        outputLine.innerHTML = promptHeader + `<div style="color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Reading site data...</div>`;
        terminalBody.appendChild(outputLine);
        terminalBody.scrollTop = terminalBody.scrollHeight;

        let responseText = "";

        switch (cleanCmd) {
            case 'help':
                responseText = `Available commands (parsed dynamically):
  <span style="color: var(--neon-blue);">about</span>         - Bio & summary from About Me page
  <span style="color: var(--neon-blue);">skills</span>        - Extracted skill set from Resume
  <span style="color: var(--neon-blue);">projects</span>      - Services & system architecture
  <span style="color: var(--neon-blue);">contact</span>       - Direct channels from Contact page
  <span style="color: var(--neon-blue);">cv</span>            - Download my Resume (PDF)
  <span style="color: var(--neon-blue);">sysinfo</span>       - Local client session metrics
  <span style="color: var(--neon-blue);">coffee</span>        - V60 brew status ☕
  <span style="color: var(--neon-blue);">pihole</span>        - Local DNS stats
  <span style="color: var(--neon-blue);">klipper</span>       - 3D Printer status
  <span style="color: var(--neon-blue);">isopods</span>       - Vivarium culture check
  <span style="color: var(--neon-blue);">terrarium</span>     - Closed Ecosystem stats
  <span style="color: var(--neon-blue);">clear</span>         - Clear terminal`;
                break;

            case 'about':
                responseText = await getAboutData();
                break;

            case 'skills':
                responseText = await getSkillsData();
                break;

            case 'experience':
                responseText = await getExperienceData();
                break;

            case 'certs':
            case 'certifications':
                responseText = await getCertsData();
                break;

            case 'techstack':
                responseText = `<strong style="color: var(--neon-purple);">Core Infrastructure & Tech Stack:</strong><br>` +
                               `  • <strong style="color: var(--neon-blue);">E-Commerce:</strong> Magento 2, WooCommerce, Platform Migrations<br>` +
                               `  • <strong style="color: var(--neon-blue);">Backend & APIs:</strong> Cloudflare Workers, Node.js, SOAP/XML, REST APIs<br>` +
                               `  • <strong style="color: var(--neon-blue);">Web & UI:</strong> HTML5/CSS3, JavaScript (ES6+), Interactive CLI Engine<br>` +
                               `  • <strong style="color: var(--neon-blue);">Home Systems & IoT:</strong> Klipper Firmware, Raspberry Pi, Local DNS Filtering`;
                break;

            case 'projects':
                responseText = await getProjectsData();
                break;

            case 'contact':
                responseText = await getContactData();
                break;
                
            case 'cv':
            case 'download cv':
                responseText = `Initiating CV download...<br><span style="color: #22c55e;">[SUCCESS] Edrees_Dahlan_Resume.pdf has been downloaded!</span>`;
                const link = document.createElement('a');
                link.href = 'Edrees_Dahlan_Resume.pdf';
                link.download = 'Edrees_Dahlan_Resume.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                break;

            case 'sysinfo':
            case 'specs':
                let browserName = "Modern Browser";
                let osName = navigator.platform;
                
                if (navigator.userAgentData && navigator.userAgentData.brands) {
                    const realBrand = navigator.userAgentData.brands.find(
                        b => !b.brand.includes("Not") && !b.brand.includes("Brand")
                    );
                    if (realBrand) {
                        browserName = `${realBrand.brand} (v${realBrand.version})`;
                    } else if (navigator.userAgentData.brands[0]) {
                        browserName = navigator.userAgentData.brands[0].brand;
                    }
                    if (navigator.userAgentData.platform) {
                        osName = navigator.userAgentData.platform;
                    }
                } else {
                    const ua = navigator.userAgent;
                    if (ua.includes("Edg")) browserName = "Microsoft Edge";
                    else if (ua.includes("Chrome")) browserName = "Google Chrome";
                    else if (ua.includes("Firefox")) browserName = "Mozilla Firefox";
                    else if (ua.includes("Safari")) browserName = "Apple Safari";
                }

                responseText = `<strong style="color: var(--neon-blue);">Client Environment Metrics:</strong><br>` +
                               `  • <strong>Browser:</strong> ${browserName}<br>` +
                               `  • <strong>OS / Platform:</strong> ${osName}<br>` +
                               `  • <strong>Screen Resolution:</strong> ${window.screen.width}x${window.screen.height}<br>` +
                               `  • <strong>Online Status:</strong> ${navigator.onLine ? '<span style="color:#22c55e;">Online</span>' : '<span style="color:#ef4444;">Offline</span>'}`;
                break;

            case 'coffee':
                responseText = `Brew Status: <span style="color: #f59e0b;">V60 Anaerobic Single Origin Calibration Ready ☕</span><br>Grind Calibration: Lido ET Precision | Temp: 92°C<br><span style="color: var(--neon-purple);">Note: Code runs on coffee, coffee runs on code! ☕</span>`;
                break;
                
            case 'pihole':
                responseText = `<strong style="color: var(--neon-purple);">Pi-hole Network-wide Ad Blocking:</strong><br>` +
                               `  • Status: <span style="color: #22c55e;">Active</span> (Raspberry Pi Local)<br>` +
                               `  • Queries Blocked Today: 14,231 (18.4%)<br>` +
                               `  • Domains on Adlists: 1,340,921`;
                break;
                
            case 'klipper':
                responseText = `<strong style="color: var(--neon-blue);">Ender 3 S1 Pro (Klipper Firmware):</strong><br>` +
                               `  • Connection: <span style="color: #22c55e;">Online</span> (Local Host via Ethernet)<br>` +
                               `  • Extruder Temp: 210°C / Target: 210°C<br>` +
                               `  • Bed Temp: 60°C / Target: 60°C<br>` +
                               `  • Webcam Stream: <span style="color: #22c55e;">Active</span>`;
                break;
                
            case 'isopods':
                responseText = `Culture Bin Status Check... 🐛<br>` +
                               `<span style="color: #f59e0b;">Observation result:</span> <span style="color: var(--neon-pink);">100% Males detected.</span><br>` +
                               `Action required: Need to introduce females for successful breeding setup.`;
                break;
                
            case 'terrarium':
                responseText = `Closed Ecosystem Status: Aralia and springtails thriving. Humidity stable at 85%.`;
                break;

            case 'df':
            case 'disk':
                responseText = `Filesystem     1K-blocks      Used Available Use% Mounted on<br>` +
                               `/dev/nvme0n1p2 512000000 214580000 297420000  42% /<br>` +
                               `<span style="color: var(--neon-blue);">Total:</span> 512 GB | <span style="color: #f59e0b;">Used:</span> ~214.5 GB (42%) | <span style="color: #22c55e;">Remaining:</span> ~297.4 GB`;
                break;

            case 'sudo':
            case 'su':
            case 'root':
                responseText = `<span style="color: #ef4444;">Permission denied: User is not in the sudoers file. Incident reported 😉</span>`;
                break;

            default:
                responseText = `<span style="color: #ef4444;">Command not found: '${escapeHtml(cleanCmd)}'. Type <span style="color: var(--neon-blue);">help</span> for available commands.</span>`;
                break;
        }

        outputLine.innerHTML = promptHeader + `<div>${responseText}</div>`;
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    if (terminalInput) {
        terminalInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = terminalInput.value;
                terminalInput.value = '';
                await processCommand(val);
            }
        });
    }

    cliChips.forEach(chip => {
        chip.addEventListener('click', async () => {
            const cmd = chip.getAttribute('data-command') || chip.textContent.trim();
            await processCommand(cmd);
        });
    });

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // 10. Contact Form Submission Handler with Web3Forms AJAX Integration
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('visitor_name').value;
            const email = document.getElementById('visitor_email').value;
            const submitBtn = document.getElementById('submitBtn');
            const formStatus = document.getElementById('formStatus');
            const honeypot = document.getElementById('website');

            const formData = new FormData(contactForm);
            const turnstileResponse = formData.get('cf-turnstile-response');

            // 1. Check Cloudflare Turnstile CAPTCHA first
            if (!turnstileResponse) {
                formStatus.style.display = 'flex';
                formStatus.className = 'terminal-status-loading';
                formStatus.style.color = '#f59e0b';
                formStatus.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                formStatus.style.background = 'rgba(245, 158, 11, 0.1)';
                formStatus.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Security Check Required: Please verify you are human.`;
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
                return; // Stop submission until captcha is solved
            }

            // 2. Check traditional Honeypot for bots
            if (honeypot && honeypot.value.trim() !== '') {
                submitBtn.style.display = 'none';
                formStatus.style.display = 'flex';
                formStatus.className = 'terminal-status-success';
                formStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Success, ${escapeHtml(name || 'visitor')}! Protocol executed.`;
                contactForm.reset();
                setTimeout(() => {
                    submitBtn.style.display = 'flex';
                    formStatus.style.display = 'none';
                }, 6000);
                return;
            }

            // Proceed to API submission
            submitBtn.style.display = 'none';
            formStatus.style.display = 'flex';
            formStatus.className = 'terminal-status-loading';
            formStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Executing transmission protocol...`;

            try {
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    formStatus.className = 'terminal-status-success';
                    formStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Success, ${escapeHtml(name)}! Protocol executed. Routing response to ${escapeHtml(email)}.`;
                    contactForm.reset();
                } else {
                    throw new Error(data.message || 'Transmission failed.');
                }
            } catch (error) {
                formStatus.className = 'terminal-status-loading';
                formStatus.style.color = '#ef4444';
                formStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                formStatus.style.background = 'rgba(239, 68, 68, 0.1)';
                formStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error: ${escapeHtml(error.message)}`;
            }

            setTimeout(() => {
                submitBtn.style.display = 'flex';
                formStatus.style.display = 'none';
            }, 6000);
        });
    }
});

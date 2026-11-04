document.addEventListener("DOMContentLoaded", () => {
    // 0. Accessibility: respect the visitor's reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
    const nav = document.getElementById('primary-navigation');
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

    // Filter case studies in place without jumping down the page.
    const categoryButtons = Array.from(document.querySelectorAll('.project-filter'));
    const groups = Array.from(document.querySelectorAll('.project-group[data-project-group]'));
    const filterStatus = document.getElementById('projectFilterStatus');
    if (categoryButtons.length && groups.length) {
        categoryButtons.forEach(button => button.addEventListener('click', () => {
            const value = button.dataset.projectFilter;
            categoryButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
            let visibleCount = 0;
            groups.forEach(group => {
                const visible = value === 'all' || group.dataset.projectGroup === value;
                group.hidden = !visible;
                if (visible) visibleCount += group.querySelectorAll('.project-card').length;
            });
            if (filterStatus) filterStatus.textContent =
                value === 'all' ? 'Showing all ' + visibleCount + ' projects'
                : 'Showing ' + visibleCount + ' ' + button.textContent.replace(/\s+\d+\s*$/, '').trim() + ' projects';
        }));
    }

    // 4. Custom Mouse Glow Tracker - Hardware Accelerated version
    const cursorGlow = document.getElementById('cursorGlow');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    if (cursorGlow) {
        if (prefersReducedMotion || !hasFinePointer) {
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
        // Preserve the full desktop effect while reducing work on mobile devices.
        const mobileMotion = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
        const mobileFrameInterval = 1000 / 30;
        let lastFrameAt = 0;
        let frameId = null;

        const scheduleFrame = () => {
            if (frameId === null && !document.hidden) {
                frameId = requestAnimationFrame(renderParticles);
            }
        };

        // Fully suspend rendering in background tabs instead of polling each frame.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && frameId !== null) {
                cancelAnimationFrame(frameId);
                frameId = null;
            } else if (!document.hidden) {
                lastFrameAt = 0;
                scheduleFrame();
            }
        });

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = Array.from({ length: mobileMotion ? 24 : 50 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            radius: Math.random() * 2 + 1
        }));

        function renderParticles(timestamp) {
            frameId = null;
            if (document.hidden) return;
            if (mobileMotion && timestamp - lastFrameAt < mobileFrameInterval) {
                scheduleFrame();
                return;
            }
            lastFrameAt = timestamp;

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
            scheduleFrame();
        }
        scheduleFrame();
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

    if (tiltCard && !prefersReducedMotion && hasFinePointer) {
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
        const subtitle = doc.querySelector('.hero-details .hero-kicker')?.textContent.trim() || "Computer Engineer | E-commerce Manager";
        const bio = doc.querySelector('.hero-details p:not(.hero-kicker)')?.textContent.trim() || "";
        
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

        const heading = Array.from(docResume.querySelectorAll('.section-column-title'))
            .find(el => el.textContent.includes('Certifications & Professional Training'));
        const groups = [];
        const following = heading?.nextElementSibling;
        const cards = following?.matches('details.resume-extra')
            ? Array.from(following.querySelectorAll('.resume-card'))
            : Array.from(docResume.querySelectorAll('.resume-card')).filter(card => card.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_PRECEDING);
        cards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.trim();
            const items = Array.from(card.querySelectorAll('.resume-list li'))
                .map(el => `  • ${escapeHtml(el.textContent.trim())}`);
            if (title && items.length) {
                groups.push(`<strong style="color: var(--neon-blue);">${escapeHtml(title)}</strong><br>${items.join('<br>')}`);
            }
        });
        return groups.length
            ? `<strong>Certifications & training:</strong><br>${groups.join('<br><br>')}`
            : "Certification details currently unavailable.";
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
        // Use the full Projects directory, not just three homepage highlights.
        const docProjects = await getDocumentForPage('projects.html');
        if (!docProjects) return "Project listings are temporarily unavailable.";

        const sections = Array.from(docProjects.querySelectorAll('.project-group'));
        const output = sections.map(section => {
            const heading = section.querySelector('.project-group-header h2')?.textContent.trim() || 'Projects';
            const lines = Array.from(section.querySelectorAll('.project-card')).map(card => {
                const title = card.querySelector('h3')?.textContent.trim();
                const link = card.querySelector('a.project-case-link');
                const href = link?.getAttribute('href') || '';

                // Only output links to local case study pages.
                if (!title || !/^projects\/[a-z0-9-]+\.html$/.test(href)) return '';
                return `• <a href="${href}" style="color:var(--neon-blue);">${escapeHtml(title)}</a>`;
            }).filter(Boolean);
            if (!lines.length) return '';
            return `<strong style="color:var(--neon-purple);">${escapeHtml(heading)}</strong><br>` + lines.join('<br>');
        }).filter(Boolean);

        return output.length
            ? output.join('<br><br>') +
              '<br><br><a href="projects.html" style="color:var(--neon-blue);">Browse all case studies</a>'
            : 'Project case studies are temporarily unavailable.';
    }

    const terminalInput = document.querySelector('.terminal-input') || document.getElementById('cliInput');
    const terminalBody = document.querySelector('.terminal-body') || document.getElementById('terminalBody');
    const cliChips = document.querySelectorAll('.cli-chip');
    const livePrompt = document.getElementById('cliPrompt');
    const cliStatus = document.getElementById('cliStatus');
    const cliTypingToggle = document.getElementById('cliTypingToggle');
    let typingEnabled = !prefersReducedMotion;

    function renderTypingToggle() {
        if (!cliTypingToggle) return;
        cliTypingToggle.textContent = typingEnabled ? 'Typing: ON' : 'Typing: OFF';
        cliTypingToggle.setAttribute('aria-pressed', String(typingEnabled));
    }
    if (cliTypingToggle) {
        cliTypingToggle.addEventListener('click', () => {
            typingEnabled = !typingEnabled;
            renderTypingToggle();
        });
        renderTypingToggle();
    }

    // Render HTML responses progressively without breaking the markup or executing commands.
    // Displaying actual output in the terminal makes clicking a command feel like a shell.
    async function typeTerminalResponse(target, html) {
        const parsed = document.createElement('div');
        parsed.innerHTML = html;
        const parts = [];

        function copyTree(source, destination) {
            Array.from(source.childNodes).forEach(node => {
                if (node.nodeType === 3) {
                    const textNode = document.createTextNode('');
                    destination.appendChild(textNode);
                    parts.push({ node: textNode, text: node.textContent || '' });
                } else if (node.nodeType === 1) {
                    const element = node.cloneNode(false);
                    destination.appendChild(element);
                    copyTree(node, element);
                }
            });
        }
        copyTree(parsed, target);

        if (!typingEnabled) {
            parts.forEach(part => { part.node.textContent = part.text; });
            return;
        }

        const totalChars = parts.reduce((total, part) => total + part.text.length, 0);
        // Keep longer outputs readable without keeping the visitor waiting.
        const charsPerTick = Math.max(2, Math.ceil(totalChars / 85));
        for (const part of parts) {
            for (let i = 0; i < part.text.length; i += charsPerTick) {
                if (skipTyping) {
                    part.node.textContent = part.text;
                    break;
                }
                part.node.textContent = part.text.slice(0, i + charsPerTick);
                if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
                await sleep(16);
            }
        }
    }

    async function processCommand(cmd) {
        const cleanCmd = cmd.trim().toLowerCase();
        if (!cleanCmd || !terminalBody) return;

        if (cleanCmd === 'clear') {
            // Only the transcript is scrollable; the prompt lives outside it.
            terminalBody.replaceChildren();
            terminalBody.scrollTop = 0;
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

        if (cleanCmd.startsWith('echo ')) {
            responseText = escapeHtml(cmd.trim().slice(5));
        } else switch (cleanCmd) {
            case 'help':
                responseText = `<strong style="color: var(--neon-purple);">Portfolio commands</strong><br>
<span style="color: var(--neon-blue);">about</span>          Profile summary<br>
<span style="color: var(--neon-blue);">experience</span>     Work experience<br>
<span style="color: var(--neon-blue);">skills</span>         Technical skills<br>
<span style="color: var(--neon-blue);">certs</span>          Certifications and training<br>
<span style="color: var(--neon-blue);">techstack</span>      Technology stack<br>
<span style="color: var(--neon-blue);">projects</span>       Featured projects and case studies<br>
<span style="color: var(--neon-blue);">contact</span>        Contact details<br>
<span style="color: var(--neon-blue);">cv</span>             Download resume PDF<br>
<span style="color: var(--neon-blue);">sysinfo</span>        Your browser environment<br>
<span style="color: var(--neon-blue);">history</span>        Recent session commands<br>
<span style="color: var(--neon-blue);">whoami</span>         Visitor session<br>
<span style="color: var(--neon-blue);">ls</span> / <span style="color: var(--neon-blue);">pwd</span>       Virtual portfolio directory<br>
<span style="color: var(--neon-blue);">cat about.md</span>   Read about me<br>
<span style="color: var(--neon-blue);">date</span>           Local date & time<br>
<span style="color: var(--neon-blue);">echo</span>           Echo a message<br>
<span style="color: var(--neon-blue);">clear</span>          Clear terminal<br><br>
<strong style="color: var(--neon-purple);">Explore (demos and easter eggs)</strong><br>
coffee · pihole · klipper · isopods · terrarium · disk`;
                break;

            case 'whoami':
                responseText = '<strong style="color: var(--neon-blue);">Edrees Dahlan</strong> — E-commerce Manager & Computer Engineer<br><span style="color: var(--text-muted);">Session: visitor (portfolio simulation)</span>';
                break;

            case 'pwd':
                responseText = '/home/visitor/portfolio (virtual directory)';
                break;

            case 'ls':
                responseText = '<span style="color: var(--neon-blue);">about.md</span>  <span style="color: var(--neon-purple);">skills/</span>  <span style="color: var(--neon-purple);">projects/</span>  resume.pdf  contact.md<br><span style="color: var(--text-muted);">Virtual portfolio entries, not server files.</span>';
                break;

            case 'date':
                responseText = escapeHtml(new Date().toLocaleString());
                break;

            case 'cat readme.md':
            case 'cat about.md':
                responseText = await getAboutData();
                break;

            case 'history':
                responseText = commandHistory.length
                    ? commandHistory.map((entry, index) => `${String(index + 1).padStart(2, ' ')}  ${escapeHtml(entry)}`).join('<br>')
                    : 'No commands in this session.';
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
                responseText = `Starting your resume download...<br><span style="color: #22c55e;">If your browser allows downloads, the PDF will be saved.</span>`;
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
                               `  • <strong>Browser:</strong> ${escapeHtml(browserName)}<br>` +
                               `  • <strong>OS / Platform:</strong> ${escapeHtml(osName)}<br>` +
                               `  • <strong>Screen Resolution:</strong> ${window.screen.width}x${window.screen.height}<br>` +
                               `  • <strong>Online Status:</strong> ${navigator.onLine ? '<span style="color:#22c55e;">Online</span>' : '<span style="color:#ef4444;">Offline</span>'}`;
                break;

            case 'coffee':
                responseText = `Brew Status: <span style="color: #f59e0b;">V60 Anaerobic Single Origin Calibration Ready ☕</span><br>Grind Calibration: Lido ET Precision | Temp: 92°C<br><span style="color: var(--neon-purple);">Note: Code runs on coffee, coffee runs on code! ☕</span>`;
                break;
                
            case 'pihole':
                responseText = `<strong style="color: var(--neon-purple);">DNS Filtering / Pi-hole:</strong><br>` +
                               `  • Live telemetry: Not connected<br>` +
                               `  • This CLI showcases experience with local DNS systems; it does not access a visitor's network.`;
                break;

            case 'klipper':
                responseText = `<strong style="color: var(--neon-blue);">Creality K2 SE / Klipper:</strong><br>` +
                               `  • Live printer monitoring: Not connected<br>` +
                               `  • Demonstration only — no temperatures or camera feeds are being read.`;
                break;

            case 'isopods':
                responseText = `Playful demo (not live): Culture Bin Status Check... 🐛<br>` +
                               `<span style="color: #f59e0b;">Observation result:</span> <span style="color: var(--neon-pink);">100% Males detected.</span><br>` +
                               `Action required: Need to introduce females for successful breeding setup.`;
                break;
                
            case 'terrarium':
                responseText = `Playful ecosystem example (not live sensor data): Aralia and springtail habitat.`;
                break;

            case 'df':
            case 'disk':
                responseText = `Filesystem demo: no server disk statistics are exposed through this portfolio.`;
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

        outputLine.innerHTML = promptHeader + '<div class="cli-response" aria-hidden="true"></div>';
        const responseArea = outputLine.querySelector('.cli-response');
        if (!responseArea) {
            outputLine.innerHTML = promptHeader + `<div>${responseText}</div>`;
            return;
        }

        terminalBody.setAttribute('aria-busy', 'true');
        try {
            await typeTerminalResponse(responseArea, responseText);
        } finally {
            responseArea.removeAttribute('aria-hidden');
            terminalBody.removeAttribute('aria-busy');
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    }

    // Click-to-type CLI: type visibly into the actual input before executing.
    // Reduced-motion preference is respected, and commands are serialized.
    const autoCompleteCommands = [
        'help', 'whoami', 'pwd', 'ls', 'date', 'cat about.md',
        'about', 'skills', 'experience', 'certs', 'techstack',
        'projects', 'contact', 'cv', 'sysinfo', 'coffee',
        'pihole', 'klipper', 'isopods', 'terrarium', 'disk',
        'history', 'clear'
    ];
    const commandHistory = [];
    let historyIndex = 0;
    let cliBusy = false;
    let skipTyping = false;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function runCliCommand(rawCommand, animateTyping = false) {
        const command = String(rawCommand).trim();
        if (!command || cliBusy) return;

        cliBusy = true;
        skipTyping = false;
        cliChips.forEach(chip => { chip.disabled = true; });
        if (terminalInput) {
            terminalInput.readOnly = true;
            terminalInput.setAttribute('aria-busy', 'true');
        }

        try {
            if (terminalInput && animateTyping) {
                terminalInput.value = '';
                terminalInput.focus({ preventScroll: true });
                const chars = Array.from(command);

                if (!typingEnabled) {
                    terminalInput.value = command;
                } else {
                    for (const char of chars) {
                        if (skipTyping) {
                            terminalInput.value = command;
                            break;
                        }
                        terminalInput.value += char;
                        if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
                        await sleep(42 + Math.round(Math.random() * 22));
                    }
                    if (!skipTyping) await sleep(110);
                }
            }
            if (terminalInput) terminalInput.value = '';

            commandHistory.push(command);
            if (commandHistory.length > 40) commandHistory.shift();
            historyIndex = commandHistory.length;
            await processCommand(command);
        } finally {
            cliBusy = false;
            skipTyping = false;
            cliChips.forEach(chip => { chip.disabled = false; });
            if (terminalInput) {
                terminalInput.readOnly = false;
                terminalInput.removeAttribute('aria-busy');
            }
        }
    }

    if (terminalInput) {
        terminalInput.addEventListener('keydown', async (event) => {
            if (event.key === 'Escape' && cliBusy) {
                event.preventDefault();
                skipTyping = true;
                return;
            }

            if (cliBusy) {
                if (event.key === 'Enter') event.preventDefault();
                return;
            }

            if (event.key === 'Tab' && terminalInput.value.trim()) {
                const typed = terminalInput.value.trim().toLowerCase();
                const matches = autoCompleteCommands.filter(command => command.startsWith(typed));
                if (matches.length === 1) {
                    event.preventDefault();
                    terminalInput.value = matches[0];
                }
                return;
            }

            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                if (!commandHistory.length) return;
                event.preventDefault();
                const delta = event.key === 'ArrowUp' ? -1 : 1;
                historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + delta));
                terminalInput.value = commandHistory[historyIndex] || '';
                terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                await runCliCommand(terminalInput.value);
            }
        });
    }

    cliChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const command = chip.getAttribute('data-command') || chip.textContent.trim();
            void runCliCommand(command, true);
        });
    });

    // Visible self-check: if this does not say Ready, the terminal JS did not initialize.
    if (cliStatus) {
        cliStatus.textContent = 'v3.1 · Ready';
        cliStatus.classList.add('cli-ready');
    }
    if (terminalInput && terminalBody && cliChips.length) {
        document.documentElement.dataset.cliReady = '3.1';
    }

    // First-visit welcome: a non-blocking, decorative shell demo.
    // It is intentionally separate from normal command execution, so the visitor
    // can start using the terminal immediately and interrupt the animation.
    const welcomeStorageKey = 'edrees-cli-intro-v3';
    let welcomeCancelled = false;
    let welcomeTimer = null;

    function rememberWelcome() {
        try { sessionStorage.setItem(welcomeStorageKey, '1'); } catch (error) {
            // Private browsing may disallow storage; the terminal still works.
        }
    }

    function cancelWelcome() {
        welcomeCancelled = true;
        if (welcomeTimer !== null) {
            clearTimeout(welcomeTimer);
            welcomeTimer = null;
        }
        rememberWelcome();
    }

    async function writeWelcomeText(node, text, delayMs) {
        if (!typingEnabled) {
            node.textContent = text;
            return !welcomeCancelled;
        }

        for (const character of Array.from(text)) {
            if (welcomeCancelled) return false;
            node.textContent += character;
            terminalBody.scrollTop = terminalBody.scrollHeight;
            await sleep(delayMs);
        }
        return !welcomeCancelled;
    }

    async function showWelcomeCommand(command, answer) {
        if (welcomeCancelled || !terminalBody || !livePrompt) return false;

        const line = document.createElement('div');
        line.className = 'terminal-output cli-welcome-output';

        const commandRow = document.createElement('div');
        commandRow.className = 'cli-welcome-command';
        const promptText = document.createElement('span');
        promptText.className = 'terminal-prompt';
        promptText.textContent = 'edrees@cli:~$ ';
        const typedText = document.createElement('span');
        commandRow.append(promptText, typedText);

        const resultRow = document.createElement('div');
        resultRow.className = 'cli-welcome-result';

        line.append(commandRow, resultRow);
        terminalBody.appendChild(line);

        const commandComplete = await writeWelcomeText(typedText, command, 47);
        if (!commandComplete) { line.remove(); return false; }

        await sleep(140);
        const answerComplete = await writeWelcomeText(resultRow, answer, 13);
        if (!answerComplete) { line.remove(); return false; }
        terminalBody.scrollTop = terminalBody.scrollHeight;
        return true;
    }

    async function playWelcome() {
        welcomeTimer = null;
        if (welcomeCancelled || cliBusy || document.hidden) return;
        rememberWelcome();

        const identity = 'Edrees Dahlan — E-commerce Manager & Computer Engineer';
        if (!await showWelcomeCommand('whoami', identity)) return;
        if (welcomeCancelled) return;

        await sleep(240);
        if (welcomeCancelled || !await showWelcomeCommand(
            'help',
            'Available commands: about, skills, projects, experience, contact, cv, history, clear. Type help to see more.'
        )) return;

        document.documentElement.dataset.cliIntro = 'complete';
    }

    if (terminalInput && terminalBody && livePrompt) {
        let alreadySeen = false;
        try { alreadySeen = sessionStorage.getItem(welcomeStorageKey) === '1'; } catch (error) {}

        if (!alreadySeen) {
            // Any intentional interaction takes precedence over the demo.
            terminalInput.addEventListener('keydown', cancelWelcome, { once: true });
            terminalInput.addEventListener('pointerdown', cancelWelcome, { once: true });
            cliChips.forEach(chip => chip.addEventListener('click', cancelWelcome, { once: true }));

            const scheduleWelcome = () => {
                if (welcomeCancelled) return;
                welcomeTimer = setTimeout(() => { void playWelcome(); }, 1900);
            };
            const disclosure = document.getElementById('cliDisclosure');
            // A collapsed CLI must not start an animation before a visitor opens it.
            if (disclosure && !disclosure.open) {
                disclosure.addEventListener('toggle', () => {
                    if (disclosure.open && !welcomeCancelled && !welcomeTimer) scheduleWelcome();
                }, { once: true });
            } else if (document.readyState === 'complete') {
                scheduleWelcome();
            } else {
                window.addEventListener('load', scheduleWelcome, { once: true });
            }
        }
    }

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
            const captchaResponse = formData.get('h-captcha-response');

            // 1. Verify hCaptcha response before submitting to Web3Forms
            if (!captchaResponse) {
                formStatus.style.display = 'flex';
                formStatus.className = 'terminal-status-loading';
                formStatus.style.color = '#f59e0b';
                formStatus.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                formStatus.style.background = 'rgba(245, 158, 11, 0.1)';
                formStatus.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Security Check Required: Please complete hCaptcha to send your message.`;
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

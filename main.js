document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme Toggle Logic (with safe localStorage handling)
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
        });
    }

    // 4. Custom Mouse Glow Tracker
    const cursorGlow = document.getElementById('cursorGlow');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    if (cursorGlow) {
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorGlow.style.left = mouseX + 'px';
            cursorGlow.style.top = mouseY + 'px';
        });
    }

    // 5. Interactive Particle Canvas (with Page Visibility API optimization)
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
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

    // 8. 3D Tilt Effect for Main Profile Photo
    const tiltCard = document.getElementById('tiltCard');
    const tiltContainer = document.querySelector('.profile-card-container');

    if (tiltCard && tiltContainer) {
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

    // 9. Interactive CLI Shell Command Handling & Autofocus Logic
    const cliInput = document.getElementById('cliInput');
    const terminalBody = document.getElementById('terminalBody');
    const terminalContainer = document.querySelector('.terminal-container');

    if (terminalContainer && cliInput) {
        terminalContainer.addEventListener('click', () => {
            cliInput.focus();
        });
    }

    function runCliCommand(cmd) {
        const cleanCmd = cmd.trim().toLowerCase();
        if (!cleanCmd || !terminalBody) return;

        const userLine = document.createElement('div');
        userLine.className = 'terminal-output';
        userLine.innerHTML = `<p><span style="color: var(--neon-pink);">edrees@cli:~$</span> ${escapeHtml(cmd)}</p>`;
        terminalBody.appendChild(userLine);

        const responseLine = document.createElement('div');
        responseLine.className = 'terminal-output';

        switch (cleanCmd) {
            case 'help':
                responseLine.innerHTML = `
                    <p>Available commands:</p>
                    <p>  <span>about</span>    - Brief overview of Edrees Dahlan</p>
                    <p>  <span>skills</span>   - List technical competencies</p>
                    <p>  <span>projects</span> - View key e-commerce & hardware projects</p>
                    <p>  <span>contact</span>  - Get communication handles & email</p>
                    <p>  <span>clear</span>    - Clear terminal screen</p>
                `;
                break;
            case 'about':
                responseLine.innerHTML = `<p>Computer Engineer & E-commerce Manager based in Dammam, KSA. Specialized in Magento platforms, ERP sync, and operational infrastructure</p>`;
                break;
            case 'skills':
                responseLine.innerHTML = `<p>Core Skills: Magento CMS, Oracle ERP Integration, Docker, Grafana, Pi-hole, Network Security, SEO, Computer Engineering.</p>`;
                break;
            case 'projects':
                responseLine.innerHTML = `<p>Projects: Industrial Tools E-commerce Overhaul, Oracle ERP Price Synchronization, Home Automation & Network Administration</p>`;
                break;
            case 'contact':
                responseLine.innerHTML = `<p>Email: <a href="mailto:e.dahlan@gmail.com" style="color: var(--neon-blue);">e.dahlan@gmail.com</a> | WhatsApp: +966 56 832 9898</p>`;
                break;
            case 'clear':
                terminalBody.innerHTML = `<div class="terminal-output"><p>Terminal cleared. Type <span>help</span> for commands.</p></div>`;
                return;
            default:
                responseLine.innerHTML = `<p style="color: #ef4444;">Command not recognized: "${escapeHtml(cmd)}". Type <span>help</span> for valid commands.</p>`;
                break;
        }

        terminalBody.appendChild(responseLine);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    if (cliInput) {
        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                runCliCommand(cliInput.value);
                cliInput.value = '';
            }
        });
    }

    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.cli-chip');
        if (chip && chip.hasAttribute('data-command')) {
            runCliCommand(chip.getAttribute('data-command'));
        }
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

            // Hide submit button and display terminal loading indicator state
            submitBtn.style.display = 'none';
            formStatus.style.display = 'flex';
            formStatus.className = 'terminal-status-loading';
            formStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Executing transmission protocol...`;

            try {
                const formData = new FormData(contactForm);
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

            // Restore form control elements after 6 seconds
            setTimeout(() => {
                submitBtn.style.display = 'flex';
                formStatus.style.display = 'none';
            }, 6000);
        });
    }
});
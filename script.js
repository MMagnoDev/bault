document.addEventListener("DOMContentLoaded", () => {
    
    /* ==========================================================================
       ROLAGEM SUAVE (LENIS SMOOTH SCROLL + ÂNCORAS)
       ========================================================================== */
    let lenis = null;
    if (typeof Lenis !== "undefined") {
        lenis = new Lenis({
            lerp: 0.1,
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.5
        });
        window.lenis = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(targetEl, { offset: -80 });
                } else {
                    const top = targetEl.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            }
        });
    });

    /* ==========================================================================
       MENU FIXO COM SCROLL (PASSIVE & OTIMIZADO)
       ========================================================================== */
    const header = document.getElementById("header");
    if (header) {
        let isHeaderScrolled = window.scrollY > 50;
        if (isHeaderScrolled) header.classList.add("scrolled");

        window.addEventListener("scroll", () => {
            const shouldBeScrolled = window.scrollY > 50;
            if (shouldBeScrolled !== isHeaderScrolled) {
                isHeaderScrolled = shouldBeScrolled;
                header.classList.toggle("scrolled", isHeaderScrolled);
            }
        }, { passive: true });
    }

    /* ==========================================================================
       MENU MOBILE (OPEN / CLOSE)
       ========================================================================== */
    const menuBtn = document.getElementById("menuBtn");
    const closeBtn = document.getElementById("closeBtn");
    const mobilePanel = document.getElementById("mobilePanel");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    function openMobileMenu() {
        if (!mobilePanel) return;
        mobilePanel.classList.add("open");
        mobilePanel.setAttribute("aria-hidden", "false");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden"; // Previne scroll do fundo
        if (window.lenis) window.lenis.stop();
    }

    function closeMobileMenu() {
        if (!mobilePanel) return;
        mobilePanel.classList.remove("open");
        mobilePanel.setAttribute("aria-hidden", "true");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        if (window.lenis) window.lenis.start();
    }

    if (menuBtn) menuBtn.addEventListener("click", openMobileMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMobileMenu);
    
    function setActiveMobileLink(targetHref) {
        mobileLinks.forEach(l => {
            l.style.color = "";
            const href = l.getAttribute("href");
            if (href === targetHref || href === "index.html" + targetHref) {
                l.classList.add("active");
            } else {
                l.classList.remove("active");
            }
        });
    }

    mobileLinks.forEach(link => {
        link.addEventListener("click", () => {
            const href = link.getAttribute("href");
            if (href && href.startsWith("#")) {
                setActiveMobileLink(href);
            } else if (href === "index.html") {
                setActiveMobileLink("index.html");
            }
            closeMobileMenu();
        });
    });

    // Atualiza item marcado no menu mobile conforme a seção visível ou hash da URL na Home
    const homeSections = [
        { id: "publico", href: "#publico" },
        { id: "atuacao", href: "#atuacao" },
        { id: "entregamos", href: "#entregamos" }
    ];

    if (document.getElementById("publico")) {
        let clickedHashLock = false;

        mobileLinks.forEach(link => {
            link.addEventListener("click", () => {
                const href = link.getAttribute("href");
                if (href && href.startsWith("#")) {
                    clickedHashLock = true;
                    setActiveMobileLink(href);
                    setTimeout(() => { clickedHashLock = false; }, 1000);
                }
            });
        });

        const updateMobileSpy = () => {
            if (clickedHashLock) return;
            const scrollPos = window.scrollY + window.innerHeight * 0.35;
            let matched = "index.html";

            for (const sec of homeSections) {
                const el = document.getElementById(sec.id);
                if (el) {
                    const top = el.offsetTop;
                    const bottom = top + el.offsetHeight;
                    if (scrollPos >= top && scrollPos < bottom) {
                        matched = sec.href;
                        break;
                    }
                }
            }
            setActiveMobileLink(matched);
        };

        window.addEventListener("scroll", updateMobileSpy, { passive: true });
        if (window.location.hash) {
            setActiveMobileLink(window.location.hash);
        } else {
            updateMobileSpy();
        }
    }

    /* ==========================================================================
       FILTRO DE PROJETOS
       ========================================================================== */
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectCards = document.querySelectorAll(".project-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Remove active dos outros botões
            filterButtons.forEach(btn => btn.classList.remove("active"));
            // Adiciona active no clicado
            button.classList.add("active");

            const filterValue = button.getAttribute("data-filter");

            projectCards.forEach(card => {
                const category = card.getAttribute("data-category");
                if (filterValue === "all" || category === filterValue) {
                    card.classList.remove("hide");
                    // Re-engaja animações fade-in
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0)";
                } else {
                    card.classList.add("hide");
                }
            });
        });
    });


    /* ==========================================================================
       CARROSSEL DE ÁREAS DE ATUAÇÃO (AUTOPLAY + 1 NO MOBILE / 2 NO DESKTOP + SETAS)
       ========================================================================== */
    const actingWrapper = document.getElementById("actingCarousel");
    const actingTrack = document.getElementById("actingTrack");
    const prevActingBtn = document.getElementById("prevActing");
    const nextActingBtn = document.getElementById("nextActing");

    if (actingTrack && prevActingBtn && nextActingBtn) {
        const actingCards = Array.from(actingTrack.querySelectorAll(".acting-card"));
        let actingIndex = 0;
        let actingAutoplayTimer = null;
        let isActingHovered = false;
        let actingResumeTimeout = null;

        function getActingMaxIndex() {
            const isMobile = window.innerWidth <= 767;
            const visibleCount = isMobile ? 1 : 3;
            return Math.max(0, actingCards.length - visibleCount);
        }

        function updateActingCarousel() {
            const maxIdx = getActingMaxIndex();
            if (actingIndex > maxIdx) actingIndex = 0;
            if (actingIndex < 0) actingIndex = maxIdx;

            const isMobile = window.innerWidth <= 767;
            if (isMobile) {
                actingTrack.style.transform = `translate3d(-${actingIndex * 100}%, 0, 0)`;
            } else {
                const cardWidth = actingCards[0]?.offsetWidth || 0;
                const gap = 24;
                const offset = actingIndex * (cardWidth + gap);
                actingTrack.style.transform = `translate3d(-${offset}px, 0, 0)`;
            }
        }

        function nextActingSlide() {
            const maxIdx = getActingMaxIndex();
            actingIndex = actingIndex >= maxIdx ? 0 : actingIndex + 1;
            updateActingCarousel();
        }

        function startActingAutoplay() {
            stopActingAutoplay();
            actingAutoplayTimer = setInterval(() => {
                if (!isActingHovered) {
                    nextActingSlide();
                }
            }, 3800);
        }

        function stopActingAutoplay() {
            if (actingAutoplayTimer) {
                clearInterval(actingAutoplayTimer);
                actingAutoplayTimer = null;
            }
        }

        function pauseActingTemporarily() {
            stopActingAutoplay();
            if (actingResumeTimeout) clearTimeout(actingResumeTimeout);
            actingResumeTimeout = setTimeout(() => {
                startActingAutoplay();
            }, 4500);
        }

        prevActingBtn.addEventListener("click", () => {
            pauseActingTemporarily();
            const maxIdx = getActingMaxIndex();
            actingIndex = actingIndex <= 0 ? maxIdx : actingIndex - 1;
            updateActingCarousel();
        });

        nextActingBtn.addEventListener("click", () => {
            pauseActingTemporarily();
            nextActingSlide();
        });

        if (actingWrapper) {
            actingWrapper.addEventListener("mouseenter", () => {
                isActingHovered = true;
            });
            actingWrapper.addEventListener("mouseleave", () => {
                isActingHovered = false;
            });
        }

        let touchStartX = 0;
        actingTrack.addEventListener("touchstart", (e) => {
            pauseActingTemporarily();
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        actingTrack.addEventListener("touchend", (e) => {
            pauseActingTemporarily();
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) {
                const maxIdx = getActingMaxIndex();
                if (diff > 0) {
                    actingIndex = actingIndex >= maxIdx ? 0 : actingIndex + 1;
                } else {
                    actingIndex = actingIndex <= 0 ? maxIdx : actingIndex - 1;
                }
                updateActingCarousel();
            }
        }, { passive: true });

        window.addEventListener("resize", updateActingCarousel);
        updateActingCarousel();
        startActingAutoplay();
    }

    /* ==========================================================================
       CARROSSEL DE DEPOIMENTOS (TESTIMONIALS SLIDER - AUTOMÁTICO E CONTROLÁVEL)
       ========================================================================== */
    const slides = document.querySelectorAll(".testimonial-slide");
    const dots = document.querySelectorAll(".dot-indicator");
    const prevBtn = document.getElementById("prevTestimonial");
    const nextBtn = document.getElementById("nextTestimonial");
    let currentSlide = 0;
    const totalSlides = slides.length;
    let testimonialAutoplayTimer = null;
    let isTestimonialInteracting = false;
    let resumeTestimonialTimeout = null;

    function showSlide(index) {
        if (index < 0) {
            currentSlide = totalSlides - 1;
        } else if (index >= totalSlides) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        // Atualiza slides
        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add("active");
            } else {
                slide.classList.remove("active");
            }
        });

        // Atualiza dots
        dots.forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    function startTestimonialAutoplay() {
        stopTestimonialAutoplay();
        if (totalSlides <= 1) return;
        testimonialAutoplayTimer = setInterval(() => {
            if (!isTestimonialInteracting) {
                showSlide(currentSlide + 1);
            }
        }, 4500); // Avança automaticamente a cada 4.5s
    }

    function stopTestimonialAutoplay() {
        if (testimonialAutoplayTimer) {
            clearInterval(testimonialAutoplayTimer);
            testimonialAutoplayTimer = null;
        }
    }

    function pauseTestimonialTemporarily() {
        isTestimonialInteracting = true;
        stopTestimonialAutoplay();
        if (resumeTestimonialTimeout) clearTimeout(resumeTestimonialTimeout);
        resumeTestimonialTimeout = setTimeout(() => {
            isTestimonialInteracting = false;
            startTestimonialAutoplay();
        }, 5000); // Retoma após 5s sem interação
    }

    if (totalSlides > 1) {
        startTestimonialAutoplay();
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => {
            pauseTestimonialTemporarily();
            showSlide(currentSlide - 1);
        });
        nextBtn.addEventListener("click", () => {
            pauseTestimonialTemporarily();
            showSlide(currentSlide + 1);
        });
    }

    if (dots.length > 0) {
        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                pauseTestimonialTemporarily();
                showSlide(i);
            });
        });
    }

    // Touch Swipe e Hover suporte para mobile e desktop no carrossel de depoimentos
    let startX = 0;
    const sliderContainer = document.querySelector(".testimonial-slider-container");

    if (sliderContainer) {
        sliderContainer.addEventListener("mouseenter", () => isTestimonialInteracting = true);
        sliderContainer.addEventListener("mouseleave", () => {
            isTestimonialInteracting = false;
            startTestimonialAutoplay();
        });

        sliderContainer.addEventListener("touchstart", (e) => {
            pauseTestimonialTemporarily();
            startX = e.touches[0].clientX;
        }, { passive: true });

        sliderContainer.addEventListener("touchend", (e) => {
            pauseTestimonialTemporarily();
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 40) {
                if (diffX > 0) {
                    showSlide(currentSlide + 1);
                } else {
                    showSlide(currentSlide - 1);
                }
            }
        }, { passive: true });
    }

    /* ==========================================================================
       FORMULÁRIOS DE CONTATO (PÁGINA DEDICADA E RODAPÉ)
       ========================================================================== */
    const contactPageForm = document.getElementById("contactPageForm");
    const contactPageFeedback = document.getElementById("contactPageFeedback");

    if (contactPageForm && contactPageFeedback) {
        contactPageForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nome = document.getElementById("pageName")?.value.trim() || "";
            const tel = document.getElementById("pagePhone")?.value.trim() || "";
            const servico = document.getElementById("pageService")?.value || "";

            if (!nome || !tel || !servico) {
                contactPageFeedback.textContent = "Por favor, preencha Nome, Telefone e Serviço.";
                contactPageFeedback.className = "form-feedback error";
                contactPageFeedback.style.display = "block";
                return;
            }

            contactPageFeedback.textContent = "Enviando solicitação...";
            contactPageFeedback.className = "form-feedback";
            contactPageFeedback.style.display = "block";

            setTimeout(() => {
                contactPageFeedback.innerHTML = `<strong>Obrigado, ${nome}!</strong> Sua solicitação foi recebida. Retornaremos em breve pelo telefone <strong>${tel}</strong>.`;
                contactPageFeedback.className = "form-feedback success";
                contactPageForm.reset();
            }, 700);
        });
    }

    const footerForms = document.querySelectorAll(".footer-contact-form");
    footerForms.forEach(form => {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const feedback = form.querySelector(".form-feedback");
            const nome = form.querySelector('[name="name"]')?.value.trim() || "";
            const email = form.querySelector('[name="email"]')?.value.trim() || "";
            const tel = form.querySelector('[name="phone"]')?.value.trim() || "";
            const servico = form.querySelector('[name="service"]')?.value || "";
            const msg = form.querySelector('[name="message"]')?.value.trim() || "";

            if (!feedback) return;

            if (!nome || !email || !tel || !servico || !msg) {
                feedback.textContent = "Por favor, preencha todos os campos obrigatórios.";
                feedback.className = "form-feedback error";
                feedback.style.display = "block";
                return;
            }

            feedback.textContent = "Enviando solicitação...";
            feedback.className = "form-feedback";
            feedback.style.display = "block";

            setTimeout(() => {
                feedback.innerHTML = `<strong>Obrigado, ${nome}!</strong> Recebemos sua mensagem e entraremos em contato em breve.`;
                feedback.className = "form-feedback success";
                form.reset();
            }, 700);
        });
    });

    /* ==========================================================================
       ACORDEÃO DE PROPÓSITO, VISÃO E VALORES (SOBRE NÓS)
       ========================================================================== */
    const accordionHeaders = document.querySelectorAll(".accordion-header");
    accordionHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains("active");

            // Fecha outros itens para navegação limpa
            accordionHeaders.forEach(h => {
                h.parentElement.classList.remove("active");
                h.setAttribute("aria-expanded", "false");
            });

            if (!isOpen) {
                item.classList.add("active");
                header.setAttribute("aria-expanded", "true");
            }
        });
    });

    /* ==========================================================================
       ELEMENTOS FIXOS (SEM REVEAL ON SCROLL)
       ========================================================================== */
    const animatedElements = document.querySelectorAll(
        ".fade-in-up, .fade-in, .fade-in-left, .fade-in-right, .reveal, .soft-fade, .entregamos-box, .service-item, .audience-card, .step-item, .service-detail-item"
    );
    animatedElements.forEach(el => {
        el.classList.add("active", "visible");
    });

    /* ==========================================================================
       PARALLAX (IMAGENS COM data-parallax)
       ========================================================================== */
    const parallaxImages = document.querySelectorAll("[data-parallax]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (parallaxImages.length && !reduceMotion) {
        let ticking = false;

        const updateParallax = () => {
            const vh = window.innerHeight;
            parallaxImages.forEach(img => {
                const frame = img.parentElement.getBoundingClientRect();
                // Ignora quando fora da tela
                if (frame.bottom < 0 || frame.top > vh) return;
                const speed = parseFloat(img.dataset.parallax) || 0.18;
                // -1 (entrando por baixo) → 0 (centro da tela) → 1 (saindo por cima)
                const progress = (frame.top + frame.height / 2 - vh / 2) / (vh / 2 + frame.height / 2);
                const offset = -progress * frame.height * speed;
                img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
            });
            ticking = false;
        };

        const requestUpdate = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateParallax);
            }
        };

        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
        updateParallax();
    }

    /* ==========================================================================
       CARROSSÉIS INFINITOS AUTOMÁTICOS E CONTROLÁVEIS (MOBILE)
       ========================================================================== */
    const mobileCarousels = document.querySelectorAll(".carousel-mobile-container");

    mobileCarousels.forEach(container => {
        const track = container.querySelector(".carousel-track");
        if (!track) return;

        const items = Array.from(track.children);
        if (items.length <= 1) return;

        const dotsContainer = container.querySelector(".carousel-dots-mobile");
        let currentIndex = 0;
        let autoplayTimer = null;
        let isUserInteracting = false;
        let resumeTimeout = null;

        // Renderização dinâmica das bolinhas de indicação
        if (dotsContainer) {
            dotsContainer.innerHTML = "";
            items.forEach((_, idx) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = `carousel-dot ${idx === 0 ? "active" : ""}`;
                dot.setAttribute("aria-label", `Ir para o slide ${idx + 1}`);
                dot.addEventListener("click", () => {
                    pauseAutoplayTemporarily();
                    goToSlide(idx, true);
                });
                dotsContainer.appendChild(dot);
            });
        }

        const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll(".carousel-dot")) : [];

        function updateDots(index) {
            dots.forEach((dot, idx) => {
                dot.classList.toggle("active", idx === index);
            });
        }

        // Calcula a posição de translação para centralizar o slide index
        function getSlideTranslate(index) {
            if (index < 0 || index >= items.length) return 0;
            const targetItem = items[index];
            const containerWidth = container.offsetWidth;
            const cardWidth = targetItem.offsetWidth;
            const cardOffset = targetItem.offsetLeft;
            return ((containerWidth - cardWidth) / 2) - cardOffset;
        }

        function goToSlide(index, animate = true) {
            if (window.innerWidth > 767) {
                track.style.transform = "";
                track.style.transition = "";
                return;
            }

            if (index < 0) {
                index = items.length - 1;
            } else if (index >= items.length) {
                index = 0;
            }

            currentIndex = index;
            const targetTranslate = getSlideTranslate(currentIndex);

            if (animate) {
                track.style.transition = "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)";
            } else {
                track.style.transition = "none";
            }

            track.style.transform = `translateX(${targetTranslate}px)`;
            updateDots(currentIndex);
        }

        // Autoplay
        function startAutoplay() {
            stopAutoplay();
            if (window.innerWidth > 767) return;
            autoplayTimer = setInterval(() => {
                if (!isUserInteracting) {
                    const nextIndex = (currentIndex + 1) % items.length;
                    goToSlide(nextIndex, true);
                }
            }, 3800);
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        function pauseAutoplayTemporarily() {
            isUserInteracting = true;
            stopAutoplay();
            if (resumeTimeout) clearTimeout(resumeTimeout);
            resumeTimeout = setTimeout(() => {
                isUserInteracting = false;
                startAutoplay();
            }, 4000);
        }

        // Suporte a Touch & Swipe Direto (1:1 Dragging)
        let startX = 0;
        let startY = 0;
        let currentTranslate = 0;
        let isDragging = false;
        let isVerticalScroll = false;
        let gestureLocked = false;

        track.addEventListener("touchstart", (e) => {
            if (window.innerWidth > 767) return;
            pauseAutoplayTemporarily();

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            currentTranslate = getSlideTranslate(currentIndex);
            isDragging = false;
            isVerticalScroll = false;
            gestureLocked = false;
            track.style.transition = "none";
        }, { passive: true });

        track.addEventListener("touchmove", (e) => {
            if (window.innerWidth > 767 || isVerticalScroll) return;

            const touch = e.touches[0];
            const diffX = touch.clientX - startX;
            const diffY = touch.clientY - startY;

            if (!gestureLocked) {
                if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
                    isVerticalScroll = true;
                    gestureLocked = true;
                    return;
                }
                if (Math.abs(diffX) > 8) {
                    isDragging = true;
                    gestureLocked = true;
                }
            }

            if (isDragging) {
                if (e.cancelable) e.preventDefault();
                let moveTranslate = currentTranslate + diffX;
                track.style.transform = `translateX(${moveTranslate}px)`;
            }
        }, { passive: false });

        track.addEventListener("touchend", (e) => {
            if (window.innerWidth > 767 || !isDragging) {
                if (!isVerticalScroll && window.innerWidth <= 767) {
                    goToSlide(currentIndex, true);
                }
                isDragging = false;
                return;
            }

            const touch = e.changedTouches[0];
            const diffX = touch.clientX - startX;
            isDragging = false;

            if (diffX < -45) {
                // Swipe para esquerda -> próximo slide
                goToSlide((currentIndex + 1) % items.length, true);
            } else if (diffX > 45) {
                // Swipe para direita -> slide anterior
                goToSlide((currentIndex - 1 + items.length) % items.length, true);
            } else {
                // Arrasto insuficiente -> volta para o slide atual
                goToSlide(currentIndex, true);
            }
        }, { passive: true });

        track.addEventListener("touchcancel", () => {
            isDragging = false;
            goToSlide(currentIndex, true);
        }, { passive: true });

        // Inicialização
        if (window.innerWidth <= 767) {
            setTimeout(() => {
                goToSlide(0, false);
                startAutoplay();
            }, 60);
        }

        window.addEventListener("resize", () => {
            if (window.innerWidth <= 767) {
                goToSlide(currentIndex, false);
                if (!autoplayTimer && !isUserInteracting) startAutoplay();
            } else {
                stopAutoplay();
                track.style.transform = "";
                track.style.transition = "";
            }
        });
    });
});


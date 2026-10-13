document.addEventListener("DOMContentLoaded", () => {
    
    /* ==========================================================================
       ROLAGEM SUAVE (LENIS SMOOTH SCROLL)
       ========================================================================== */
    try {
        if (typeof Lenis !== 'undefined') {
            const lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
                infinite: false,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);

            // Integrar links de ancoragem com a rolagem do Lenis para compensar o header
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        lenis.scrollTo(targetEl, {
                            offset: -80, // Altura do cabeçalho fixo
                            duration: 1.2,
                        });
                    }
                });
            });
        } else {
            console.warn("Lenis is not defined. Falling back to native scrolling.");
        }
    } catch (error) {
        console.error("Lenis smooth scroll failed to initialize:", error);
    }

    /* ==========================================================================
       MENU FIXO COM SCROLL
       ========================================================================== */
    const header = document.getElementById("header");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    /* ==========================================================================
       MENU MOBILE (OPEN / CLOSE)
       ========================================================================== */
    const menuBtn = document.getElementById("menuBtn");
    const closeBtn = document.getElementById("closeBtn");
    const mobilePanel = document.getElementById("mobilePanel");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    function openMobileMenu() {
        mobilePanel.classList.add("open");
        mobilePanel.setAttribute("aria-hidden", "false");
        menuBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden"; // Previne scroll do fundo
    }

    function closeMobileMenu() {
        mobilePanel.classList.remove("open");
        mobilePanel.setAttribute("aria-hidden", "true");
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    menuBtn.addEventListener("click", openMobileMenu);
    closeBtn.addEventListener("click", closeMobileMenu);
    
    mobileLinks.forEach(link => {
        link.addEventListener("click", closeMobileMenu);
    });

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
       FORMULÁRIO DE CONTATO (SIMULADO)
       ========================================================================== */
    const contactForm = document.getElementById("contactForm");
    const formFeedback = document.getElementById("formFeedback");

    if (contactForm && formFeedback) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            formFeedback.textContent = "Enviando mensagem...";
            formFeedback.className = "form-feedback";
            formFeedback.style.display = "block";

            setTimeout(() => {
                formFeedback.textContent = "Obrigado! Sua mensagem foi enviada com sucesso.";
                formFeedback.className = "form-feedback success";
                contactForm.reset();
            }, 1200);
        });
    }

    /* ==========================================================================
       REVEAL ON SCROLL (INTERSECTION OBSERVER)
       ========================================================================== */
    const observerOptions = {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.08
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(
        ".fade-in-up, .fade-in, .fade-in-left, .fade-in-right, .reveal, .entregamos-box, .service-item, .audience-card, .step-item, .service-detail-item"
    );

    animatedElements.forEach(el => {
        // Garantir suporte a delay via inline style
        if (el.style.animationDelay && !el.style.transitionDelay) {
            el.style.transitionDelay = el.style.animationDelay;
        }
        revealObserver.observe(el);
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


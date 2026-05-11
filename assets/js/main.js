    window.addEventListener("DOMContentLoaded", () => {
      const PRODUCT = { name: "Datáfono compacto", price: 129900, currency: "COP", maxQty: 99 };
      const $ = (selector, parent = document) => parent.querySelector(selector);
      const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
      const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: PRODUCT.currency, maximumFractionDigits: 0 });
      // Landing comercial (GitHub Pages / WordPress + Elementor): animaciones siempre activas.
      // No usar prefers-reduced-motion aquí para que GSAP y microinteracciones coincidan con la demo final.
      const reduceMotion = false;
      const storedQty = Number(localStorage.getItem("terminalEpaycoQty"));
      const state = { selectedQty: 1, cartQty: Number.isFinite(storedQty) && storedQty >= 0 ? storedQty : 0 };

      const elements = {
        header: $(".site-header"),
        scrollProgress: $("#scrollProgress"),
        menuButton: $("#menuButton"),
        mobileMenu: $("#mobileMenu"),
        qty: $("#qty"),
        minus: $("#minus"),
        plus: $("#plus"),
        addProduct: $("#addProduct"),
        checkoutQty: $("#checkoutQty"),
        priceLabel: $("#priceLabel"),
        subtotal: $("#subtotal"),
        total: $("#total"),
        cartQty: $("#cartQty"),
        cartCountLabel: $("#cartCountLabel"),
        cartRow: $("#cartRow"),
        emptyCart: $("#emptyCart"),
        removeProduct: $("#removeProduct"),
        form: $("#checkoutForm"),
        toast: $("#toast"),
        progressSteps: $$(".progress-step")
      };

      function format(value) { return `${money.format(value)} ${PRODUCT.currency}`; }
      function clamp(value, allowZero = false) {
        const numericValue = Number.parseInt(value, 10);
        if (Number.isNaN(numericValue)) return allowZero ? 0 : 1;
        const min = allowZero ? 0 : 1;
        return Math.min(Math.max(numericValue, min), PRODUCT.maxQty);
      }
      function notify(message) {
        elements.toast.textContent = message;
        elements.toast.classList.add("show");
        window.clearTimeout(notify.timeout);
        notify.timeout = window.setTimeout(() => elements.toast.classList.remove("show"), 2800);
      }
      function scrollToTarget(target) {
        const node = typeof target === "string" ? $(target) : target;
        if (!node) return;
        const offset = -1 * (elements.header?.offsetHeight || 82) - 10;
        const top = node.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      }
      function updateScrollProgress() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, scrollTop / max));
        elements.scrollProgress.style.transform = `scaleX(${progress})`;
        elements.header.classList.toggle("is-scrolled", scrollTop > 18);
      }

      function render() {
        const total = state.cartQty * PRODUCT.price;
        elements.priceLabel.textContent = format(PRODUCT.price);
        elements.qty.value = state.selectedQty;
        elements.checkoutQty.value = state.cartQty || state.selectedQty;
        elements.subtotal.textContent = format(total);
        elements.total.textContent = format(total);
        elements.cartQty.textContent = `${state.cartQty} ${state.cartQty === 1 ? "unidad" : "unidades"}`;
        elements.cartCountLabel.textContent = `${state.cartQty} ${state.cartQty === 1 ? "producto" : "productos"}`;
        const hasProduct = state.cartQty > 0;
        elements.cartRow.style.display = hasProduct ? "grid" : "none";
        elements.emptyCart.classList.toggle("show", !hasProduct);
        localStorage.setItem("terminalEpaycoQty", String(state.cartQty));
        updateCheckoutProgress();
      }

      function pulse(element) {
        element.classList.remove("is-pulsing");
        void element.offsetWidth;
        element.classList.add("is-pulsing");
      }

      function updateCheckoutProgress() {
        const form = elements.form;
        const fullName = form.fullName?.value.trim();
        const email = form.email?.value.trim();
        const phone = form.phone?.value.trim();
        const city = form.city?.value.trim();
        const businessType = form.businessType?.value.trim();
        const address = form.address?.value.trim();
        const contactReady = Boolean(fullName && email && phone);
        const dataReady = Boolean(city && businessType);
        const deliveryReady = Boolean(address);
        const paymentReady = state.cartQty > 0;
        const states = [contactReady, dataReady, deliveryReady, paymentReady];
        let current = states.findIndex((item) => !item);
        if (current === -1) current = 3;
        elements.progressSteps.forEach((step, index) => {
          step.classList.toggle("is-complete", Boolean(states[index]));
          step.classList.toggle("is-current", index === current);
        });
        $$('input, select', form).forEach((field) => field.classList.toggle("input-ready", Boolean(field.value.trim())));
      }

      function bindUI() {
        elements.menuButton.addEventListener("click", () => {
          const open = elements.mobileMenu.classList.toggle("open");
          elements.menuButton.setAttribute("aria-expanded", String(open));
          if (window.gsap && !reduceMotion) {
            gsap.fromTo(elements.mobileMenu, { autoAlpha: 0, y: -8, scaleY: .96 }, { autoAlpha: 1, y: 0, scaleY: 1, duration: .22, ease: "power2.out" });
          }
        });

        $$('a[href^="#"]').forEach((link) => {
          link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;
            const target = $(href);
            if (!target) return;
            event.preventDefault();
            elements.mobileMenu.classList.remove("open");
            elements.menuButton.setAttribute("aria-expanded", "false");
            scrollToTarget(target);
          });
        });

        elements.minus.addEventListener("click", () => { state.selectedQty = clamp(state.selectedQty - 1); render(); animateNumber(elements.qty); });
        elements.plus.addEventListener("click", () => { state.selectedQty = clamp(state.selectedQty + 1); render(); animateNumber(elements.qty); });
        elements.qty.addEventListener("input", () => { state.selectedQty = clamp(elements.qty.value); render(); });
        elements.addProduct.addEventListener("click", () => {
          state.cartQty = state.selectedQty;
          render();
          pulse(elements.cartRow);
          notify("Datáfono agregado al carrito.");
          if (window.gsap && !reduceMotion) {
            gsap.fromTo(elements.addProduct, { scale: .98 }, { scale: 1, duration: .3, ease: "back.out(2)" });
            gsap.fromTo(elements.total, { scale: 1.08, color: "#ed1c27" }, { scale: 1, color: "#16161d", duration: .28, ease: "power2.out" });
          }
        });
        elements.checkoutQty.addEventListener("input", () => { state.cartQty = clamp(elements.checkoutQty.value); state.selectedQty = state.cartQty || 1; render(); animateNumber(elements.checkoutQty); });
        elements.removeProduct.addEventListener("click", () => { state.cartQty = 0; render(); notify("Producto eliminado del carrito."); });
        elements.form.addEventListener("input", updateCheckoutProgress);
        elements.form.addEventListener("change", updateCheckoutProgress);
        elements.form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (state.cartQty <= 0) {
            notify("Agrega al menos un datáfono antes de continuar.");
            elements.qty.focus();
            scrollToTarget("#compra");
            return;
          }
          const buyer = Object.fromEntries(new FormData(elements.form).entries());
          console.table({ producto: PRODUCT.name, cantidad: state.cartQty, total: state.cartQty * PRODUCT.price, comprador: buyer });
          notify("Orden lista para conectar con ePayco Checkout.");
          if (window.gsap && !reduceMotion) gsap.fromTo(elements.form, { y: 0 }, { y: -6, duration: .18, yoyo: true, repeat: 1, ease: "power2.out" });
        });

        window.addEventListener("scroll", updateScrollProgress, { passive: true });
        window.addEventListener("resize", updateScrollProgress);
        document.addEventListener("visibilitychange", () => { if (!document.hidden && window.ScrollTrigger) ScrollTrigger.refresh(); });
      }

      function animateNumber(input) {
        if (!window.gsap || reduceMotion) return;
        gsap.fromTo(input, { scale: 1.08 }, { scale: 1, duration: .25, ease: "power2.out" });
      }

      function initActiveNav() {
        const links = $$(".desktop-nav a, .mobile-menu a").filter((link) => link.hash);
        const sections = links.map((link) => $(link.hash)).filter(Boolean);
        const observer = new IntersectionObserver((entries) => {
          const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          links.forEach((link) => link.classList.toggle("is-active", link.hash === `#${visible.target.id}`));
        }, { rootMargin: "-35% 0px -50% 0px", threshold: [0, .25, .5, .75] });
        sections.forEach((section) => observer.observe(section));
      }

      function initMagneticButtons() {
        if (reduceMotion || !window.gsap) return;
        $$(".btn, .pill").forEach((element) => {
          element.addEventListener("pointermove", (event) => {
            const rect = element.getBoundingClientRect();
            const x = (event.clientX - rect.left - rect.width / 2) * .18;
            const y = (event.clientY - rect.top - rect.height / 2) * .18;
            gsap.to(element, { x, y, duration: .28, ease: "power3.out" });
          });
          element.addEventListener("pointerleave", () => gsap.to(element, { x: 0, y: 0, duration: .34, ease: "elastic.out(1, .45)" }));
        });
      }

      function initHeroTilt() {
        if (reduceMotion || !window.gsap) return;
        const visual = $(".hero-visual");
        if (!visual) return;
        const phone = $(".hero-phone");
        const terminalWrap = $(".hero-terminal-wrap");
        const orbOne = $(".orb-one");
        const orbTwo = $(".orb-two");
        visual.addEventListener("pointermove", (event) => {
          const rect = visual.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - .5;
          const y = (event.clientY - rect.top) / rect.height - .5;
          gsap.to(phone, { x: x * 18, y: y * 14, rotate: x * 2, duration: .28, ease: "power2.out" });
          if (terminalWrap) gsap.to(terminalWrap, { x: x * -24, y: y * -16, rotate: 6 + x * -3, duration: .28, ease: "power2.out" });
          gsap.to(orbOne, { x: x * 34, y: y * 24, duration: .32, ease: "power2.out" });
          gsap.to(orbTwo, { x: x * -26, y: y * -20, duration: .32, ease: "power2.out" });
        });
        visual.addEventListener("pointerleave", () => {
          gsap.to(phone, { x: 0, y: 0, rotate: .5, duration: .7, ease: "elastic.out(1, .55)" });
          if (terminalWrap) gsap.to(terminalWrap, { x: 0, y: 0, rotate: 6, duration: .7, ease: "elastic.out(1, .55)" });
          gsap.to([orbOne, orbTwo], { x: 0, y: 0, duration: .7, ease: "power3.out" });
        });
      }

      function initNfcTerminalHint() {
        if (reduceMotion || !window.gsap) return;
        const img = $(".hero-terminal");
        if (!img) return;
        gsap.fromTo(
          img,
          { filter: "drop-shadow(0 20px 34px rgba(0,0,0,.24))" },
          {
            filter: "brightness(1.12) drop-shadow(0 0 22px rgba(255,216,61,0.5))",
            repeat: -1,
            yoyo: true,
            duration: 1.05,
            ease: "sine.inOut"
          }
        );
      }

      function initScrollLayersParallax() {
        if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
        const main = $("#main");
        if (!main) return;
        const sections = [...main.querySelectorAll("section[data-section]")];
        sections.forEach((section, i) => {
          section.style.zIndex = String(10 + i);
        });

        const mm = typeof gsap.matchMedia === "function" ? gsap.matchMedia() : ScrollTrigger.matchMedia();
        mm.add("(min-width: 768px)", () => {
          sections.forEach((section, i) => {
            if (i === 0) return;
            gsap.fromTo(
              section,
              { y: 96, scale: 0.982, transformOrigin: "50% 0%" },
              {
                y: 0,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top bottom",
                  end: "top 12%",
                  scrub: 0.72,
                  invalidateOnRefresh: true
                }
              }
            );
          });
        });

        $$(".audience-visual img, .measure-visual img").forEach((img) => {
          const sec = img.closest("section[data-section]");
          if (!sec) return;
          gsap.fromTo(
            img,
            { yPercent: 5 },
            {
              yPercent: -11,
              ease: "none",
              scrollTrigger: {
                trigger: sec,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
                invalidateOnRefresh: true
              }
            }
          );
        });

        const benefits = $("#beneficios");
        const benefitsGrid = benefits ? benefits.querySelector(".mini-card-grid") : null;
        if (benefits && benefitsGrid) {
          gsap.to(benefitsGrid, {
            y: -22,
            ease: "none",
            scrollTrigger: {
              trigger: benefits,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.35,
              invalidateOnRefresh: true
            }
          });
        }

        const purchase = $("#compra");
        const purchaseAside = purchase ? purchase.querySelector(".product-buy-card") : null;
        if (purchase && purchaseAside) {
          gsap.fromTo(
            purchaseAside,
            { y: 28 },
            {
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: purchase,
                start: "top bottom",
                end: "top 35%",
                scrub: 0.55,
                invalidateOnRefresh: true
              }
            }
          );
        }

        const cta = document.querySelector(".dark-cta");
        const ctaGrid = cta ? cta.querySelector(".cta-grid") : null;
        if (cta && ctaGrid) {
          gsap.fromTo(
            ctaGrid,
            { y: 48 },
            {
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: cta,
                start: "top bottom",
                end: "top 22%",
                scrub: 0.6,
                invalidateOnRefresh: true
              }
            }
          );
        }

        const faq = $("#faq");
        const faqList = faq ? faq.querySelector(".faq-list") : null;
        if (faq && faqList) {
          gsap.to(faqList, {
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: faq,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        }
      }

      function initGsap() {
        if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
          document.body.classList.add("no-gsap");
          $$(".reveal").forEach((element) => { element.style.opacity = "1"; element.style.transform = "none"; });
          return;
        }
        document.body.classList.remove("no-gsap");
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
        gsap.set("[data-section] .reveal", { autoAlpha: 0, y: 22 });

        $$("[data-section]").forEach((section) => {
          const staggerItems = section.querySelectorAll("[data-stagger] > .reveal, [data-stagger] > article, [data-stagger] > details");
          const normalReveals = [...section.querySelectorAll(".reveal")].filter((el) => !el.closest("[data-stagger]"));
          const tl = gsap.timeline({ paused: true, defaults: { duration: .48, ease: "power2.out" } });
          if (normalReveals.length) tl.to(normalReveals, { autoAlpha: 1, y: 0, stagger: .06 }, 0);
          if (staggerItems.length) tl.to(staggerItems, { autoAlpha: 1, y: 0, stagger: .04 }, .07);
          ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            animation: tl,
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
            fastScrollEnd: true
          });
        });

        initScrollLayersParallax();

        gsap.to(".hero-phone", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero-terminal", { yPercent: 10, rotate: 3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".angled-phone", { yPercent: -8, rotate: 12, ease: "none", scrollTrigger: { trigger: "#beneficios", start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(".floating-ticket", { y: 8 }, { y: -8, duration: 2.5, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.fromTo(".scroll-cue", { y: -4, opacity: .65 }, { y: 5, opacity: 1, duration: 1.35, ease: "sine.inOut", repeat: -1, yoyo: true });

        initNfcTerminalHint();

        const refreshSt = () => ScrollTrigger.refresh();
        requestAnimationFrame(() => {
          refreshSt();
          requestAnimationFrame(refreshSt);
        });
        window.addEventListener("load", refreshSt, { once: true });

        let resizeTimer;
        window.addEventListener("resize", () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(refreshSt, 160);
        });
      }

      bindUI();
      render();
      updateScrollProgress();
      initGsap();
      initActiveNav();
      initMagneticButtons();
      initHeroTilt();
    });

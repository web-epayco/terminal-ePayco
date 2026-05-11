    window.addEventListener("DOMContentLoaded", () => {
      const PRODUCT = { name: "Datáfono compacto", price: 129900, currency: "COP", maxQty: 99 };
      const $ = (selector, parent = document) => parent.querySelector(selector);
      const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
      const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: PRODUCT.currency, maximumFractionDigits: 0 });
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
        const terminal = $(".hero-terminal");
        const orbOne = $(".orb-one");
        const orbTwo = $(".orb-two");
        visual.addEventListener("pointermove", (event) => {
          const rect = visual.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - .5;
          const y = (event.clientY - rect.top) / rect.height - .5;
          gsap.to(phone, { x: x * 18, y: y * 14, rotate: x * 2, duration: .28, ease: "power2.out" });
          gsap.to(terminal, { x: x * -24, y: y * -16, rotate: 6 + x * -3, duration: .28, ease: "power2.out" });
          gsap.to(orbOne, { x: x * 34, y: y * 24, duration: .32, ease: "power2.out" });
          gsap.to(orbTwo, { x: x * -26, y: y * -20, duration: .32, ease: "power2.out" });
        });
        visual.addEventListener("pointerleave", () => {
          gsap.to(phone, { x: 0, y: 0, rotate: .5, duration: .7, ease: "elastic.out(1, .55)" });
          gsap.to(terminal, { x: 0, y: 0, rotate: 6, duration: .7, ease: "elastic.out(1, .55)" });
          gsap.to([orbOne, orbTwo], { x: 0, y: 0, duration: .7, ease: "power3.out" });
        });
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
        gsap.set(".reveal", { autoAlpha: 0, y: 22 });

        $$("[data-section]").forEach((section) => {
          const staggerItems = section.querySelectorAll("[data-stagger] > .reveal, [data-stagger] > article, [data-stagger] > details");
          const normalReveals = section.querySelectorAll(":scope .reveal:not([data-stagger] .reveal)");
          const tl = gsap.timeline({
            defaults: { duration: .42, ease: "power2.out" },
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              end: "bottom 8%",
              toggleActions: "play none none reverse",
              invalidateOnRefresh: true
            }
          });
          if (normalReveals.length) tl.to(normalReveals, { autoAlpha: 1, y: 0, stagger: .055 }, 0);
          if (staggerItems.length) tl.to(staggerItems, { autoAlpha: 1, y: 0, stagger: .035 }, .04);
        });

        gsap.to(".hero-phone", { yPercent: -8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero-terminal", { yPercent: 10, rotate: 3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".angled-phone", { yPercent: -8, rotate: 12, ease: "none", scrollTrigger: { trigger: "#beneficios", start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(".floating-ticket", { y: 8 }, { y: -8, duration: 2.5, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.fromTo(".scroll-cue", { y: -4, opacity: .65 }, { y: 5, opacity: 1, duration: 1.35, ease: "sine.inOut", repeat: -1, yoyo: true });

        let resizeTimer;
        window.addEventListener("resize", () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 180);
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

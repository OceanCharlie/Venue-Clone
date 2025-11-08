(function () {
  'use strict';

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navbarMenu = document.getElementById('navbar-menu');
    const navbarLinks = document.querySelectorAll('.navbar-links a, .dropdown-toggle');

    if (!menuToggle || !navbarMenu) {
      console.warn('Mobile menu elements not found');
      return;
    }

    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      navbarMenu.classList.toggle('show');
      
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });

    document.addEventListener('click', function (e) {
      if (
        navbarMenu.classList.contains('show') &&
        !navbarMenu.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navbarMenu.classList.remove('show');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      }
    });

    navbarLinks.forEach(link => {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          menuToggle.setAttribute('aria-expanded', 'false');
          navbarMenu.classList.remove('show');
          const icon = menuToggle.querySelector('i');
          if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
          }
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navbarMenu.classList.contains('show')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navbarMenu.classList.remove('show');
        menuToggle.focus();
      }
    });

    const handleResize = debounce(function () {
      if (window.innerWidth > 768) {
        navbarMenu.classList.remove('show');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    }, 250);

    window.addEventListener('resize', handleResize);
  }
  
  function initDropdown() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const dropdownContents = document.querySelectorAll('.dropdown-content');

    if (dropdownToggles.length === 0) {
      return;
    }

    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropdown = this.closest('.dropdown');
        const content = dropdown?.querySelector('.dropdown-content');
        const isExpanded = this.getAttribute('aria-expanded') === 'true';

        dropdownToggles.forEach(otherToggle => {
          if (otherToggle !== this) {
            otherToggle.setAttribute('aria-expanded', 'false');
            const otherContent = otherToggle.closest('.dropdown')?.querySelector('.dropdown-content');
            if (otherContent) {
              otherContent.classList.remove('show');
            }
          }
        });

        this.setAttribute('aria-expanded', !isExpanded);
        if (content) {
          content.classList.toggle('show');
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.dropdown')) {
        dropdownToggles.forEach(toggle => {
          toggle.setAttribute('aria-expanded', 'false');
        });
        dropdownContents.forEach(content => {
          content.classList.remove('show');
        });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        dropdownToggles.forEach(toggle => {
          toggle.setAttribute('aria-expanded', 'false');
        });
        dropdownContents.forEach(content => {
          content.classList.remove('show');
        });
      }
    });
  }

  function initCarousel() {
    const track = document.querySelector('.carousel-track');
    const cards = document.querySelectorAll('.carousel .card');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');

    if (!track || cards.length === 0) {
      console.warn('Carousel elements not found');
      return;
    }

    let currentIndex = 0;
    let cardWidth = 0;
    let visibleCards = 1;
    let maxIndex = 0;

    function updateCarouselMetrics() {
      if (cards.length === 0) return;

      const container = track.parentElement;
      const containerWidth = container.offsetWidth;
      const gap = 16;
      const card = cards[0];

      if (window.innerWidth >= 1200) {
        visibleCards = 3;
      } else if (window.innerWidth >= 768) {
        visibleCards = 2;
      } else {
        visibleCards = 1;
      }

      cardWidth = card.offsetWidth + gap;
      maxIndex = Math.max(0, cards.length - visibleCards);
      
      if (currentIndex > maxIndex) {
        currentIndex = maxIndex;
      }
    }

    function updateCarousel() {
      if (!track) return;
      
      const translateX = -currentIndex * cardWidth;
      track.style.transform = `translateX(${translateX}px)`;
      updateButtons();
    }

    function updateButtons() {
      if (prevBtn) {
        prevBtn.disabled = currentIndex === 0;
        prevBtn.setAttribute('aria-disabled', currentIndex === 0);
      }
      if (nextBtn) {
        nextBtn.disabled = currentIndex >= maxIndex;
        nextBtn.setAttribute('aria-disabled', currentIndex >= maxIndex);
      }
    }

    function goToPrev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    }

    function goToNext() {
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    }

    function goToSlide(index) {
      const targetIndex = index * Math.max(1, visibleCards);
      if (targetIndex >= 0 && targetIndex <= maxIndex) {
        currentIndex = targetIndex;
        updateCarousel();
      }
    }

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;

    function getPositionX(e) {
      return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    function startDrag(e) {
      isDragging = true;
      startX = getPositionX(e);
      prevTranslate = -currentIndex * cardWidth;
      track.style.transition = 'none';
      animationID = requestAnimationFrame(animation);
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      const currentX = getPositionX(e);
      const moved = currentX - startX;
      currentTranslate = prevTranslate + moved;
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function endDrag() {
      if (!isDragging) return;
      cancelAnimationFrame(animationID);
      isDragging = false;

      const movedBy = currentTranslate - prevTranslate;
      const threshold = cardWidth * 0.3;

      if (movedBy < -threshold && currentIndex < maxIndex) {
        currentIndex++;
      } else if (movedBy > threshold && currentIndex > 0) {
        currentIndex--;
      }

      updateCarousel();
      track.style.transition = 'transform 0.4s ease';
    }

    function animation() {
      track.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) {
        requestAnimationFrame(animation);
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', goToPrev);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', goToNext);
    }

    track.addEventListener('touchstart', startDrag, { passive: false });
    track.addEventListener('touchmove', drag, { passive: false });
    track.addEventListener('touchend', endDrag);

    track.addEventListener('mousedown', startDrag);
    track.addEventListener('mousemove', drag);
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    });

    updateCarouselMetrics();
    updateCarousel();

    const handleResize = debounce(function () {
      updateCarouselMetrics();
      updateCarousel();
    }, 250);

    window.addEventListener('resize', handleResize);
  }

  function initFormValidation() {
    const searchForm = document.querySelector('.search-box');
    
    if (!searchForm) {
      return;
    }

    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const nameInput = this.querySelector('input[name="name"]');
      const locationInput = this.querySelector('input[name="location"]');
      const categorySelect = this.querySelector('select[name="category"]');
      
      let isValid = true;

      if (!nameInput.value.trim()) {
        isValid = false;
        nameInput.setCustomValidity('Please enter your name');
        nameInput.reportValidity();
      } else {
        nameInput.setCustomValidity('');
      }

      if (!locationInput.value.trim()) {
        isValid = false;
        locationInput.setCustomValidity('Please enter a location');
        locationInput.reportValidity();
      } else {
        locationInput.setCustomValidity('');
      }

      if (!categorySelect.value) {
        isValid = false;
        categorySelect.setCustomValidity('Please select a category');
        categorySelect.reportValidity();
      } else {
        categorySelect.setCustomValidity('');
      }

      if (isValid) {
        console.log('Form submitted:', {
          name: nameInput.value,
          location: locationInput.value,
          category: categorySelect.value
        });
        
        alert('Search submitted! (This is a demo)');
      }
    });

    const inputs = searchForm.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', function () {
        this.setCustomValidity('');
      });
    });
  }

  function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        if (href === '#' || href === '') {
          return;
        }

        const target = document.querySelector(href);
        
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function initFavorites() {
    const favoriteButtons = document.querySelectorAll('.add-btn, [aria-label*="favorites"]');
    
    favoriteButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const itemName = this.closest('.card')?.querySelector('h3')?.textContent || 'item';
        
        this.classList.toggle('active');
        const isFavorite = this.classList.contains('active');
        
        if (this.classList.contains('add-btn')) {
          this.textContent = isFavorite ? '✓' : '+';
          this.setAttribute('aria-label', 
            isFavorite 
              ? `Remove ${itemName} from favorites` 
              : `Add ${itemName} to favorites`
          );
        }
        
        console.log(`${itemName} ${isFavorite ? 'added to' : 'removed from'} favorites`);
        
      });
    });
  }

  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      });

      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => imageObserver.observe(img));
    } else {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  function init() {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
      }

      initMobileMenu();
      initDropdown();
      initCarousel();
      initFormValidation();
      initSmoothScrolling();
      initFavorites();
      initLazyLoading();

      console.log('Venue website initialized successfully');
    } catch (error) {
      console.error('Error initializing website:', error);
    }
  }

  init();

  window.VenueApp = {
    init,
    debounce,
    isInViewport
  };

})();
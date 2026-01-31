// TongHai Nanyang Official Website - Main JavaScript

// ==================== i18n Language Data ====================
const i18n = {
  'zh-TW': {
    nav: {
      home: '首頁',
      services: '服務方案',
      industries: '產業解決方案',
      about: '關於我們',
      team: '團隊',
      insights: '洞察文章',
      contact: '聯絡我們',
      cta: '預約諮詢'
    },
    hero: {
      title: '穩健出海 · 傳承未來',
      subtitle: '以新加坡為總部，深耕新馬雙市場；為臺灣企業家與高淨值家族提供「企業落地 + 身分規劃 + 資產架構」的一站式跨境解決方案。',
      ctaPrimary: '預約諮詢',
      ctaSecondary: '索取服務簡介'
    },
    whatWeDo: {
      title: '我們提供什麼',
      learnMore: '了解更多',
      service1: {
        title: '企業出海與落地',
        desc: '註冊/架構、銀行開戶、准入許可、園區與招商對接'
      },
      service2: {
        title: '身分與人才規劃',
        desc: 'EP/PR路徑、家族辦公室配套、子女教育與安頓、人才引進'
      },
      service3: {
        title: '財富與稅務架構',
        desc: '稅務協定/優化、VCC/信託/家辦、CRS合規、傳承工具'
      },
      service4: {
        title: '房地產與資產配置',
        desc: '新加坡商辦/住宅、柔佛機遇、資產組合配置、長租與保值增值'
      }
    },
    howWeWork: {
      title: '我們的方法',
      step1: '診斷',
      step2: '架構',
      step3: '協調落地',
      step4: '合規迭代'
    },
    whyUs: {
      title: '為什麼選擇通海南洋',
      point1: {
        title: '新馬雙市場實戰',
        desc: '策略與落地同步'
      },
      point2: {
        title: '一站式協同',
        desc: '把零散服務串成可執行的計畫'
      },
      point3: {
        title: '合規與風控優先',
        desc: '流程化、文件化、可追溯'
      },
      point4: {
        title: '在地政商網絡',
        desc: '更快找到對的人與對的路'
      }
    },
    ctaBanner: {
      title: '把出海這件事，做得更穩、更快、更可控。',
      btn1: '立即聯絡',
      btn2: '安排第一次診斷會'
    },
    footer: {
      companyName: '通海南洋',
      tagline: '穩健出海 · 傳承未來',
      quickLinks: '快速連結',
      contactInfo: '聯絡資訊',
      disclaimer: '本網站內容僅供一般資訊與客戶教育之用，不構成法律、稅務或投資建議。具體方案需依個案背景與當地法規評估，並由持牌/合資格專業人士提供意見。',
      copyright: '© 2026 通海南洋咨詢有限公司 版權所有'
    }
  },
  'en': {
    nav: {
      home: 'Home',
      services: 'Services',
      industries: 'Industries',
      about: 'About',
      team: 'Team',
      insights: 'Insights',
      contact: 'Contact',
      cta: 'Book a Consultation'
    },
    hero: {
      title: 'Expand with Confidence · Build a Legacy',
      subtitle: 'Headquartered in Singapore with deep execution in Singapore & Malaysia. We support Taiwanese entrepreneurs and HNW families with end-to-end market entry, residency planning, and wealth structuring—delivered as one integrated cross-border solution.',
      ctaPrimary: 'Book a Consultation',
      ctaSecondary: 'Request a Service Deck'
    },
    whatWeDo: {
      title: 'What We Do',
      learnMore: 'Learn More',
      service1: {
        title: 'Market Entry & Execution',
        desc: 'incorporation/structuring, banking, licensing, government & industrial park liaison'
      },
      service2: {
        title: 'Residency & Talent Planning',
        desc: 'EP/PR pathways, family office support, education & relocation, executive mobility'
      },
      service3: {
        title: 'Wealth & Tax Structuring',
        desc: 'treaty planning, VCC/trust/family office, CRS compliance, legacy solutions'
      },
      service4: {
        title: 'Real Estate & Allocation',
        desc: 'SG commercial/residential, Johor opportunities, portfolio allocation, leasing & preservation'
      }
    },
    howWeWork: {
      title: 'How We Work',
      step1: 'Diagnose',
      step2: 'Structure',
      step3: 'Execute',
      step4: 'Stay Compliant'
    },
    whyUs: {
      title: 'Why TongHai Nanyang',
      point1: {
        title: 'Singapore–Malaysia execution',
        desc: 'not just advice'
      },
      point2: {
        title: 'One integrated plan',
        desc: 'across multiple workstreams'
      },
      point3: {
        title: 'Compliance-first delivery',
        desc: 'with documented processes'
      },
      point4: {
        title: 'Local networks',
        desc: 'for faster coordination'
      }
    },
    ctaBanner: {
      title: 'Make your expansion stable, fast, and controllable.',
      btn1: 'Contact Us',
      btn2: 'Schedule a Discovery Call'
    },
    footer: {
      companyName: 'TongHai Nanyang',
      tagline: 'Expand with Confidence · Build a Legacy',
      quickLinks: 'Quick Links',
      contactInfo: 'Contact',
      disclaimer: 'Content on this website is for general information and client education only and does not constitute legal, tax, or investment advice. Recommendations are case-specific and subject to applicable laws and qualified/licensed professional advice.',
      copyright: '© 2026 TongHai Nanyang Consulting. All rights reserved.'
    }
  }
};

// ==================== Language Management ====================
let currentLang = localStorage.getItem('language') || 'zh-TW';

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const keys = el.dataset.i18n.split('.');
    let value = i18n[lang];

    for (const key of keys) {
      value = value[key];
    }

    if (value) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    }
  });

  // Update HTML lang attribute
  document.documentElement.lang = lang === 'zh-TW' ? 'zh-TW' : 'en';

  // Update language toggle buttons
  updateLanguageToggle(lang);
}

function updateLanguageToggle(lang) {
  const toggleBtns = document.querySelectorAll('[data-lang-toggle]');
  toggleBtns.forEach(btn => {
    if (btn.dataset.langToggle === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  switchLanguage(currentLang);
  initMobileMenu();
  initSmoothScroll();
  initScrollNavbar();
  initFormValidation();
});

// ==================== Mobile Menu ====================
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMobileMenu = document.getElementById('close-mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('translate-x-full');
    });

    closeMobileMenu?.addEventListener('click', () => {
      mobileMenu.classList.add('translate-x-full');
    });

    // Close menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
      });
    });
  }
}

// ==================== Smooth Scroll ====================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = 80;
        const targetPosition = target.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ==================== Scroll Navbar Effect ====================
function initScrollNavbar() {
  const navbar = document.getElementById('navbar');
  let _lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      navbar?.classList.add('shadow-xl');
    } else {
      navbar?.classList.remove('shadow-xl');
    }

    _lastScroll = currentScroll;
  });
}

// ==================== Form Validation ====================
function initFormValidation() {
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate form
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      // Check required fields
      if (!data.name || !data.contact) {
        showToast(currentLang === 'zh-TW' ? '請填寫必填欄位' : 'Please fill in required fields', 'error');
        return;
      }

      try {
        // Submit to Formspree or your backend
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          showToast(currentLang === 'zh-TW' ? '感謝您的留言，我們會盡快與您聯繫！' : 'Thank you! We will contact you soon.', 'success');
          contactForm.reset();
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        showToast(currentLang === 'zh-TW' ? '提交失敗，請稍後再試' : 'Submission failed. Please try again.', 'error');
      }
    });
  }
}

// ==================== Toast Notification ====================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <svg class="w-5 h-5 ${type === 'success' ? 'text-success' : 'text-red-600'}" fill="currentColor" viewBox="0 0 20 20">
        ${type === 'success'
      ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
      : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
    }
      </svg>
      <p class="font-medium">${message}</p>
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==================== Utility Functions ====================
function getCurrentLanguage() {
  return currentLang;
}

// Export for use in other scripts
window.TongHaiNanyang = {
  switchLanguage,
  getCurrentLanguage,
  showToast
};

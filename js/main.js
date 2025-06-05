// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let swiperInstance = null;
let productsData = [];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Плавная прокрутка для якорных ссылок
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                    
                    // Обновляем URL без перезагрузки
                    if (history.pushState) {
                        history.pushState(null, null, targetId);
                    }
                }
            }
        });
    });
}

// Обработчик для межстраничных переходов
function handleCrossPageLinks() {
    document.querySelectorAll('a[href*="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const url = new URL(this.href);
            if (url.pathname !== window.location.pathname) {
                // Сохраняем целевой якорь для плавной прокрутки после загрузки
                localStorage.setItem('scrollTo', url.hash);
                return; // Позволяем переходу произойти
            }
        });
    });

    // Прокрутка после загрузки страницы
    const scrollTo = localStorage.getItem('scrollTo');
    if (scrollTo) {
        const target = document.querySelector(scrollTo);
        if (target) {
            setTimeout(() => {
                window.scrollTo({
                    top: target.offsetTop - 100,
                    behavior: 'smooth'
                });
            }, 100);
        }
        localStorage.removeItem('scrollTo');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showErrorMessage() {
    const container = document.getElementById('marketItems');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <p>Products not available. Please try later.</p>
                <button id="retryButton" class="btn">Retry</button>
            </div>
        `;
        document.getElementById('retryButton')?.addEventListener('click', loadProducts);
    }
}

// ========== ФУНКЦИИ КОРЗИНЫ ==========
function addToCart(e) {
    const productId = e.target.closest('.market-item').dataset.id;
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    cart[productId] = (cart[productId] || 0) + 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Немедленное обновление интерфейса
    updateCartCounter();
    updateCartUI();
    
    // Показываем уведомление с анимацией
    showNotification('Item added to cart!');
    
    // Принудительное отображение счетчика
    document.querySelectorAll('.cart-count').forEach(el => {
        el.style.display = 'flex';
    });
}

// Глобальное обновление корзины
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
        
        // Добавляем анимацию при изменении
        if (count > 0) {
            el.style.animation = 'bounce 0.3s';
            setTimeout(() => {
                el.style.animation = '';
            }, 300);
        }
    });
}

// Вызываем при загрузке каждой страницы
document.addEventListener('DOMContentLoaded', updateCartCounter);

function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    
    // Обновление счетчика
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
    
    // Обновление содержимого корзины
    const cartItemsEl = document.getElementById('cartItems');
    if (cartItemsEl && productsData.length > 0) {
        let total = 0;
        cartItemsEl.innerHTML = '';
        
        for (const [id, quantity] of Object.entries(cart)) {
            const product = productsData.find(p => p.id == id);
            if (product) {
                total += product.price * quantity;
                cartItemsEl.innerHTML += `
                    <div class="cart-item">
                        <span>${escapeHtml(product.name)} x${quantity}</span>
                        <span>$${(product.price * quantity).toFixed(2)}</span>
                    </div>
                `;
            }
        }
        
        const cartTotalEl = document.getElementById('cartTotal');
        if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
    }
}

function checkout() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    if (!user) {
        alert('Please login to checkout');
        document.getElementById('authPopup').style.display = 'flex';
        return;
    }
    
    if (Object.keys(cart).length === 0) {
        alert('Cart is empty');
        return;
    }
    
    alert(`Order confirmed! The payment link has been sent to your email! Total: $${document.getElementById('cartTotal').textContent} `);
    localStorage.removeItem('cart');
    updateCartUI();
    document.getElementById('cartPopup').style.display = 'none';
}

// ========== РАБОТА С ТОВАРАМИ ==========
async function loadProducts() {
    try {
        console.log("Loading products...");
        const response = await fetch('data/products.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        productsData = await response.json();
        console.log("Products loaded:", productsData);
        renderProducts(productsData);
    } catch (error) {
        console.error("Error loading products:", error);
        showErrorMessage();
    }
}

function renderProducts(products) {
    const container = document.getElementById('marketItems');
    if (!container) {
        console.warn("Market items container not found");
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="market-item" data-id="${product.id}">
            <div class="item-image" style="background-image: url('${product.image}')"></div>
            <div class="item-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn add-to-cart">Add to Cart</button>
            </div>
        </div>
    `).join('');

    // Назначение обработчиков для кнопок
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initCart() {
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.addEventListener('click', function() {
            updateCartUI();
            const cartPopup = document.getElementById('cartPopup');
            if (cartPopup) cartPopup.style.display = 'flex';
        });
    }
}
function initSwiper() {
    if (typeof Swiper === 'undefined') return;

    swiperInstance = new Swiper('.swiper', {
        loop: true, // Отключаем loop
        slidesPerView: 'auto', // Автоподбор ширины
        centeredSlides: true, // Центрируем активный слайд
        spaceBetween: 30,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // Фикс для резких переходов
        on: {
            transitionEnd: function() {
                this.slideTo(this.activeIndex, 0);
            }
        }
    });
}


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initSwiper);

function setupEventListeners() {
    // Обработчики для попапов
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const popup = btn.closest('.popup');
            if (popup) popup.style.display = 'none';
        });
    });

    // Обработчик оформления заказа
    document.querySelector('.checkout-btn')?.addEventListener('click', checkout);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Проверка авторизации
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const accountButton = document.getElementById('accountButton');
    if (accountButton) {
        accountButton.textContent = currentUser?.username || 'My Account';
        if (currentUser) accountButton.classList.add('logged-in');
    }

    // Инициализация модулей
    initCart();
    loadProducts();
    initSwiper();
    setupEventListeners();
});


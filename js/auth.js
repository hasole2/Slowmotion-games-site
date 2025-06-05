// Хранилище пользователей
const userDB = {
  getUsers: () => JSON.parse(localStorage.getItem('users')) || [],
  saveUser: (user) => {
    const users = userDB.getUsers();
    const existing = users.find(u => u.username === user.username);
    if (existing) {
      Object.assign(existing, user);
    } else {
      users.push(user);
    }
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// Текущий пользователь
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
}

// Проверка авторизации
function checkAuth() {
  const user = getCurrentUser();
  const accountBtn = document.getElementById('accountButton');
  
  if (user && accountBtn) {
    accountBtn.textContent = user.username;
    accountBtn.classList.add('logged-in');
  } else if (accountBtn) {
    accountBtn.textContent = 'My Account';
    accountBtn.classList.remove('logged-in');
  }
}

// Авторизация
function login(username, password) {
  const user = userDB.getUsers().find(u => 
    u.username === username && u.password === password
  );
  
  if (user) {
    setCurrentUser(user);
    return true;
  }
  return false;
}

// Регистрация
function register(username, password) {
  if (userDB.getUsers().some(u => u.username === username)) {
    return false;
  }
  
  const newUser = { username, password, cart: {} };
  userDB.saveUser(newUser);
  setCurrentUser(newUser);
  return true;
}

// Выход
function logout() {
  setCurrentUser(null);
  location.reload();
}

// Инициализация
function initAuth() {
  checkAuth();
  
  // Обработчик кнопки аккаунта
  document.getElementById('accountButton')?.addEventListener('click', function(e) {
    e.preventDefault();
    const user = getCurrentUser();
    
    if (user) {
      if (confirm(`Logout from ${user.username}?`)) {
        logout();
      }
    } else {
      document.getElementById('authPopup').style.display = 'flex';
      document.getElementById('loginForm').style.display = 'block';
      document.getElementById('registerForm').style.display = 'none';
    }
  });
  
  // Обработчики форм
  document.getElementById('loginButton')?.addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (login(username, password)) {
      location.reload();
    } else {
      alert('Invalid credentials');
    }
  });
  
  document.getElementById('registerButton')?.addEventListener('click', () => {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    if (register(username, password)) {
      location.reload();
    } else {
      alert('Username already taken');
    }
  });
  
  // Переключение между формами
  document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  });
  
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
  });
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', initAuth);

// Добавьте в функцию initAuth()
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('authPopup').style.display = 'none';
    });
});
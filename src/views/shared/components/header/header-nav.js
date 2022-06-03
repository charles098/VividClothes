import headerNavAdmin from './header-nav-admin.js';
import headerNavUser from './header-nav-user.js';

const notLoginHeaderNav = () => /* html */ `
<ul class="flex-style">
  <li>
    <a class="link" href="/login">로그인</a>
    <span class="mx-3">/</span>
  </li>
  <li>
    <a class="link" href="/register">회원가입</a>
  </li>
</ul>
`;

const loginHeaderNav = (config, dropdownContent) => /* html */ `
  <ul class="flex-style">
    <li>
      <a class="link" href="/profile">회원정보</a>
      <span class="mx-3">/</span>
    </li>
    
    <li id="nav-mid">
      <div class="dropdown">
      <span class="dropdown-trigger link" role="button">
        ${config}
        <i class="fa-solid fa-angle-down ml-2"></i>
      </span>
      <div class="dropdown-menu" id="dropdown-menu3" role="menu">
        <div class="dropdown-content">
          ${dropdownContent()}
        </div class="dropdown-content">
      </div>
      <span class="mx-3">/</span>
      </div>
    </li>
  
    <li>
      <a class="logout link" href="#" role="button">로그아웃</a>
    </li>
  </ul>
`;

const createHeaderNav = (props) => {
  const isLogin = localStorage.getItem('token') ? true : false;
  const isAdmin = localStorage.getItem('role') === 'admin-user';

  const config = isAdmin ? '관리자 설정' : '마이 페이지';
  const dropdownContent = isAdmin ? headerNavAdmin : headerNavUser;

  return !isLogin ? notLoginHeaderNav() : loginHeaderNav(config, dropdownContent);
};

const headerNav = document.createElement('div');
headerNav.insertAdjacentHTML('afterbegin', createHeaderNav());

function addHeaderNavEventListener() {
  dropdownEventListener();
  logoutEventListener();
}

function dropdownEventListener() {
  const dropdownTrigger = headerNav.querySelector('.dropdown-trigger');
  const dropdownMenu = headerNav.querySelector('.dropdown-menu');

  if (!dropdownTrigger) return;

  const dropdownHandler = () => {
    dropdownTrigger.classList.toggle('clicked');
    dropdownMenu.classList.toggle('show');
  };

  dropdownTrigger.addEventListener('click', dropdownHandler);
}

function logoutEventListener() {
  const logoutBtn = headerNav.querySelector('.logout');

  if (!logoutBtn) return;

  const logoutHandler = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('hashedEmail');
    window.location.href = '/';
  };

  logoutBtn.addEventListener('click', (e) => logoutHandler(e));
}

export { headerNav, addHeaderNavEventListener };
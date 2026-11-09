// MyToDoList - Realtime Collaborative Application Logic
import {
  initFirebase,
  firebaseConfig,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  getDoc,
  setDoc
} from "./firebase-config.js";

// State
let auth, db, googleProvider;
let currentUser = null;
let currentListId = null;
let currentListData = null;
let userLists = [];
let todos = [];
let unsubscribeLists = null;
let unsubscribeTodos = null;
let activeFilter = 'all';
let searchQuery = '';
let isDemoMode = false;

// DOM Elements
const authLoading = document.getElementById('auth-loading');
const googleLoginBtn = document.getElementById('google-login-btn');
const welcomeLoginBtn = document.getElementById('welcome-login-btn');
const welcomeDemoBtn = document.getElementById('welcome-demo-btn');
const bannerDemoBtn = document.getElementById('banner-demo-btn');
const demoModeBadge = document.getElementById('demo-mode-badge');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const welcomeView = document.getElementById('welcome-view');
const appWorkspace = document.getElementById('app-workspace');

const listsContainer = document.getElementById('lists-container');
const createListModalBtn = document.getElementById('create-list-modal-btn');
const joinListModalBtn = document.getElementById('join-list-modal-btn');
const inviteBtnSidebar = document.getElementById('invite-btn-sidebar');

const activeListTitle = document.getElementById('active-list-title');
const activeListDesc = document.getElementById('active-list-description');
const activeListColorBadge = document.getElementById('active-list-color-badge');
const activeListRoleBadge = document.getElementById('active-list-role-badge');
const collaboratorsAvatarStack = document.getElementById('collaborators-avatar-stack');
const shareListBtn = document.getElementById('share-list-btn');
const deleteListBtn = document.getElementById('delete-list-btn');

const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentText = document.getElementById('progress-percent-text');
const progressSummaryText = document.getElementById('progress-summary-text');

const addTodoForm = document.getElementById('add-todo-form');
const todoInput = document.getElementById('todo-input');
const todoPriority = document.getElementById('todo-priority');
const todoAssignee = document.getElementById('todo-assignee');
const todoDueDate = document.getElementById('todo-due-date');
const todosList = document.getElementById('todos-list');
const todosEmptyState = document.getElementById('todos-empty-state');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');

const configModal = document.getElementById('config-modal');
const openConfigBtn = document.getElementById('open-config-btn');
const bannerConfigBtn = document.getElementById('banner-config-btn');
const configAlertBanner = document.getElementById('config-alert-banner');
const configForm = document.getElementById('config-form');
const configApiKeyInput = document.getElementById('config-api-key');
const configAuthDomainInput = document.getElementById('config-auth-domain');
const configResetBtn = document.getElementById('config-reset-btn');

const createListModal = document.getElementById('create-list-modal');
const createListForm = document.getElementById('create-list-form');
const shareModal = document.getElementById('share-modal');
const shareCodeInput = document.getElementById('share-code-input');
const copyCodeBtn = document.getElementById('copy-code-btn');
const inviteEmailForm = document.getElementById('invite-email-form');
const inviteEmailInput = document.getElementById('invite-email-input');
const modalMembersList = document.getElementById('modal-members-list');
const joinListModal = document.getElementById('join-list-modal');
const joinListForm = document.getElementById('join-list-form');
const joinListIdInput = document.getElementById('join-list-id-input');
const toastContainer = document.getElementById('toast-container');

// Sound Effect via Web Audio API
function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio errors
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white',
    warning: 'bg-amber-600 text-white'
  };
  const iconNames = {
    success: 'check-circle-2',
    error: 'alert-circle',
    info: 'info',
    warning: 'alert-triangle'
  };

  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium ${bgColors[type] || bgColors.info} animate-fade-in transition-all duration-200`;
  toast.innerHTML = `
    <i data-lucide="${iconNames[type] || 'info'}" class="w-4 h-4 flex-shrink-0"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// Modal Helpers
function openModal(modal) {
  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}
function closeModal(modal) {
  modal.classList.add('hidden');
}

document.querySelectorAll('.close-modal-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-modal');
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) closeModal(modal);
    }
  });
});

// Setup Firebase API configuration check
function checkFirebaseConfig() {
  const currentKey = firebaseConfig.apiKey;
  if (!currentKey || currentKey.includes("YOUR_API_KEY")) {
    configAlertBanner.classList.remove('hidden');
    configApiKeyInput.value = "";
    return false;
  } else {
    configAlertBanner.classList.add('hidden');
    configApiKeyInput.value = currentKey;
    configAuthDomainInput.value = firebaseConfig.authDomain || "my-to-do-list-eca14.firebaseapp.com";
    return true;
  }
}

// Initialize Application
function initializeAppLogic() {
  try {
    const isReady = checkFirebaseConfig();

    // If real API key is ready, prefer real Firebase unless demo mode is explicitly active
    const savedMode = localStorage.getItem("my_todo_mode");
    if (savedMode === "demo") {
      startDemoMode();
      return;
    }

    if (!isReady) {
      authLoading.classList.add('hidden');
      googleLoginBtn.classList.remove('hidden');
      welcomeView.classList.remove('hidden');
      appWorkspace.classList.add('hidden');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const res = initFirebase();
    if (!res.initialized) {
      authLoading.classList.add('hidden');
      configAlertBanner.classList.remove('hidden');
      googleLoginBtn.classList.remove('hidden');
      welcomeView.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    auth = res.auth;
    db = res.db;
    googleProvider = res.googleProvider;

    // Listen for Auth changes
    onAuthStateChanged(auth, async (user) => {
      authLoading.classList.add('hidden');
      if (user) {
        currentUser = user;
        isDemoMode = false;
        demoModeBadge.classList.add('hidden');
        updateUserUI(user);
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=random`,
            lastLogin: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.warn("無法寫入使用者資料庫文檔:", err);
        }

        welcomeView.classList.add('hidden');
        appWorkspace.classList.remove('hidden');
        subscribeToUserLists();
      } else {
        currentUser = null;
        currentListId = null;
        userProfile.classList.add('hidden');
        googleLoginBtn.classList.remove('hidden');
        welcomeView.classList.remove('hidden');
        appWorkspace.classList.add('hidden');
        if (unsubscribeLists) unsubscribeLists();
        if (unsubscribeTodos) unsubscribeTodos();
      }
      if (window.lucide) window.lucide.createIcons();
    });
  } catch (err) {
    console.error("初始化錯誤:", err);
    authLoading.classList.add('hidden');
    googleLoginBtn.classList.remove('hidden');
    welcomeView.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}

// Update User Header Info
function updateUserUI(user) {
  googleLoginBtn.classList.add('hidden');
  userProfile.classList.remove('hidden');
  userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff`;
  userName.textContent = user.displayName || user.email.split('@')[0];
  userEmail.textContent = user.email;
}

// Google Sign In
async function handleGoogleLogin() {
  if (!auth) {
    // If API key is not yet set, offer instant Demo mode or entering key
    const choice = confirm("目前尚未填入 Firebase Web API Key。\n\n點擊「確定」立即進入【展示體驗模式】體驗完整 Google 登入與多人協作；\n點擊「取消」則可開啟設定視窗填寫 API Key。");
    if (choice) {
      startDemoMode();
    } else {
      openModal(configModal);
    }
    return;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    showToast(`歡迎回來，${result.user.displayName || result.user.email}！`, 'success');
  } catch (error) {
    console.error("登入失敗:", error);
    if (error.code === 'auth/popup-blocked') {
      showToast("彈出式視窗已被瀏覽器阻擋，請允許彈跳視窗後重試", "error");
    } else if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      const enterDemo = confirm("Firebase 專案設定尚未完成 (API Key 無效或未啟用 Google 登入)。\n\n是否立即啟動【展示體驗模式】體驗功能？");
      if (enterDemo) {
        startDemoMode();
      } else {
        openModal(configModal);
      }
    } else if (error.code === 'auth/unauthorized-domain') {
      showToast("此網域尚未加入 Firebase 授權網域清單", "error");
      const openSettings = confirm(`⚠️ 網域未授權錯誤 (auth/unauthorized-domain)\n\n目前網域 (${window.location.hostname}) 尚未加入 Firebase 的授權網域中。\n\n點擊「確定」將為您開啟設定頁面，請在「已授權的網域」點擊新增：\n${window.location.hostname}\n\n儲存後即可直接登入！`);
      if (openSettings) {
        window.open("https://console.firebase.google.com/project/my-to-do-list-eca14/authentication/settings", "_blank");
      }
    } else {
      showToast(`登入錯誤: ${error.message}`, "error");
    }
  }
}

// Sign Out
async function handleLogout() {
  if (isDemoMode) {
    localStorage.removeItem("my_todo_mode");
    isDemoMode = false;
    currentUser = null;
    currentListId = null;
    demoModeBadge.classList.add('hidden');
    userProfile.classList.add('hidden');
    googleLoginBtn.classList.remove('hidden');
    welcomeView.classList.remove('hidden');
    appWorkspace.classList.add('hidden');
    showToast("已退出展示模式", "info");
    return;
  }
  try {
    await signOut(auth);
    showToast("已成功登出", "info");
  } catch (error) {
    showToast(`登出失敗: ${error.message}`, "error");
  }
}

// Realtime User's Lists Subscription
function subscribeToUserLists() {
  if (isDemoMode) {
    loadDemoLists();
    return;
  }

  if (!currentUser || !db) return;

  const listsRef = collection(db, 'lists');
  const q = query(listsRef, where('members', 'array-contains', currentUser.email));

  if (unsubscribeLists) unsubscribeLists();

  unsubscribeLists = onSnapshot(q, async (snapshot) => {
    userLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (userLists.length === 0) {
      await createInitialList();
      return;
    }

    renderListsSidebar();

    const listExists = userLists.find(l => l.id === currentListId);
    if (!listExists && userLists.length > 0) {
      switchActiveList(userLists[0].id);
    } else if (listExists) {
      switchActiveList(currentListId);
    }
  }, (error) => {
    console.error("監聽清單失敗:", error);
    if (error.code === 'not-found' || (error.message && error.message.includes('not exist'))) {
      showToast("尚未在 Firebase 控制台建立 Firestore 資料庫", "warning");
      const goCreate = confirm("⚠️ 您的 Firebase 專案 (my-to-do-list-eca14) 尚未建立 Cloud Firestore 資料庫！\n\n點擊「確定」將為您開啟 Firestore 控制台，點擊「建立資料庫 (Create database)」即可啟用；\n若想先試用功能，可點擊「取消」切換至展示體驗模式。");
      if (goCreate) {
        window.open("https://console.firebase.google.com/project/my-to-do-list-eca14/firestore", "_blank");
      } else {
        startDemoMode();
      }
    } else {
      showToast(`載入清單失敗: ${error.message}`, "error");
    }
  });
}

// Create initial default list for new users
async function createInitialList() {
  try {
    const defaultList = {
      name: "我的待辦事項",
      description: "歡迎使用！這是您的第一個協作清單，您可以新增任務或點擊「分享/邀請」將夥伴加入。",
      color: "#4f46e5",
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email,
      ownerName: currentUser.displayName || currentUser.email.split('@')[0],
      members: [currentUser.email],
      memberProfiles: [{
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}`
      }],
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'lists'), defaultList);
    await addDoc(collection(db, 'lists', docRef.id, 'todos'), {
      text: "歡迎來到 MyToDoList！點擊核取方塊標記完成 🎉",
      completed: false,
      priority: "high",
      assignedTo: currentUser.email,
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      createdBy: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        email: currentUser.email,
        photoURL: currentUser.photoURL || ""
      },
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("建立預設清單失敗:", error);
  }
}

// Render Sidebar Lists
function renderListsSidebar() {
  listsContainer.innerHTML = '';
  if (userLists.length === 0) {
    listsContainer.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs">
        尚未建立任何清單
      </div>
    `;
    return;
  }

  userLists.forEach(list => {
    const isCurrent = list.id === currentListId;
    const isOwner = list.ownerEmail === currentUser.email;
    const memberCount = list.members ? list.members.length : 1;

    const item = document.createElement('button');
    item.className = `w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
      isCurrent
        ? 'bg-indigo-50/80 border border-indigo-200/80 shadow-xs text-indigo-900 font-semibold'
        : 'hover:bg-slate-100/70 text-slate-700 font-medium'
    }`;
    item.innerHTML = `
      <div class="flex items-center gap-2.5 truncate">
        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${list.color || '#4f46e5'}"></span>
        <span class="text-xs truncate">${list.name}</span>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <span class="text-[10px] px-1.5 py-0.5 rounded-full ${isOwner ? 'bg-slate-200/60 text-slate-600' : 'bg-purple-100 text-purple-700'}">
          ${isOwner ? '擁有者' : '受邀'}
        </span>
        <span class="text-[11px] text-slate-400 flex items-center gap-0.5">
          <i data-lucide="users" class="w-3 h-3"></i>
          ${memberCount}
        </span>
      </div>
    `;

    item.addEventListener('click', () => switchActiveList(list.id));
    listsContainer.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Switch Active List & Subscribe to its Todos
function switchActiveList(listId) {
  currentListId = listId;
  currentListData = userLists.find(l => l.id === listId);

  renderListsSidebar();

  if (!currentListData) return;

  activeListTitle.textContent = currentListData.name;
  activeListDesc.textContent = currentListData.description || '無清單備註說明';
  activeListColorBadge.style.backgroundColor = currentListData.color || '#4f46e5';

  const isOwner = currentListData.ownerEmail === currentUser.email;
  activeListRoleBadge.textContent = isOwner ? '擁有者' : '協作成員';
  activeListRoleBadge.className = isOwner
    ? 'px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/50'
    : 'px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200/50';

  deleteListBtn.style.display = isOwner ? 'block' : 'none';

  renderCollaboratorsStack(currentListData);
  updateAssigneeDropdown(currentListData);

  if (isDemoMode) {
    loadDemoTodos(listId);
  } else {
    subscribeToTodos(listId);
  }
}

// Render Collaborators Avatars
function renderCollaboratorsStack(list) {
  collaboratorsAvatarStack.innerHTML = '';
  const members = list.memberProfiles || [];

  members.slice(0, 5).forEach(m => {
    const avatar = document.createElement('img');
    avatar.className = 'w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs';
    avatar.src = m.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.displayName || m.email)}&background=random`;
    avatar.title = `${m.displayName || m.email} (${m.email})`;
    collaboratorsAvatarStack.appendChild(avatar);
  });

  if (members.length > 5) {
    const extraBadge = document.createElement('div');
    extraBadge.className = 'w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-xs';
    extraBadge.textContent = `+${members.length - 5}`;
    collaboratorsAvatarStack.appendChild(extraBadge);
  }
}

// Update Assignee Dropdown
function updateAssigneeDropdown(list) {
  todoAssignee.innerHTML = '<option value="">未指派</option>';
  const members = list.memberProfiles || [];
  members.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.email;
    opt.textContent = `${m.displayName || m.email} ${m.email === currentUser.email ? '(我)' : ''}`;
    todoAssignee.appendChild(opt);
  });
}

// Realtime Todos Subscription
function subscribeToTodos(listId) {
  if (unsubscribeTodos) unsubscribeTodos();

  const todosRef = collection(db, 'lists', listId, 'todos');
  const q = query(todosRef, orderBy('createdAt', 'desc'));

  unsubscribeTodos = onSnapshot(q, (snapshot) => {
    todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateTodosProgress();
    renderTodosList();
  }, (error) => {
    console.error("監聽待辦事項失敗:", error);
    showToast(`即時更新失敗: ${error.message}`, "error");
  });
}

// Update Progress Metrics
function updateTodosProgress() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBarFill.style.width = `${percent}%`;
  progressPercentText.textContent = `${percent}%`;
  progressSummaryText.textContent = `${pending} 項待辦中，${completed} 項已完成 (共 ${total} 項)`;
}

// Render Todos List with Active Filters & Search
function renderTodosList() {
  todosList.innerHTML = '';

  let filtered = [...todos];

  if (activeFilter === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (activeFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  } else if (activeFilter === 'assigned-to-me') {
    filtered = filtered.filter(t => t.assignedTo === currentUser.email);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      (t.text && t.text.toLowerCase().includes(q)) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
      (t.createdBy && t.createdBy.displayName && t.createdBy.displayName.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    todosEmptyState.classList.remove('hidden');
    return;
  } else {
    todosEmptyState.classList.add('hidden');
  }

  filtered.forEach(todo => {
    const item = createTodoItemElement(todo);
    todosList.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Create single Todo DOM Element
function createTodoItemElement(todo) {
  const div = document.createElement('div');
  div.className = `p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex items-start gap-3 group animate-fade-in ${
    todo.completed ? 'bg-slate-50/70 border-slate-200/50' : ''
  }`;

  const priorityConfig = {
    high: { label: '高優先', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60' },
    medium: { label: '中優先', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
    low: { label: '低優先', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' }
  };
  const prio = priorityConfig[todo.priority] || priorityConfig.medium;

  let dueBadge = '';
  if (todo.dueDate) {
    const isOverdue = !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString());
    dueBadge = `
      <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${
        isOverdue ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-500'
      }">
        <i data-lucide="calendar" class="w-3 h-3"></i>
        ${todo.dueDate} ${isOverdue ? '(逾期)' : ''}
      </span>
    `;
  }

  let assigneeBadge = '';
  if (todo.assignedTo) {
    assigneeBadge = `
      <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
        <i data-lucide="user" class="w-3 h-3"></i>
        ${todo.assignedTo.split('@')[0]}
      </span>
    `;
  }

  const creatorName = todo.createdBy ? (todo.createdBy.displayName || todo.createdBy.email) : '成員';

  div.innerHTML = `
    <div class="pt-0.5">
      <input type="checkbox" ${todo.completed ? 'checked' : ''} class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer todo-toggle">
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1.5 flex-wrap">
        <span class="todo-text text-sm font-medium ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'} break-all">
          ${escapeHtml(todo.text)}
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${prio.bg} ${prio.text} ${prio.border}">
          ${prio.label}
        </span>
        ${dueBadge}
        ${assigneeBadge}
        <span class="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
          由 ${creatorName} 建立
        </span>
      </div>
    </div>
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="edit-todo-btn p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100" title="編輯內容">
        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
      </button>
      <button class="delete-todo-btn p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50" title="刪除任務">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `;

  // Toggle Checkbox
  const toggleCheckbox = div.querySelector('.todo-toggle');
  toggleCheckbox.addEventListener('change', async () => {
    const newStatus = toggleCheckbox.checked;
    if (newStatus) playCompletionSound();

    if (isDemoMode) {
      todo.completed = newStatus;
      saveDemoState();
      updateTodosProgress();
      renderTodosList();
      return;
    }

    try {
      await updateDoc(doc(db, 'lists', currentListId, 'todos', todo.id), {
        completed: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      showToast(`更新失敗: ${err.message}`, "error");
    }
  });

  // Delete Todo
  const deleteBtn = div.querySelector('.delete-todo-btn');
  deleteBtn.addEventListener('click', async () => {
    if (confirm("確定要刪除此待辦事項嗎？")) {
      if (isDemoMode) {
        todos = todos.filter(t => t.id !== todo.id);
        saveDemoState();
        updateTodosProgress();
        renderTodosList();
        showToast("已刪除任務", "info");
        return;
      }
      try {
        await deleteDoc(doc(db, 'lists', currentListId, 'todos', todo.id));
        showToast("已刪除任務", "info");
      } catch (err) {
        showToast(`刪除失敗: ${err.message}`, "error");
      }
    }
  });

  // Edit Todo
  const editBtn = div.querySelector('.edit-todo-btn');
  editBtn.addEventListener('click', async () => {
    const newText = prompt("修改待辦內容:", todo.text);
    if (newText && newText.trim() && newText.trim() !== todo.text) {
      if (isDemoMode) {
        todo.text = newText.trim();
        saveDemoState();
        renderTodosList();
        showToast("已更新任務內容", "success");
        return;
      }
      try {
        await updateDoc(doc(db, 'lists', currentListId, 'todos', todo.id), {
          text: newText.trim(),
          updatedAt: serverTimestamp()
        });
        showToast("已更新任務內容", "success");
      } catch (err) {
        showToast(`更新失敗: ${err.message}`, "error");
      }
    }
  });

  return div;
}

// Add New Todo Submit Handler
addTodoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text || !currentListId) return;

  const priority = todoPriority.value;
  const assignedTo = todoAssignee.value;
  const dueDate = todoDueDate.value;

  if (isDemoMode) {
    const newTodo = {
      id: "demo-todo-" + Date.now(),
      text,
      completed: false,
      priority,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdBy: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL
      },
      createdAt: new Date().toISOString()
    };
    todos.unshift(newTodo);
    saveDemoState();
    updateTodosProgress();
    renderTodosList();
    todoInput.value = '';
    todoDueDate.value = '';
    showToast("任務已新增！", "success");
    return;
  }

  try {
    await addDoc(collection(db, 'lists', currentListId, 'todos'), {
      text,
      completed: false,
      priority,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdBy: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        email: currentUser.email,
        photoURL: currentUser.photoURL || ""
      },
      createdAt: serverTimestamp()
    });

    todoInput.value = '';
    todoDueDate.value = '';
    showToast("任務已新增！", "success");
  } catch (error) {
    showToast(`新增失敗: ${error.message}`, "error");
  }
});

// Create New List Submit Handler
createListForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('new-list-name').value.trim();
  const desc = document.getElementById('new-list-desc').value.trim();
  const color = document.querySelector('input[name="list-color"]:checked')?.value || "#4f46e5";

  if (!name || !currentUser) return;

  if (isDemoMode) {
    const newList = {
      id: "demo-list-" + Date.now(),
      name,
      description: desc,
      color,
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email,
      ownerName: currentUser.displayName,
      members: [currentUser.email],
      memberProfiles: [{
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL
      }]
    };
    userLists.push(newList);
    saveDemoState();
    createListForm.reset();
    closeModal(createListModal);
    switchActiveList(newList.id);
    showToast(`成功建立清單「${name}」！`, "success");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, 'lists'), {
      name,
      description: desc,
      color,
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email,
      ownerName: currentUser.displayName || currentUser.email.split('@')[0],
      members: [currentUser.email],
      memberProfiles: [{
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}`
      }],
      createdAt: serverTimestamp()
    });

    createListForm.reset();
    closeModal(createListModal);
    currentListId = docRef.id;
    showToast(`成功建立清單「${name}」！`, "success");
  } catch (error) {
    showToast(`建立失敗: ${error.message}`, "error");
  }
});

// Delete Active List
deleteListBtn.addEventListener('click', async () => {
  if (!currentListData || currentListData.ownerEmail !== currentUser.email) {
    showToast("只有清單擁有者可以刪除此清單", "warning");
    return;
  }

  if (confirm(`確定要刪除清單「${currentListData.name}」及其所有待辦事項嗎？此操作無法復原。`)) {
    if (isDemoMode) {
      userLists = userLists.filter(l => l.id !== currentListId);
      saveDemoState();
      currentListId = userLists.length > 0 ? userLists[0].id : null;
      renderListsSidebar();
      if (currentListId) switchActiveList(currentListId);
      showToast("已刪除清單", "info");
      return;
    }

    try {
      await deleteDoc(doc(db, 'lists', currentListId));
      showToast("已刪除清單", "info");
      currentListId = null;
    } catch (err) {
      showToast(`刪除失敗: ${err.message}`, "error");
    }
  }
});

// Open Share & Invite Modal
function openShareModal() {
  if (!currentListData) return;
  shareCodeInput.value = currentListId;

  modalMembersList.innerHTML = '';
  const members = currentListData.memberProfiles || [];
  members.forEach(m => {
    const isListOwner = m.email === currentListData.ownerEmail;
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <img class="w-6 h-6 rounded-full" src="${m.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.email)}`}" alt="">
        <div>
          <span class="font-medium text-slate-800">${m.displayName || m.email}</span>
          <span class="text-[10px] text-slate-400 block">${m.email}</span>
        </div>
      </div>
      <span class="text-[10px] px-2 py-0.5 rounded-full ${isListOwner ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'bg-slate-200 text-slate-600'}">
        ${isListOwner ? '擁有者' : '協作者'}
      </span>
    `;
    modalMembersList.appendChild(row);
  });

  openModal(shareModal);
}

shareListBtn.addEventListener('click', openShareModal);
inviteBtnSidebar.addEventListener('click', openShareModal);

// Copy Share Code
copyCodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shareCodeInput.value).then(() => {
    showToast("清單代碼已複製到剪貼簿！", "success");
  }).catch(() => {
    shareCodeInput.select();
    showToast("請手動複製代碼", "info");
  });
});

// Invite Member by Email Form
inviteEmailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = inviteEmailInput.value.trim().toLowerCase();
  if (!email || !currentListId) return;

  if (currentListData.members && currentListData.members.includes(email)) {
    showToast("該使用者已在協作成員名單中", "warning");
    return;
  }

  if (isDemoMode) {
    currentListData.members.push(email);
    currentListData.memberProfiles.push({
      email,
      displayName: email.split('@')[0],
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`
    });
    saveDemoState();
    renderCollaboratorsStack(currentListData);
    updateAssigneeDropdown(currentListData);
    inviteEmailInput.value = '';
    showToast(`已邀請 ${email} 加入此協作清單！`, "success");
    closeModal(shareModal);
    return;
  }

  try {
    await updateDoc(doc(db, 'lists', currentListId), {
      members: arrayUnion(email),
      memberProfiles: arrayUnion({
        email: email,
        displayName: email.split('@')[0],
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`
      })
    });

    inviteEmailInput.value = '';
    showToast(`已邀請 ${email} 加入此協作清單！`, "success");
    closeModal(shareModal);
  } catch (error) {
    showToast(`邀請失敗: ${error.message}`, "error");
  }
});

// Join List by Code Form
joinListForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const listId = joinListIdInput.value.trim();
  if (!listId || !currentUser) return;

  if (isDemoMode) {
    showToast(`展示模式：已加入清單 ${listId}！`, "success");
    joinListForm.reset();
    closeModal(joinListModal);
    return;
  }

  try {
    const listRef = doc(db, 'lists', listId);
    const snap = await getDoc(listRef);

    if (!snap.exists()) {
      showToast("找不到對應的清單，請確認代碼是否正確", "error");
      return;
    }

    const listData = snap.data();
    if (listData.members && listData.members.includes(currentUser.email)) {
      showToast("您已經在此清單的協作名單中了", "info");
      switchActiveList(listId);
      closeModal(joinListModal);
      return;
    }

    await updateDoc(listRef, {
      members: arrayUnion(currentUser.email),
      memberProfiles: arrayUnion({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        photoURL: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email)}`
      })
    });

    joinListForm.reset();
    closeModal(joinListModal);
    currentListId = listId;
    showToast(`成功加入協作清單「${listData.name}」！`, "success");
  } catch (error) {
    showToast(`加入失敗: ${error.message}`, "error");
  }
});

// Filters and Search Event Listeners
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active', 'bg-white', 'text-indigo-600', 'shadow-sm'));
    btn.classList.add('active', 'bg-white', 'text-indigo-600', 'shadow-sm');
    activeFilter = btn.getAttribute('data-filter');
    renderTodosList();
  });
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTodosList();
});

// Config Modal Handlers
openConfigBtn.addEventListener('click', () => openModal(configModal));
bannerConfigBtn.addEventListener('click', () => openModal(configModal));
createListModalBtn.addEventListener('click', () => openModal(createListModal));
joinListModalBtn.addEventListener('click', () => openModal(joinListModal));

configForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const apiKey = configApiKeyInput.value.trim();
  const authDomain = configAuthDomainInput.value.trim();

  if (!apiKey) {
    showToast("請輸入 Web API Key", "error");
    return;
  }

  const customConfig = {
    apiKey,
    authDomain: authDomain || "my-to-do-list-eca14.firebaseapp.com",
    projectId: "my-to-do-list-eca14",
    storageBucket: "my-to-do-list-eca14.appspot.com"
  };

  localStorage.setItem("my_todo_firebase_config", JSON.stringify(customConfig));
  localStorage.removeItem("my_todo_mode");
  showToast("Firebase 設定已儲存，正在切換至正式連線...", "success");
  setTimeout(() => window.location.reload(), 800);
});

configResetBtn.addEventListener('click', () => {
  if (confirm("確定要重設為預設配置嗎？")) {
    localStorage.removeItem("my_todo_firebase_config");
    localStorage.removeItem("my_todo_mode");
    window.location.reload();
  }
});

// Auth Button Event Handlers
googleLoginBtn.addEventListener('click', handleGoogleLogin);
welcomeLoginBtn.addEventListener('click', handleGoogleLogin);
welcomeDemoBtn.addEventListener('click', startDemoMode);
bannerDemoBtn.addEventListener('click', startDemoMode);
logoutBtn.addEventListener('click', handleLogout);

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================
// 🎭 DEMO MODE IMPLEMENTATION
// ==========================================
function startDemoMode() {
  isDemoMode = true;
  localStorage.setItem("my_todo_mode", "demo");

  currentUser = {
    uid: "demo-user-rick",
    displayName: "Rick (體驗者)",
    email: "rick.dev@gmail.com",
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
  };

  updateUserUI(currentUser);
  demoModeBadge.classList.remove('hidden');
  demoModeBadge.classList.add('inline-flex');
  welcomeView.classList.add('hidden');
  appWorkspace.classList.remove('hidden');
  authLoading.classList.add('hidden');

  loadDemoLists();
  showToast("已進入展示體驗模式！支援完整多人任務管理與音效。", "success");
  if (window.lucide) window.lucide.createIcons();
}

function loadDemoLists() {
  const saved = localStorage.getItem("my_todo_demo_data");
  if (saved) {
    const data = JSON.parse(saved);
    userLists = data.lists || [];
    window._demoTodosStore = data.todosStore || {};
  } else {
    // Pre-seed high quality collaborative boards
    userLists = [
      {
        id: "demo-sprint-list",
        name: "🔥 2026 產品衝刺專案 (多人協作)",
        description: "專案 Sprint 多人任務看板：包含架構設計、Google 登入整合與即時同步測試。",
        color: "#4f46e5",
        ownerId: currentUser.uid,
        ownerEmail: currentUser.email,
        ownerName: currentUser.displayName,
        members: [currentUser.email, "alice.engineer@gmail.com", "bob.ui@gmail.com"],
        memberProfiles: [
          { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
          { uid: "demo-alice", email: "alice.engineer@gmail.com", displayName: "Alice (工程師)", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" },
          { uid: "demo-bob", email: "bob.ui@gmail.com", displayName: "Bob (設計師)", photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80" }
        ]
      },
      {
        id: "demo-daily-list",
        name: "🛒 團隊日常採買與行政清單",
        description: "辦公室生活用品採購與日常庶務追蹤。",
        color: "#059669",
        ownerId: "demo-alice",
        ownerEmail: "alice.engineer@gmail.com",
        ownerName: "Alice (工程師)",
        members: [currentUser.email, "alice.engineer@gmail.com"],
        memberProfiles: [
          { uid: "demo-alice", email: "alice.engineer@gmail.com", displayName: "Alice (工程師)", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" },
          { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName, photoURL: currentUser.photoURL }
        ]
      }
    ];

    window._demoTodosStore = {
      "demo-sprint-list": [
        {
          id: "t-1",
          text: "完成 Firebase 專案與 Cloud Firestore 即時架構建置",
          completed: true,
          priority: "high",
          assignedTo: currentUser.email,
          dueDate: "2026-11-09",
          createdBy: { displayName: "Rick (體驗者)", email: currentUser.email }
        },
        {
          id: "t-2",
          text: "整合 Google 帳號一鍵登入與使用者頭像同步",
          completed: false,
          priority: "high",
          assignedTo: "alice.engineer@gmail.com",
          dueDate: "2026-11-10",
          createdBy: { displayName: "Alice (工程師)", email: "alice.engineer@gmail.com" }
        },
        {
          id: "t-3",
          text: "團隊任務指派下拉選單與完成微音效測試",
          completed: false,
          priority: "medium",
          assignedTo: "bob.ui@gmail.com",
          dueDate: "2026-11-12",
          createdBy: { displayName: "Bob (設計師)", email: "bob.ui@gmail.com" }
        },
        {
          id: "t-4",
          text: "準備下週跨團隊展示發表會議簡報",
          completed: false,
          priority: "low",
          assignedTo: currentUser.email,
          dueDate: "2026-11-15",
          createdBy: { displayName: "Rick (體驗者)", email: currentUser.email }
        }
      ],
      "demo-daily-list": [
        {
          id: "t-5",
          text: "採買研發部門深焙咖啡豆與茶包",
          completed: false,
          priority: "medium",
          assignedTo: currentUser.email,
          dueDate: "2026-11-10",
          createdBy: { displayName: "Alice (工程師)", email: "alice.engineer@gmail.com" }
        },
        {
          id: "t-6",
          text: "補充會議室白板筆與人體工學滑鼠墊",
          completed: true,
          priority: "low",
          assignedTo: "alice.engineer@gmail.com",
          dueDate: "2026-11-08",
          createdBy: { displayName: "Alice (工程師)", email: "alice.engineer@gmail.com" }
        }
      ]
    };
    saveDemoState();
  }

  renderListsSidebar();
  if (userLists.length > 0) {
    switchActiveList(userLists[0].id);
  }
}

function loadDemoTodos(listId) {
  if (!window._demoTodosStore) window._demoTodosStore = {};
  todos = window._demoTodosStore[listId] || [];
  updateTodosProgress();
  renderTodosList();
}

function saveDemoState() {
  if (!isDemoMode) return;
  if (currentListId) {
    if (!window._demoTodosStore) window._demoTodosStore = {};
    window._demoTodosStore[currentListId] = todos;
  }
  localStorage.setItem("my_todo_demo_data", JSON.stringify({
    lists: userLists,
    todosStore: window._demoTodosStore
  }));
}

demoModeBadge.addEventListener('click', () => {
  if (confirm("要切換回 Firebase (my-to-do-list-eca14) 正式連線與 Google 登入嗎？")) {
    localStorage.removeItem("my_todo_mode");
    window.location.reload();
  }
});
demoModeBadge.style.cursor = "pointer";
demoModeBadge.title = "點擊切換回 Firebase 正式連線";

// Fallback safety timeout: 避免任何網路延遲卡在「檢查登入狀態」
setTimeout(() => {
  if (authLoading && !authLoading.classList.contains('hidden') && !currentUser && !isDemoMode) {
    authLoading.classList.add('hidden');
    if (googleLoginBtn) googleLoginBtn.classList.remove('hidden');
    if (welcomeView) welcomeView.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}, 2500);

// Start Application
initializeAppLogic();

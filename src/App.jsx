import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Settings, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Cloud, 
  CloudOff, 
  Search, 
  Info, 
  Lock, 
  Unlock,
  RotateCw,
  AlertTriangle,
  Phone,
  MessageSquare,
  Send
} from 'lucide-react';

// ==========================================
// ⚠️ КОНФІГУРАЦІЯ ГЛОБАЛЬНОЇ БАЗИ ДАНИХ (ДЛЯ КЛІЄНТІВ)
// ==========================================
// 1. Опублікуйте файл "meat_store_db.json" на вашому Google Drive
//    (Права кнопка миші -> Поділитися -> Усі, хто мають посилання, можуть переглядати)
// 2. Скопіюйте ID файлу з посилання та вставте його сюди нижче:
const PUBLIC_FILE_ID = "1eOdZO_TsQAS_LrAfVcEatNgST_5VNsm5"; 

// Секретний пароль для доступу до адмінки на сайті
const ADMIN_PASSWORD = "1234"; 

// Початкові демонстраційні дані товарів (використовуються як резервна копія)
const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Ковбаса "Домашня" запечена',
    category: 'sausages',
    price: 380,
    unit: 'кг',
    description: 'Традиційна українська домашня ковбаса зі свіжої свинини зі спеціями та часником, запечена в печі за старовинним рецептом.',
    image: 'https://images.unsplash.com/photo-1541048611025-45d00ca5cca6?auto=format&fit=crop&q=80&w=600',
    available: true,
    weightStep: 0.1,
    minWeight: 0.3
  },
  {
    id: 'p2',
    name: 'Балик свинячий "Панський" копчений',
    category: 'delicacies',
    price: 490,
    unit: 'кг',
    description: 'Ніжний свинячий балик гарячого копчення на вільховій трісці з вишуканим натуральним ароматом.',
    image: 'https://images.unsplash.com/photo-1608223652353-2679fa430ee2?auto=format&fit=crop&q=80&w=600',
    available: true,
    weightStep: 0.1,
    minWeight: 0.2
  },
  {
    id: 'p3',
    name: 'Стейк "Рібай" вологого визрівання',
    category: 'fresh_meat',
    price: 650,
    unit: 'кг',
    description: 'Преміальна яловичина високого ступеня мармуровості, витримана у спеціальній камері для соковитості.',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=600',
    available: true,
    weightStep: 0.1,
    minWeight: 0.4
  },
  {
    id: 'p4',
    name: 'Шашлик зі свинячого ошийка в маринаді',
    category: 'semi_finished',
    price: 295,
    unit: 'кг',
    description: 'Добірний ошийок у фірмовому маринаді з цибулею, свіжою зеленню та авторськими прянощами.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
    available: true,
    weightStep: 0.5,
    minWeight: 1.0
  }
];

export default function App() {
  // --- СТАН БЕЗПЕКИ ТА ДОСТУПУ ---
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('meat_store_is_admin') === 'true';
  });
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // --- СТАН ОФОРМЛЕНОГО ЗАМОВЛЕННЯ ДЛЯ ПОКАЗУ КЛІЄНТУ ---
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // --- СТАН ДАНИХ МАГАЗИНУ ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('meat_store_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('meat_store_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Локальні налаштування текстів та КОНТАКТІВ на головній сторінці
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('meat_store_settings');
    return saved ? JSON.parse(saved) : {
      title: 'М\'ЯСНИЙ КРАФТ',
      subtitle: 'Традиційні м\'ясні вироби за рецептами визвольного руху',
      bannerBadge: 'АРМІЙСЬКИЙ СТАНДАРТ',
      bannerTitle: 'СПРАВЖНЄ М\'ЯСО З ДИМКОМ ТА ВОЛЕЮ В СЕРЦІ',
      bannerDesc: 'Замовляйте свіжі делікатеси, натуральні ковбаси та соковите мариноване м\'ясо до вашого столу. Усі замовлення збираються вручну та з любов\'ю.',
      advantage1: 'ЕКОЛОГІЧНО ЧИСТА СИРОВИНА',
      advantage2: 'ВЛАСНЕ КОПТИЛЬНЕ ВИРОБНИЦТВО НА ДРОВАХ',
      contactPhone: '+380671234567',
      contactTelegram: 'vash_username',
      contactWhatsapp: '380671234567' 
    };
  });

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop'); 
  const [adminSubTab, setAdminSubTab] = useState('products'); 
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  
  // Джерело бази даних для відображення статусу
  const [dbSource, setDbSource] = useState('local'); // 'local' | 'gdrive'
  const [showContactMenu, setShowContactMenu] = useState(false);

  // --- СТАН GOOGLE DRIVE ІНТЕГРАЦІЇ ---
  const [gdriveConfig, setGdriveConfig] = useState(() => {
    const saved = localStorage.getItem('meat_store_gdrive_config');
    return saved ? JSON.parse(saved) : {
      clientId: '',
      accessToken: '',
      fileId: '',
      isConnected: false,
      lastSync: null
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Form states
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'sausages',
    price: '',
    unit: 'кг',
    description: '',
    image: '',
    available: true,
    weightStep: 0.1,
    minWeight: 0.2
  });

  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'pickup',
    paymentType: 'cash',
    comment: ''
  });

  // --- СИНХРОНІЗАЦІЯ З ЛОКАЛЬНИМ СХОВИЩЕМ ---
  useEffect(() => {
    localStorage.setItem('meat_store_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('meat_store_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('meat_store_gdrive_config', JSON.stringify(gdriveConfig));
  }, [gdriveConfig]);

  useEffect(() => {
    localStorage.setItem('meat_store_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  // --- МЕТОД: ЗАВАНТАЖЕННЯ ДАНИХ З ПУБЛІЧНОГО GOOGLE DRIVE ДЛЯ ЗВИЧАЙНИХ КОРИСТУВАЧІВ ---
  const fetchPublicDatabase = async () => {
    const cleanId = PUBLIC_FILE_ID.trim();
    if (!cleanId || cleanId === '1aBcDeFgHiJkLmNoPqRsTuVwXyZ' || cleanId === '') return;
    
    // Різні варіанти посилань Google Drive для прямого завантаження вмісту файлу
    const driveUrls = [
      `https://docs.google.com/uc?export=download&id=${cleanId}`,
      `https://drive.usercontent.com/download?id=${cleanId}&export=download`,
      `https://drive.google.com/uc?export=download&id=${cleanId}`
    ];
    
    // Каскадний список CORS-проксі включаючи надзвичайно стабільний проксі Google (Google OpenSocial)
    const proxies = [
      (url) => `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=300&url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}&_cb=${Date.now()}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}&_cb=${Date.now()}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&_cb=${Date.now()}`
    ];

    let loadedSuccessfully = false;
    let fileIsPrivate = false;

    // Спершу спробуємо прямий запит (на випадок, якщо CORS відключено розширенням або в додатку)
    for (const baseUrl of driveUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(baseUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          const trimmed = text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            const data = JSON.parse(trimmed);
            if (data.products && data.products.length > 0) {
              setProducts(data.products);
              if (data.siteSettings) setSiteSettings(data.siteSettings);
              if (data.orders) setOrders(data.orders);
              console.log("Успішний прямий імпорт бази даних без використання проксі!");
              loadedSuccessfully = true;
              setDbSource('gdrive');
              break;
            }
          }
        }
      } catch (e) {
        console.log("Прямий запит відхилено політикою CORS. Переходимо до проксі-каскаду.");
      }
    }

    // Якщо прямий запит не вдався (CORS), починаємо обхід проксі-серверів
    if (!loadedSuccessfully) {
      for (const getProxyUrl of proxies) {
        for (const baseUrl of driveUrls) {
          try {
            const targetUrl = getProxyUrl(baseUrl);
            console.log(`Запит через каскадний проксі: ${targetUrl}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const text = await response.text();
              const trimmed = text.trim();
              
              let data = null;

              // Спробуємо розпарсити як прямий JSON
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                  data = JSON.parse(trimmed);
                } catch (jsonErr) {
                  console.warn("Помилка парсингу прямого JSON:", jsonErr);
                }
              } 
              
              // Якщо AllOrigins повернув загорнутий JSON
              if (!data) {
                try {
                  const wrapped = JSON.parse(trimmed);
                  if (wrapped && wrapped.contents) {
                    const innerTrimmed = wrapped.contents.trim();
                    if (innerTrimmed.startsWith('{') || innerTrimmed.startsWith('[')) {
                      data = JSON.parse(innerTrimmed);
                    } else if (innerTrimmed.includes('<!DOCTYPE') || innerTrimmed.includes('<html') || innerTrimmed.includes('ServiceLogin') || innerTrimmed.includes('sign-in')) {
                      fileIsPrivate = true;
                    }
                  }
                } catch (e) {
                  // Формат відповіді не AllOrigins
                }
              }

              // Перевіримо на наявність сторінки авторизації Google Drive
              if (!data && (trimmed.includes('<!DOCTYPE') || trimmed.includes('<html') || trimmed.includes('ServiceLogin') || trimmed.includes('sign-in') || trimmed.includes('google-signin'))) {
                fileIsPrivate = true;
              }

              // Якщо дані успішно завантажено
              if (data && data.products && data.products.length > 0) {
                setProducts(data.products);
                if (data.siteSettings) {
                  setSiteSettings(data.siteSettings);
                }
                if (data.orders) {
                  setOrders(data.orders);
                }
                
                console.log("Базу даних магазину успішно імпортовано через проксі-сервер!");
                loadedSuccessfully = true;
                setDbSource('gdrive');
                break; 
              }
            }
          } catch (e) {
            console.warn(`Невдалий запит через поточний проксі-вузол:`, e.message);
          }
        }
        if (loadedSuccessfully) break;
      }
    }

    if (!loadedSuccessfully) {
      console.error("Не вдалося завантажити базу з Google Drive через жоден доступний проксі.");
      setDbSource('local');
      if (fileIsPrivate) {
        showToast("Базу знайдено, але доступ обмежено. Будь ласка, відкрийте публічний доступ на Google Диску!", "error");
      } else {
        showToast("Працюємо на резервній локальній копії (Google Drive недоступний).", "info");
      }
    }
  };

  // --- ЕФЕКТ 1: ЗАПУСК ЗАВАНТАЖЕННЯ ПРИ СТАРТІ ---
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPublicDatabase();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // --- ЕФЕКТ 2: ЗАВАНТАЖЕННЯ GOOGLE IDENTITY SDK ДЛЯ АВТОРИЗАЦІЇ АДМІНІСТРАТОРА ---
  useEffect(() => {
    if (isAdmin) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [isAdmin]);

  // Покажчик повідомлень (Toast)
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Авторизація адміна на сайті
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('meat_store_is_admin', 'true');
      setShowLoginModal(false);
      setPasswordInput('');
      setLoginError(false);
      showToast('Доступ адміністратора успішно активовано!', 'success');
      
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    } else {
      setLoginError(true);
      setPasswordInput('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsEditorMode(false);
    localStorage.removeItem('meat_store_is_admin');
    setActiveTab('shop');
    showToast('Вихід з режиму адміністратора виконано.', 'info');
  };

  // Логіка автентифікації в Google Drive API
  const handleGoogleLogin = () => {
    if (!gdriveConfig.clientId) {
      showToast('Вкажіть ваш Google Client ID в налаштуваннях!', 'error');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: gdriveConfig.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response) => {
          if (response.error) {
            showToast(`Помилка Google: ${response.error}`, 'error');
            return;
          }
          
          const newConfig = {
            ...gdriveConfig,
            accessToken: response.access_token,
            isConnected: true
          };
          setGdriveConfig(newConfig);
          showToast('Підключено до Google акаунту!', 'success');
          
          syncWithGoogleDrive(response.access_token, newConfig);
        },
      });
      client.requestAccessToken();
    } catch (err) {
      showToast(`Помилка ініціалізації клієнта Google: ${err.message}`, 'error');
    }
  };

  // Логіка оновлення бази даних у Google Drive
  const syncWithGoogleDrive = async (passedToken = null, passedConfig = null) => {
    const token = passedToken || gdriveConfig.accessToken;
    const currentConfig = passedConfig || gdriveConfig;

    if (!token) {
      showToast('Спершу авторизуйтеся в Google Drive', 'error');
      return;
    }

    setIsSyncing(true);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      let fileId = currentConfig.fileId;

      if (!fileId) {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='meat_store_db.json' and trashed=false&fields=files(id, name)`;
        const searchRes = await fetch(searchUrl, { headers });
        const searchData = await searchRes.json();

        if (searchData.files && searchData.files.length > 0) {
          fileId = searchData.files[0].id;
        }
      }

      const dbPayload = {
        products: products,
        orders: orders,
        siteSettings: siteSettings,
        lastUpdated: new Date().toISOString()
      };

      if (fileId) {
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        const updateRes = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dbPayload)
        });

        if (updateRes.ok) {
          showToast('Базу даних успішно оновлено на Google Диску!', 'success');
        } else {
          throw new Error('Помилка оновлення файлу');
        }
      } else {
        const metadata = {
          name: 'meat_store_db.json',
          mimeType: 'application/json'
        };

        const boundary = 'foo_bar_baz_meat';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartBody = 
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(dbPayload) +
          closeDelimiter;

        const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartBody
        });

        if (createRes.ok) {
          const createdFile = await createRes.json();
          fileId = createdFile.id;
          showToast('На вашому Google Диску успішно створено файл "meat_store_db.json"!', 'success');
        } else {
          const errData = await createRes.json();
          throw new Error(errData.error?.message || 'Помилка створення файлу');
        }
      }

      setGdriveConfig(prev => ({
        ...prev,
        fileId,
        lastSync: new Date().toLocaleString()
      }));

    } catch (err) {
      showToast(`Помилка синхронізації: ${err.message}`, 'error');
      setGdriveConfig(prev => ({ ...prev, isConnected: false }));
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGdrive = () => {
    setGdriveConfig(prev => ({
      ...prev,
      accessToken: '',
      isConnected: false,
      lastSync: null
    }));
    showToast('Локальний зв\'язок з Google Drive розірвано.', 'info');
  };

  // Редагування текстів прямо на екрані (Інлайн редагування)
  const handleTextChange = (key, newValue) => {
    setSiteSettings(prev => ({
      ...prev,
      [key]: newValue
    }));
  };

  // Збереження товарів з панелі керування
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showToast('Заповніть назву та ціну товару!', 'error');
      return;
    }

    const priceNum = parseFloat(productForm.price);
    const stepNum = parseFloat(productForm.weightStep);
    const minNum = parseFloat(productForm.minWeight);

    const productData = {
      id: editingProduct ? editingProduct.id : 'p_' + Date.now(),
      name: productForm.name,
      category: productForm.category,
      price: isNaN(priceNum) ? 0 : priceNum,
      unit: productForm.unit,
      description: productForm.description,
      image: productForm.image || 'https://images.unsplash.com/photo-1602491453979-53a99888ecf1?auto=format&fit=crop&q=80&w=600',
      available: productForm.available,
      weightStep: isNaN(stepNum) ? 0.1 : stepNum,
      minWeight: isNaN(minNum) ? 0.2 : minNum
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? productData : p));
      showToast('Товар успішно оновлено!');
    } else {
      setProducts([...products, productData]);
      showToast('Новий товар успішно додано до каталогу!');
    }

    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'sausages',
      price: '',
      unit: 'кг',
      description: '',
      image: '',
      available: true,
      weightStep: 0.1,
      minWeight: 0.2
    });

    if (gdriveConfig.isConnected) {
      setTimeout(() => syncWithGoogleDrive(), 500);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      unit: product.unit,
      description: product.description || '',
      image: product.image || '',
      available: product.available,
      weightStep: product.weightStep || 0.1,
      minWeight: product.minWeight || 0.2
    });
  };

  const handleDeleteProduct = (productId) => {
    if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
      setProducts(products.filter(p => p.id !== productId));
      showToast('Товар видалено.', 'info');
      
      if (gdriveConfig.isConnected) {
        setTimeout(() => syncWithGoogleDrive(), 500);
      }
    }
  };

  // Робота з кошиком покупця
  const addToCart = (product, quantity = null) => {
    const qty = quantity || product.minWeight || 1;
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: parseFloat((item.quantity + qty).toFixed(2)) }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
    showToast(`"${product.name}" додано до кошика!`);
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      showToast('Товар видалено з кошика', 'info');
      return;
    }
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: parseFloat(newQty.toFixed(2)) } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    showToast('Товар видалено з кошика', 'info');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Надсилання нового замовлення
  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Ваш кошик порожній!', 'error');
      return;
    }
    if (!checkoutForm.name || !checkoutForm.phone) {
      showToast('Заповніть обов\'язкові поля: Ім\'я та Телефон!', 'error');
      return;
    }

    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString('uk-UA'),
      customer: { ...checkoutForm },
      items: [...cart],
      total: getCartTotal(),
      status: 'new'
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    
    // Створюємо стан успішного замовлення для показу модалки з кнопками месенджерів
    setLastPlacedOrder(newOrder);
    
    setCart([]);
    showToast(`Замовлення ${newOrder.id} успішно створено!`, 'success');
    
    setActiveTab('shop');
    
    setCheckoutForm({
      name: '',
      phone: '',
      address: '',
      deliveryType: 'pickup',
      paymentType: 'cash',
      comment: ''
    });

    if (gdriveConfig.isConnected) {
      setTimeout(() => {
        setIsSyncing(true);
        const headers = {
          'Authorization': `Bearer ${gdriveConfig.accessToken}`,
          'Content-Type': 'application/json'
        };
        const dbPayload = {
          products: products,
          orders: updatedOrders,
          siteSettings: siteSettings,
          lastUpdated: new Date().toISOString()
        };
        fetch(`https://www.googleapis.com/upload/drive/v3/files/${gdriveConfig.fileId}?uploadType=media`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(dbPayload)
        }).then(() => {
          setIsSyncing(false);
          setGdriveConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
        }).catch(() => setIsSyncing(false));
      }, 500);
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord);
    setOrders(updated);
    showToast(`Статус замовлення ${orderId} успішно змінено!`);

    if (gdriveConfig.isConnected) {
      setTimeout(() => {
        setIsSyncing(true);
        const headers = { 'Authorization': `Bearer ${gdriveConfig.accessToken}`, 'Content-Type': 'application/json' };
        fetch(`https://www.googleapis.com/upload/drive/v3/files/${gdriveConfig.fileId}?uploadType=media`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ products, orders: updated, siteSettings, lastUpdated: new Date().toISOString() })
        }).then(() => {
          setIsSyncing(false);
          setGdriveConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
        }).catch(() => setIsSyncing(false));
      }, 500);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // --- ДОПОМІЖНИЙ МЕТОД: ГЕНЕРАЦІЯ ШАБЛОНУ ТЕКСТУ ЗАМОВЛЕННЯ ДЛЯ МЕСЕНДЖЕРІВ ---
  const generateOrderMessage = (order) => {
    if (!order) return "";
    let itemsText = order.items.map((item, idx) => 
      `${idx + 1}. ${item.name} (${item.quantity} ${item.unit} x ${item.price} грн) = ${parseFloat((item.quantity * item.price).toFixed(2))} грн`
    ).join('\n');

    return `*Нове замовлення ${order.id}* від ${order.date}\n\n` +
           `👤 *Покупець:* ${order.customer.name}\n` +
           `📞 *Телефон:* ${order.customer.phone}\n` +
           `🚚 *Доставка:* ${order.customer.deliveryType === 'pickup' ? 'Самовивіз' : 'Адресна доставка (' + order.customer.address + ')'}\n` +
           `💳 *Оплата:* ${order.customer.paymentType === 'cash' ? 'Готівка' : 'Термінал'}\n` +
           `💬 *Коментар:* ${order.customer.comment}\n\n` +
           `*Замовлені делікатеси:*\n${itemsText}\n\n` +
           `💰 *Загальна сума до сплати:* *${order.total.toFixed(2)} грн*`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased pb-20 selection:bg-red-800 selection:text-white">
      
      {/* Тост-сповіщення */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 flex items-center gap-3 border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-800 text-red-200' :
          toast.type === 'info' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' :
          'bg-zinc-900/90 border-amber-500/30 text-amber-200'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-amber-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* ⚠️ ВЕРХНЯ ХМАРНА ПАНЕЛЬ АДМІНА */}
      {isAdmin && (
        <div className="bg-zinc-900 border-b border-zinc-800 py-2.5 px-4 text-xs font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-zinc-200 tracking-wider">ПАНЕЛЬ АДМІНІСТРАТОРА</span>
              <span>|</span>
              <span className="text-zinc-500">База на Gmail:</span>
              <span className={gdriveConfig.isConnected ? 'text-emerald-400' : 'text-amber-500'}>
                {gdriveConfig.isConnected ? 'СИНХРОНІЗОВАНО З GOOGLE ДИСКОМ' : 'ЛОКАЛЬНИЙ РЕЖИМ (LocalStorage)'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Перемикач режиму редактора */}
              <button 
                onClick={() => setIsEditorMode(!isEditorMode)}
                className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  isEditorMode 
                    ? 'bg-amber-500 text-zinc-950 shadow-md' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Режим редактора {isEditorMode ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}
              </button>

              {/* Кнопка швидкої синхронізації */}
              {gdriveConfig.isConnected && (
                <button
                  onClick={() => syncWithGoogleDrive()}
                  disabled={isSyncing}
                  className="bg-zinc-850 hover:bg-zinc-855 border border-zinc-700 text-zinc-300 px-3 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Синхронізувати
                </button>
              )}

              <button 
                onClick={handleAdminLogout}
                className="text-red-400 hover:text-red-300 font-bold"
              >
                [ Вийти з адмінки ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ШАПКА МАГАЗИНУ */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Логотип */}
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('shop')}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950/30">
                {isEditorMode ? (
                  <input
                    type="text"
                    maxLength={1}
                    value="М"
                    disabled
                    className="w-full text-center bg-transparent font-serif text-2xl font-black focus:outline-none cursor-pointer"
                  />
                ) : (
                  <span className="font-serif text-2xl font-black">М</span>
                )}
              </div>
              <div>
                {isEditorMode ? (
                  <input
                    type="text"
                    value={siteSettings.title}
                    onChange={(e) => handleTextChange('title', e.target.value)}
                    className="bg-zinc-900 text-white font-bold tracking-tight text-lg font-serif border border-dashed border-amber-500/50 rounded px-1 focus:outline-none"
                  />
                ) : (
                  <h1 className="text-lg font-bold tracking-tight text-zinc-100 font-serif">{siteSettings.title}</h1>
                )}

                {isEditorMode ? (
                  <input
                    type="text"
                    value={siteSettings.subtitle}
                    onChange={(e) => handleTextChange('subtitle', e.target.value)}
                    className="bg-zinc-900 text-amber-500/90 text-xs font-medium border border-dashed border-amber-500/50 rounded px-1 mt-1 block focus:outline-none w-full"
                  />
                ) : (
                  <p className="text-xs text-amber-500/90 font-medium tracking-wide">{siteSettings.subtitle}</p>
                )}

                {/* Елегантний індикатор статусу підключення бази */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dbSource === 'gdrive' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                    База: {dbSource === 'gdrive' ? 'Хмара' : 'Локальна'}
                  </span>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        showToast("Оновлення бази даних з Google Drive...", "info");
                        fetchPublicDatabase();
                      }}
                      className="p-0.5 text-zinc-650 hover:text-zinc-300 transition-all rounded hover:bg-zinc-900 animate-spin"
                      title="Примусово оновити базу даних з хмари"
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Навігація */}
            <nav className="hidden md:flex items-center gap-1.5 bg-zinc-900/50 p-1 rounded-xl border border-zinc-900">
              <button 
                onClick={() => setActiveTab('shop')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all tracking-wider ${activeTab === 'shop' ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                Вітрина
              </button>
              <button 
                onClick={() => setActiveTab('cart')}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all tracking-wider flex items-center gap-2 ${activeTab === 'cart' ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                Кошик замовлення
                {cart.length > 0 && (
                  <span className="bg-white text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
              {/* Посилання на адмінку видно ТІЛЬКИ авторизованому адміну */}
              {isAdmin && (
                <button 
                  onClick={() => { setActiveTab('admin'); setAdminSubTab('products'); }}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all tracking-wider flex items-center gap-2 ${activeTab === 'admin' ? 'bg-zinc-800 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-white'}`}
                >
                  Керування
                </button>
              )}
            </nav>

            {/* Мобільна кнопка кошика */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('cart')}
                className="relative p-3 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl transition-all md:hidden border border-zinc-800"
              >
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[9px] w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Мобільне меню навігації на екрані */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 px-4 py-3 flex justify-around items-center shadow-2xl">
        <button 
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 ${activeTab === 'shop' ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider">Вітрина</span>
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 relative ${activeTab === 'cart' ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute top-1.5 right-3 bg-red-600 text-white font-bold text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full">
              {cart.length}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider">Кошик</span>
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 ${activeTab === 'admin' ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">Адмін</span>
          </button>
        )}
      </div>

      {/* ГОЛОВНИЙ ВЕБ-КОНТЕНТ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ВКЛАДКА 1: ВІТРИНА МАГАЗИНУ */}
        {activeTab === 'shop' && (
          <div>
            {/* РЕКЛАМНИЙ БАНЕР */}
            <div className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 border border-zinc-900 p-8 sm:p-12 flex flex-col justify-center min-h-[280px] shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.12),transparent_40%)]" />
              <div className="relative z-10 max-w-2xl">
                
                {isEditorMode ? (
                  <input
                    type="text"
                    value={siteSettings.bannerBadge}
                    onChange={(e) => handleTextChange('bannerBadge', e.target.value)}
                    className="bg-zinc-900 text-red-400 text-xs font-bold uppercase tracking-wider border border-dashed border-amber-500/50 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                ) : (
                  <span className="px-3.5 py-1.5 bg-red-950/60 border border-red-800/60 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    {siteSettings.bannerBadge}
                  </span>
                )}

                {isEditorMode ? (
                  <textarea
                    value={siteSettings.bannerTitle}
                    onChange={(e) => handleTextChange('bannerTitle', e.target.value)}
                    className="w-full bg-zinc-900 text-white text-3xl sm:text-4xl font-black mt-4 mb-3 font-serif border border-dashed border-amber-500/50 rounded p-2 focus:outline-none h-24 resize-none"
                  />
                ) : (
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-5 mb-3 font-serif leading-tight">
                    {siteSettings.bannerTitle}
                  </h2>
                )}

                {isEditorMode ? (
                  <textarea
                    value={siteSettings.bannerDesc}
                    onChange={(e) => handleTextChange('bannerDesc', e.target.value)}
                    className="w-full bg-zinc-900 text-zinc-400 text-sm border border-dashed border-amber-500/50 rounded p-2 focus:outline-none h-20 resize-none"
                  />
                ) : (
                  <p className="text-zinc-400 text-sm sm:text-base mb-6 leading-relaxed">
                    {siteSettings.bannerDesc}
                  </p>
                )}

                {/* Блок переваг бренду */}
                <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-zinc-800">
                    <span className="text-amber-500 font-bold">✓</span>
                    {isEditorMode ? (
                      <input
                        type="text"
                        value={siteSettings.advantage1}
                        onChange={(e) => handleTextChange('advantage1', e.target.value)}
                        className="bg-zinc-850 text-zinc-300 border border-dashed border-amber-500/50 rounded px-1 focus:outline-none"
                      />
                    ) : (
                      <span>{siteSettings.advantage1}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-zinc-800">
                    <span className="text-amber-500 font-bold">✓</span>
                    {isEditorMode ? (
                      <input
                        type="text"
                        value={siteSettings.advantage2}
                        onChange={(e) => handleTextChange('advantage2', e.target.value)}
                        className="bg-zinc-850 text-zinc-300 border border-dashed border-amber-500/50 rounded px-1 focus:outline-none"
                      />
                    ) : (
                      <span>{siteSettings.advantage2}</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* РЯДОК ПОШУКУ ТА КАТЕГОРІЙ */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-8">
              
              {/* Рядок пошуку */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="Шукати балик, ковбасу чи стейк..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-800 placeholder-zinc-500 transition-all"
                />
              </div>

              {/* Перемикання категорій */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {[
                  { id: 'all', name: 'Усе меню' },
                  { id: 'sausages', name: 'Ковбаси & Сосиски' },
                  { id: 'delicacies', name: 'Копченості & Балик' },
                  { id: 'fresh_meat', name: 'Свіже м’ясо' },
                  { id: 'semi_finished', name: 'Напівфабрикати' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat.id 
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md shadow-amber-500/10' 
                        : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* СПИСОК ТОВАРІВ НА ВІТРИНІ */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-900">
                <p className="text-zinc-500 text-lg mb-2">Нічого не знайдено за вашим запитом</p>
                <p className="text-zinc-600 text-xs">Спробуйте змінити фільтр чи ключові слова пошуку.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className="group bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col hover:scale-[1.01] shadow-xl hover:shadow-2xl"
                  >
                    {/* Картинка */}
                    <div className="relative h-56 overflow-hidden bg-zinc-950">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1602491453979-53a99888ecf1?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                      
                      <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider bg-zinc-950/95 text-amber-500 px-3 py-1.5 rounded-xl border border-zinc-850">
                        {product.category === 'sausages' && 'Ковбаси'}
                        {product.category === 'delicacies' && 'Делікатес'}
                        {product.category === 'fresh_meat' && 'Свіже м’ясо'}
                        {product.category === 'semi_finished' && 'Напівфабрикат'}
                      </span>

                      {!product.available && (
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-red-950 text-red-400 border border-red-800 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                            Тимчасово немає
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Опис товару */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100 group-hover:text-amber-500 transition-colors font-serif">
                          {product.name}
                        </h3>
                        <p className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                          {product.description || 'Неперевершений смак вишуканих м’ясних виробів для вашої родини.'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-850/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-zinc-500">Ціна за 1 {product.unit}</div>
                          <div className="text-2xl font-black text-white font-serif">
                            {product.price} <span className="text-sm font-sans font-normal text-zinc-400">грн</span>
                          </div>
                        </div>

                        {product.available && (
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold text-xs px-4.5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            В кошик
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА 2: КОШИК ТА ОФОРМЛЕННЯ ЗАМОВЛЕННЯ */}
        {activeTab === 'cart' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-serif mb-8 text-white">Ваш Кошик</h2>

            {cart.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-900">
                <ShoppingBag className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg mb-6">Ваш кошик порожній</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Перейти до каталогу
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Список товарів у кошику */}
                <div className="lg:col-span-7 space-y-4">
                  {cart.map(item => (
                    <div 
                      key={item.id}
                      className="bg-zinc-900 rounded-2xl p-4 border border-zinc-850 flex items-center gap-4 justify-between"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover bg-zinc-950" 
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-zinc-100 truncate font-serif">{item.name}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.price} грн / {item.unit}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - (item.weightStep || 0.1))}
                            className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="text-sm font-semibold text-white px-2">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + (item.weightStep || 0.1))}
                            className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="font-bold text-white font-serif">
                          {parseFloat((item.price * item.quantity).toFixed(2))} грн
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-zinc-800 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-850 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-zinc-400">Сума замовлення:</span>
                      <span className="text-3xl font-black font-serif text-amber-500">
                        {getCartTotal().toFixed(2)} грн
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      * Кінцева вага фасованих виробів може незначно коливатися у межах 50-100г. Менеджер узгодить фінальну вартість за телефоном.
                    </p>
                  </div>
                </div>

                {/* --- ФОРМА ОФОРМЛЕННЯ ЗАМОВЛЕННЯ --- */}
                <div className="lg:col-span-5 bg-zinc-900 rounded-3xl p-6 border border-zinc-850">
                  <h3 className="text-xl font-bold font-serif text-white mb-6">Оформлення замовлення</h3>
                  
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ваше Ім'я *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-700"
                        placeholder="Олександр Коваль"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Номер телефону *</label>
                      <input
                        type="tel"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-700"
                        placeholder="+380"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Спосіб отримання</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, deliveryType: 'pickup'})}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                            checkoutForm.deliveryType === 'pickup' 
                              ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                          }`}
                        >
                          Самовивіз
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, deliveryType: 'delivery'})}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                            checkoutForm.deliveryType === 'delivery' 
                              ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                          }`}
                        >
                          Доставка
                        </button>
                      </div>
                    </div>

                    {checkoutForm.deliveryType === 'delivery' && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Адреса доставки *</label>
                        <input
                          type="text"
                          required={checkoutForm.deliveryType === 'delivery'}
                          value={checkoutForm.address}
                          onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-700"
                          placeholder="Вулиця, будинок, квартира"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Спосіб оплати</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, paymentType: 'cash'})}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                            checkoutForm.paymentType === 'cash' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                          }`}
                        >
                          Готівка
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, paymentType: 'card_upon_receipt'})}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                            checkoutForm.paymentType === 'card_upon_receipt' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                          }`}
                        >
                          Термінал
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Коментар</label>
                      <textarea
                        value={checkoutForm.comment}
                        onChange={(e) => setCheckoutForm({...checkoutForm, comment: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-700 h-20 resize-none"
                        placeholder="Особливі побажання..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Надіслати замовлення
                    </button>
                  </form>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА 3: КЕРУВАННЯ (Доступна лише адміну) */}
        {activeTab === 'admin' && isAdmin && (
          <div>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 border-b border-zinc-900 pb-6">
              <div>
                <h2 className="text-3xl font-bold font-serif text-white">Панель керування</h2>
                <p className="text-xs text-zinc-400 mt-1">Оновлюйте асортимент та відстежуйте нові замовлення</p>
              </div>
              
              <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-850 w-full sm:w-auto">
                <button
                  onClick={() => setAdminSubTab('products')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    adminSubTab === 'products' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Товари
                </button>
                <button
                  onClick={() => setAdminSubTab('orders')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    adminSubTab === 'orders' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Замовлення
                  {orders.filter(o => o.status === 'new').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>
                <button
                  onClick={() => setAdminSubTab('gdrive')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    adminSubTab === 'gdrive' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Налаштування сайту & Google Drive
                </button>
              </div>
            </div>

            {/* Суб-вкладка: ТОВАРИ */}
            {adminSubTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* @Форма */}
                <div className="lg:col-span-5 bg-zinc-900 p-6 rounded-3xl border border-zinc-850 self-start">
                  <h3 className="text-lg font-bold font-serif mb-6 text-white flex items-center gap-2">
                    {editingProduct ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                    {editingProduct ? 'Редагувати товар' : 'Додати товар'}
                  </h3>

                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Назва товару *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="Наприклад: Балик свинячий"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Ціна (грн) *</label>
                        <input
                          type="number"
                          required
                          value={productForm.price}
                          onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                          placeholder="450"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Одиниця виміру</label>
                        <select
                          value={productForm.unit}
                          onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        >
                          <option value="кг">кг</option>
                          <option value="шт">шт</option>
                          <option value="уп">уп</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Мін. вага/порція</label>
                        <input
                          type="number"
                          step="0.05"
                          value={productForm.minWeight}
                          onChange={(e) => setProductForm({...productForm, minWeight: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Крок ваги (+/-)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={productForm.weightStep}
                          onChange={(e) => setProductForm({...productForm, weightStep: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Категорія</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      >
                        <option value="sausages">Ковбаси & Сосиски</option>
                        <option value="delicacies">Копченості & Балик</option>
                        <option value="fresh_meat">Свіже м’ясо</option>
                        <option value="semi_finished">Напівфабрикати</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Зображення (URL)</label>
                      <input
                        type="url"
                        value={productForm.image}
                        onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Опис виробу</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none h-20 resize-none"
                        placeholder="Опис смакових якостей..."
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="available"
                        checked={productForm.available}
                        onChange={(e) => setProductForm({...productForm, available: e.target.checked})}
                        className="rounded border-zinc-800 text-red-650 focus:ring-red-500 bg-zinc-950"
                      />
                      <label htmlFor="available" className="text-xs font-bold text-zinc-300 uppercase">Наявність на вітрині</label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setProductForm({
                              name: '', category: 'sausages', price: '', unit: 'кг',
                              description: '', image: '', available: true, weightStep: 0.1, minWeight: 0.2
                            });
                          }}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 py-2.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Скасувати
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md"
                      >
                        {editingProduct ? 'Зберегти зміни' : 'Опублікувати'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Таблиця товарів */}
                <div className="lg:col-span-7 bg-zinc-900 rounded-3xl border border-zinc-850 overflow-hidden">
                  <div className="p-6 border-b border-zinc-850">
                    <h3 className="font-bold text-lg font-serif">Товари на складі</h3>
                  </div>
                  <div className="divide-y divide-zinc-850 overflow-y-auto max-h-[600px]">
                    {products.map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-850/50 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-950" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-zinc-100 truncate">{p.name}</h4>
                            <p className="text-xs text-amber-500 font-bold">{p.price} грн / {p.unit}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-350 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 bg-zinc-800/40 hover:bg-red-950/50 rounded-lg text-zinc-500 hover:text-red-400 border border-zinc-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Суб-вкладка: ЗАМОВЛЕННЯ */}
            {adminSubTab === 'orders' && (
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-850">
                    <p className="text-zinc-400 text-sm">Нових замовлень наразі немає.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div 
                      key={order.id} 
                      className={`bg-zinc-900 border rounded-3xl p-6 transition-all ${
                        order.status === 'new' ? 'border-amber-500/30' : 'border-zinc-850'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-4 mb-4 font-mono">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-white">{order.id}</span>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              order.status === 'new' ? 'bg-amber-500/20 text-amber-400' :
                              order.status === 'completed' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {order.status === 'new' ? 'Нове' : order.status === 'completed' ? 'Виконано' : 'Скасовано'}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 block mt-1">{order.date}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block uppercase">Всього до сплати</span>
                          <span className="text-xl font-black text-amber-500 font-serif">{order.total.toFixed(2)} грн</span>
                        </div>
                      </div>

                      {/* Дані клієнта */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs mb-6 bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
                        <div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Отримувач</span>
                          <p className="font-bold text-zinc-200">{order.customer.name}</p>
                          <p className="text-zinc-400 font-mono mt-1">{order.customer.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Доставка</span>
                          <p className="font-bold text-zinc-200">
                            {order.customer.deliveryType === 'pickup' ? 'Самовивіз' : 'Адресна доставка'}
                          </p>
                          {order.customer.deliveryType === 'delivery' && (
                            <p className="text-zinc-400 mt-1">{order.customer.address}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Оплата</span>
                          <p className="font-bold text-zinc-200">
                            {order.customer.paymentType === 'cash' ? 'Готівка' : 'Карта при отриманні'}
                          </p>
                        </div>
                      </div>

                      {/* Перелік товарів */}
                      <div className="space-y-2 mb-6">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Деталі кошика</span>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-zinc-900 p-2.5 px-4 rounded-xl border border-zinc-850">
                            <span className="text-xs font-bold text-zinc-250 font-serif">{item.name}</span>
                            <span className="text-xs text-zinc-400 font-mono">
                              {item.quantity} {item.unit} × {item.price} грн = <b>{parseFloat((item.quantity * item.price).toFixed(2))} грн</b>
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer.comment && (
                        <div className="mb-6 p-3 bg-zinc-950 rounded-xl text-xs text-zinc-400 border-l-2 border-amber-500">
                          <b>Примітка покупця:</b> {order.customer.comment}
                        </div>
                      )}

                      {/* Екшн-кнопки */}
                      {order.status === 'new' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="flex-1 bg-emerald-850 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            Позначити як виконане
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'canceled')}
                            className="bg-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-red-400 px-5 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider border border-zinc-800"
                          >
                            Скасувати
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Суб-вкладка: НАЛАШТУВАННЯ САЙТУ ТА GOOGLE DRIVE */}
            {adminSubTab === 'gdrive' && (
              <div className="max-w-3xl mx-auto space-y-8">
                
                {/* КОНТАКТИ ТА ТЕКСТИ */}
                <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-850 shadow-xl">
                  <h3 className="text-xl font-bold font-serif text-white mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-amber-500" />
                    Налаштування контактів крамниці
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Номер телефону для дзвінків</label>
                      <input
                        type="text"
                        value={siteSettings.contactPhone}
                        onChange={(e) => handleTextChange('contactPhone', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="Наприклад: +380671234567"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Telegram Username (без символа @)</label>
                      <input
                        type="text"
                        value={siteSettings.contactTelegram}
                        onChange={(e) => handleTextChange('contactTelegram', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="Наприклад: meat_craft_manager"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Номер WhatsApp (лише цифри з кодом країни)</label>
                      <input
                        type="text"
                        value={siteSettings.contactWhatsapp}
                        onChange={(e) => handleTextChange('contactWhatsapp', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="Наприклад: 380671234567"
                      />
                    </div>

                    <button
                      onClick={() => {
                        showToast("Контакти успішно збережено локально! Не забудьте натиснути кнопку 'Синхронізувати з хмарою'.", "success");
                        if (gdriveConfig.isConnected) syncWithGoogleDrive();
                      }}
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                    >
                      Зберегти контакти
                    </button>
                  </div>
                </div>

                {/* НАЛАШТУВАННЯ GOOGLE DRIVE */}
                <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-850 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                      <Database className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-serif text-white">Google Drive Світлина</h3>
                      <p className="text-xs text-zinc-400">Зв'язок сайту з вашим Google акаунтом для безпечного збереження даних.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Google Client ID</label>
                        <input
                          type="text"
                          value={gdriveConfig.clientId}
                          onChange={(e) => setGdriveConfig({...gdriveConfig, clientId: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                          placeholder="Вставте ваш Client ID..."
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        {gdriveConfig.isConnected ? (
                          <>
                            <button
                              onClick={() => syncWithGoogleDrive()}
                              disabled={isSyncing}
                              className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                              <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                              {isSyncing ? 'Синхронізація...' : 'Завантажити/Оновити'}
                            </button>
                            <button
                              onClick={disconnectGdrive}
                              className="bg-zinc-800 hover:bg-zinc-750 text-red-450 font-bold py-3.5 px-6 rounded-xl text-xs transition-all border border-zinc-750"
                            >
                              Відключити
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleGoogleLogin}
                            className="flex-1 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Cloud className="w-4 h-4" />
                            Підключити диск Google
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-850 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Статус зв'язку:</span>
                        <span className={`font-bold ${gdriveConfig.isConnected ? 'text-emerald-400' : 'text-amber-500'}`}>
                          {gdriveConfig.isConnected ? 'ПІДКЛЮЧЕНО' : 'АВТОНОМНИЙ'}
                        </span>
                      </div>
                      {gdriveConfig.fileId && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ID вашого файлу в хмарі:</span>
                          <span className="text-zinc-300 font-mono select-all">{gdriveConfig.fileId}</span>
                        </div>
                      )}
                      {gdriveConfig.lastSync && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Остання синхронізація:</span>
                          <span className="text-zinc-300">{gdriveConfig.lastSync}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* 🟢 ПЛАВАЮЧА КНОПКА ЗВ'ЯЗКУ (Floating Widget) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans">
        {showContactMenu && (
          <div className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-2xl animate-fade-in text-xs font-bold w-48">
            <a 
              href={`tel:${siteSettings.contactPhone}`}
              className="flex items-center gap-2.5 p-2 hover:bg-zinc-800 rounded-lg text-zinc-100 transition-all border-b border-zinc-850 pb-2"
            >
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Зателефонувати</span>
            </a>
            <a 
              href={`https://t.me/${siteSettings.contactTelegram}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2 hover:bg-zinc-800 rounded-lg text-zinc-100 transition-all border-b border-zinc-850 pb-2"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>Чат Telegram</span>
            </a>
            <a 
              href={`https://wa.me/${siteSettings.contactWhatsapp}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2 hover:bg-zinc-800 rounded-lg text-zinc-100 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Чат WhatsApp</span>
            </a>
          </div>
        )}
        
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-2xl border border-emerald-400/20 cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      {/* 🔴 МОДАЛКА УСПІШНОГО ЗАМОВЛЕННЯ ДЛЯ КЛІЄНТА (КНОПКИ ТГ ТА ВАТАП) */}
      {lastPlacedOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <h3 className="text-2xl font-bold text-white mb-2 font-serif text-center">Замовлення прийнято! 🥩</h3>
            <p className="text-xs text-center text-zinc-400 mb-6">
              Ваше замовлення <b className="text-white">{lastPlacedOrder.id}</b> успішно додано в систему. 
              Для миттєвого підтвердження ви можете надіслати копію замовлення у наш чат Telegram чи WhatsApp!
            </p>

            {/* Показ деталей чека */}
            <div className="bg-zinc-950 p-4 rounded-xl text-xs text-zinc-400 max-h-48 overflow-y-auto mb-6 border border-zinc-850">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                {generateOrderMessage(lastPlacedOrder)}
              </pre>
            </div>

            <div className="space-y-3">
              <a
                href={`https://t.me/${siteSettings.contactTelegram}?text=${encodeURIComponent(generateOrderMessage(lastPlacedOrder))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Надіслати в Telegram ✈️
              </a>
              <a
                href={`https://wa.me/${siteSettings.contactWhatsapp}?text=${encodeURIComponent(generateOrderMessage(lastPlacedOrder))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Надіслати у WhatsApp 💬
              </a>
              
              <button
                type="button"
                onClick={() => setLastPlacedOrder(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl text-xs font-bold transition-all mt-2"
              >
                Повернутись на сайт
              </button>
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯ ПАНЕЛЬ (ПІДВАЛ) ЗІ ПРИХОВАНИМ ВХОДОМ В АДМІНКУ */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-zinc-900 text-center text-[10px] text-zinc-650 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 {siteSettings.title}. Традиційні крафтові вироби за найвищими стандартами якості.</p>
          
          {/* Секретна іконка входу для адміна */}
          <div className="flex items-center gap-2">
            {!isAdmin ? (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="p-1.5 text-zinc-800 hover:text-zinc-500 transition-all"
                title="Панель керування"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-500/80 font-bold font-mono">
                <Unlock className="w-3 h-3" />
                <span>РЕЖИМ АДМІНІСТРАТОРА АКТИВНИЙ</span>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* МОДАЛЬНЕ ВІКНО ВХОДУ ДЛЯ АДМІНІСТРАТОРА */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-serif">
              <Lock className="w-4 h-4 text-amber-500" />
              Авторизація адміністратора
            </h3>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Введіть пароль доступу</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError(false);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  placeholder="••••"
                />
                {loginError && (
                  <p className="text-red-500 text-[10px] font-bold mt-2">Невірний пароль доступу!</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPasswordInput('');
                    setLoginError(false);
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 py-2.5 rounded-lg text-xs font-bold transition-all"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2.5 rounded-lg text-xs font-black transition-all"
                >
                  Увійти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
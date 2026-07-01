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
  Menu, 
  X, 
  ChevronRight, 
  Info, 
  User, 
  Clipboard, 
  DollarSign, 
  Filter, 
  ArrowRight,
  Eye,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  FileText,
  Save,
  Globe,
  Unlock,
  Lock
} from 'lucide-react';


// Початкові демонстраційні дані товарів (використовуються за замовчуванням)
const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Ковбаса "Домашня" запечена',
    category: 'sausages',
    price: 380,
    unit: 'кг',
    description: 'Традиційна українська домашня ковбаса зі свіжої свинини зі спеціями та часником, запечена в печі.',
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
    description: 'Ніжний свинячий балик гарячого копчення на вільховій трісці з вишуканим ароматом.',
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
    description: 'Преміальна яловичина високого ступеня мармуровості, витримана для максимальної соковитості.',
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

// Початкові категорії меню
const INITIAL_CATEGORIES = [
  { id: 'all', name: 'Усе меню' },
  { id: 'sausages', name: 'Ковбаси & Сосиски' },
  { id: 'delicacies', name: 'Копченості & Балик' },
  { id: 'fresh_meat', name: 'Свіже м’ясо' },
  { id: 'semi_finished', name: 'Напівфабрикати' }
];

// Налаштування інтерфейсу (які можна буде редагувати)
const INITIAL_SHOP_SETTINGS = {
  logoLetter: 'В',
  title: "М'ЯСНИЙ КРАФТ",
  subtitle: "Традиційні м'ясні вироби за рецептами визвольного руху",
  bannerBadge: "Армійський стандарт",
  bannerTitle: "Справжнє м'ясо з димком та волею в серці",
  bannerText: "Замовляйте свіжі делікатеси, натуральні ковбаси та соковите мариноване м'ясо до вашого столу. Усі замовлення збираються вручну та з любов'ю.",
  benefit1: "Екологічно чиста сировина",
  benefit2: "Власне коптильне виробництво на дровах",
  footerText: "© 2026 М'ясний Крафт. Створено з пошаною до українських традицій.",
  footerSubText: "База даних надійно інтегрована з вашим хмарним Gmail-сховищем Google Drive."
};

export default function App() {
  
  // Додавання шрифтів ЗСУ з Google Fonts та кастомні CSS стилі
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Arsenal:ital,wght@0,400;0,700;1,400;1,700&family=Oswald:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('meat_store_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('meat_store_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [shopSettings, setShopSettings] = useState(() => {
    const saved = localStorage.getItem('meat_store_settings');
    return saved ? JSON.parse(saved) : INITIAL_SHOP_SETTINGS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('meat_store_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'cart' | 'admin'
  const [adminSubTab, setAdminSubTab] = useState('products'); // 'products' | 'orders' | 'gdrive' | 'general'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Режим глобального редагування елементів прямо на сторінці
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Стан інтеграції з Gmail (Google Drive API)
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
  const [isGdriveScriptLoaded, setIsGdriveScriptLoaded] = useState(false);

  // Форма створення/редагування товару в Адмінці
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

  // Форма оформлення замовлення
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'pickup', // 'pickup' | 'delivery'
    paymentType: 'cash', // 'cash' | 'card_upon_receipt'
    comment: ''
  });

  // Збереження в локальне сховище
  useEffect(() => {
    localStorage.setItem('meat_store_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('meat_store_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('meat_store_settings', JSON.stringify(shopSettings));
  }, [shopSettings]);

  useEffect(() => {
    localStorage.setItem('meat_store_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('meat_store_gdrive_config', JSON.stringify(gdriveConfig));
  }, [gdriveConfig]);

  // Завантаження Google SDK для Gmail OAuth2 авторизації
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGdriveScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };


  // Авторизація через акаунт Google
  const handleGoogleLogin = () => {
    if (!gdriveConfig.clientId) {
      showToast('Будь ласка, вкажіть ваш Client ID в розділі Google Диск в адмінці!', 'error');
      setActiveTab('admin');
      setAdminSubTab('gdrive');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: gdriveConfig.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response) => {
          if (response.error) {
            showToast(`Помилка підключення: ${response.error}`, 'error');
            return;
          }
          
          const newConfig = {
            ...gdriveConfig,
            accessToken: response.access_token,
            isConnected: true
          };
          setGdriveConfig(newConfig);
          showToast('Акаунт Gmail успішно авторизовано! Запускаємо синхронізацію...', 'success');
          
          syncWithGoogleDrive(response.access_token, newConfig);
        },
      });
      client.requestAccessToken();
    } catch (err) {
      showToast(`Помилка ініціалізації: ${err.message}`, 'error');
    }
  };

  // Робота з Google Drive REST API
  const syncWithGoogleDrive = async (passedToken = null, passedConfig = null) => {
    const token = passedToken || gdriveConfig.accessToken;
    const currentConfig = passedConfig || gdriveConfig;

    if (!token) {
      showToast('Спершу увійдіть у ваш Gmail акаунт через вкладку Google Диск', 'error');
      return;
    }

    setIsSyncing(true);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      let fileId = currentConfig.fileId;

      // Пошук існуючого файлу meat_store_db.json на Диску
      if (!fileId) {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='meat_store_db.json' and trashed=false&fields=files(id, name)`;
        const searchRes = await fetch(searchUrl, { headers });
        const searchData = await searchRes.json();

        if (searchData.files && searchData.files.length > 0) {
          fileId = searchData.files[0].id;
        }
      }

      const dbPayload = {
        products,
        categories,
        shopSettings,
        orders,
        lastUpdated: new Date().toISOString()
      };

      if (fileId) {
        // Зчитування існуючих даних з Gmail Диску
        try {
          const getUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
          const getRes = await fetch(getUrl, { headers });
          if (getRes.ok) {
            const driveData = await getRes.ok ? await getRes.json() : null;
            
            if (driveData && driveData.lastUpdated) {
              // Запитуємо користувача про злиття контенту
              const confirmLoad = window.confirm(
                `На вашому Gmail диску знайдено хмарну базу від ${new Date(driveData.lastUpdated).toLocaleString('uk-UA')}.\n\nЗавантажити її на цей пристрій?\n\n(Натисніть "ОК", щоб оновити цей сайт даними з пошти, або "Скасувати", щоб перезаписати хмару поточними налаштуваннями сайту)`
              );
              
              if (confirmLoad) {
                if (driveData.products) setProducts(driveData.products);
                if (driveData.categories) setCategories(driveData.categories);
                if (driveData.shopSettings) setShopSettings(driveData.shopSettings);
                if (driveData.orders) setOrders(driveData.orders);
                
                showToast('Базу даних успішно завантажено з Gmail у ваш браузер!', 'success');
                setGdriveConfig(prev => ({
                  ...prev,
                  fileId,
                  lastSync: new Date().toLocaleString()
                }));
                setIsSyncing(false);
                return;
              }
            }
          }
        } catch (e) {
          console.log("Оновлення файлу без попереднього зчитування.");
        }

        // Оновлення файлу новими даними
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
          showToast('Всі зміни успішно записані у ваш хмарний файл на Gmail!', 'success');
        } else {
          throw new Error('Не вдалося зберегти зміни на диск');
        }
      } else {
        // Створення нового файлу конфігурації
        const metadata = {
          name: 'meat_store_db.json',
          mimeType: 'application/json'
        };

        const boundary = 'patriotic_milit_bound';
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
          showToast('На вашому Gmail Диску успішно створено хмарну базу "meat_store_db.json"!', 'success');
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
      showToast(`Помилка синхронізації: ${err.message}. Перевірте підключення акаунту.`, 'error');
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
    showToast('Хмару Gmail відключено.', 'info');
  };


  // Збереження налаштувань інтерфейсу
  const updateSettingField = (field, val) => {
    setShopSettings(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Редагування назви категорії прямо в меню
  const handleCategoryNameChange = (id, newName) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  // Видалення та додавання категорій в адмінці
  const handleAddCategory = () => {
    const newId = 'cat_' + Date.now();
    setCategories([...categories, { id: newId, name: 'Нова категорія' }]);
    showToast('Категорію створено. Натисніть кнопку "Редактор ✏️", щоб перейменувати її прямо в меню!', 'info');
  };

  const handleDeleteCategory = (id) => {
    if (id === 'all') return;
    if (window.confirm('Ви впевнені, що хочете видалити цю категорію? Товари залишаться, але змінять категорію на загальну.')) {
      setCategories(categories.filter(c => c.id !== id));
      setProducts(products.map(p => p.category === id ? { ...p, category: 'sausages' } : p));
      showToast('Категорію видалено.', 'info');
    }
  };

  // Створення / редагування товару
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showToast('Вкажіть назву та вартість делікатесу!', 'error');
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
      showToast('Делікатес успішно оновлено!');
    } else {
      setProducts([...products, productData]);
      showToast('Новий делікатес успішно додано до каталогу!');
    }

    setEditingProduct(null);
    setProductForm({
      name: '', category: 'sausages', price: '', unit: 'кг',
      description: '', image: '', available: true, weightStep: 0.1, minWeight: 0.2
    });

    if (gdriveConfig.isConnected) {
      setTimeout(() => syncWithGoogleDrive(), 600);
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
    setActiveTab('admin');
    setAdminSubTab('products');
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Видалити цей товар з вітрини магазину?')) {
      setProducts(products.filter(p => p.id !== productId));
      showToast('Товар видалено.', 'info');
      
      if (gdriveConfig.isConnected) {
        setTimeout(() => syncWithGoogleDrive(), 600);
      }
    }
  };


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
    showToast(`"${product.name}" додано до замовлення!`);
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      showToast('Товар вилучено з кошика', 'info');
      return;
    }
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: parseFloat(newQty.toFixed(2)) } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    showToast('Товар вилучено з кошика', 'info');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Кошик порожній!', 'error');
      return;
    }
    if (!checkoutForm.name || !checkoutForm.phone) {
      showToast('Будь ласка, заповніть контакти покупця!', 'error');
      return;
    }

    const newOrder = {
      id: 'ЗСУ-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString('uk-UA'),
      customer: { ...checkoutForm },
      items: [...cart],
      total: getCartTotal(),
      status: 'new'
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setCart([]);
    showToast(`Замовлення ${newOrder.id} успішно прийнято! Вже починаємо збирати.`, 'success');
    
    setActiveTab('shop');
    setCheckoutForm({
      name: '', phone: '', address: '', deliveryType: 'pickup', paymentType: 'cash', comment: ''
    });

    if (gdriveConfig.isConnected) {
      setTimeout(() => {
        setIsSyncing(true);
        const headers = { 'Authorization': `Bearer ${gdriveConfig.accessToken}`, 'Content-Type': 'application/json' };
        fetch(`https://www.googleapis.com/upload/drive/v3/files/${gdriveConfig.fileId}?uploadType=media`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ products, categories, shopSettings, orders: updatedOrders, lastUpdated: new Date().toISOString() })
        }).then(() => {
          setIsSyncing(false);
          setGdriveConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
        }).catch(() => setIsSyncing(false));
      }, 600);
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map(ord => ord.id === orderId ? { ...ord, status: newStatus } : ord);
    setOrders(updated);
    showToast(`Замовлення ${orderId} оновлено!`);

    if (gdriveConfig.isConnected) {
      setTimeout(() => {
        setIsSyncing(true);
        const headers = { 'Authorization': `Bearer ${gdriveConfig.accessToken}`, 'Content-Type': 'application/json' };
        fetch(`https://www.googleapis.com/upload/drive/v3/files/${gdriveConfig.fileId}?uploadType=media`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ products, categories, shopSettings, orders: updated, lastUpdated: new Date().toISOString() })
        }).then(() => {
          setIsSyncing(false);
          setGdriveConfig(prev => ({ ...prev, lastSync: new Date().toLocaleString() }));
        }).catch(() => setIsSyncing(false));
      }, 600);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased pb-16 selection:bg-red-800 selection:text-white">
      
      {/* Dynamic Font Declarations mimicking Volja & UAF Sans */}
      <style>{`
        /* Церемонійний шрифт ЗСУ "Воля" - відтворюється через величний Playfair Display з широким трекінгом та капітеллю */
        .font-volja {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        /* Комунікаційний шрифт ЗСУ "UAF Sans" - відтворюється через Oswald з патріотичним загартованим характером */
        .font-uaf-sans {
          font-family: 'Oswald', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        /* Текстовий шрифт "Arsenal" - чистий, пропорційний та сучасний український гуманістичний гротеск */
        .font-uaf-body {
          font-family: 'Arsenal', sans-serif;
        }
      `}</style>

      {/* Тост-сповіщення */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm p-4 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-3 border bg-zinc-900 border-amber-500/50 text-amber-100">
          <Check className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-sm font-medium font-uaf-body">{toast.message}</span>
        </div>
      )}

      {/* Верхня інформаційна лінія та швидкий вхід в Gmail Диск */}
      <div className="bg-zinc-900 text-xs py-2 px-4 border-b border-zinc-800/60 flex flex-wrap gap-4 items-center justify-between font-uaf-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-zinc-400">Хмарна база на Gmail:</span>
          {gdriveConfig.isConnected ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" /> Синхронізовано з Google Диском
            </span>
          ) : (
            <span className="text-amber-500 flex items-center gap-1">
              <CloudOff className="w-3.5 h-3.5" /> Локальний режим
            </span>
          )}
        </div>

        {/* Швидке перемикання режиму редагування */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsEditingMode(!isEditingMode);
              showToast(isEditingMode ? 'Режим редагування контенту вимкнено.' : 'Режим редагування контенту увімкнено! Натискайте на будь-який текст для редагування.');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all ${
              isEditingMode 
                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold' 
                : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Режим редактора {isEditingMode ? 'АКТИВНИЙ' : 'ВИМКНЕНО'}</span>
          </button>

          {gdriveConfig.isConnected && (
            <button
              onClick={() => syncWithGoogleDrive()}
              disabled={isSyncing}
              className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Синхронізувати</span>
            </button>
          )}
        </div>
      </div>

      {/* Головна Шапка */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-850 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Бренд */}
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('shop')}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-800 to-amber-700 border border-amber-500/20 flex items-center justify-center text-white shadow-lg">
                {isEditingMode ? (
                  <input 
                    type="text"
                    maxLength={1}
                    value={shopSettings.logoLetter}
                    onChange={(e) => updateSettingField('logoLetter', e.target.value.toUpperCase())}
                    className="w-10 h-10 bg-zinc-950/80 text-center text-xl font-volja text-amber-400 focus:outline-none rounded border border-amber-500"
                  />
                ) : (
                  <span className="font-volja text-2xl font-black text-amber-100">{shopSettings.logoLetter}</span>
                )}
              </div>
              
              <div>
                {isEditingMode ? (
                  <div className="flex flex-col gap-1">
                    <input 
                      type="text" 
                      value={shopSettings.title} 
                      onChange={(e) => updateSettingField('title', e.target.value)}
                      className="bg-zinc-950 text-white text-sm font-volja border border-amber-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <input 
                      type="text" 
                      value={shopSettings.subtitle} 
                      onChange={(e) => updateSettingField('subtitle', e.target.value)}
                      className="bg-zinc-950 text-zinc-400 text-[10px] font-uaf-body border border-amber-500 rounded px-1.5 py-0.5 focus:outline-none w-56"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg font-volja tracking-wider text-zinc-100 leading-tight">{shopSettings.title}</h1>
                    <p className="text-xs text-amber-500/90 font-medium font-uaf-body">{shopSettings.subtitle}</p>
                  </>
                )}
              </div>
            </div>

            {/* Навігація в стилі ЗСУ */}
            <nav className="hidden md:flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 font-uaf-sans">
              <button 
                onClick={() => setActiveTab('shop')}
                className={`px-5 py-2.5 rounded-lg text-xs tracking-wider transition-all ${activeTab === 'shop' ? 'bg-gradient-to-r from-red-900 to-zinc-800 text-white border border-amber-500/20 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Вітрина
              </button>
              <button 
                onClick={() => setActiveTab('cart')}
                className={`px-5 py-2.5 rounded-lg text-xs tracking-wider transition-all flex items-center gap-2 ${activeTab === 'cart' ? 'bg-gradient-to-r from-red-900 to-zinc-800 text-white border border-amber-500/20 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Кошик замовлення
                {cart.length > 0 && (
                  <span className="bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-md text-[10px]">
                    {cart.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setActiveTab('admin'); setAdminSubTab('products'); }}
                className={`px-5 py-2.5 rounded-lg text-xs tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-gradient-to-r from-red-900 to-zinc-800 text-white border border-amber-500/20 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Керування
              </button>
            </nav>

            {/* Мобільна навігація для швидкого доступу */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                onClick={() => setActiveTab('cart')}
                className="relative p-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 rounded-xl"
              >
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Мобільна нижня панель у стилі UAF Sans */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-zinc-800/80 px-4 py-2.5 flex justify-around items-center shadow-2xl font-uaf-sans">
        <button 
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-lg ${activeTab === 'shop' ? 'text-amber-500' : 'text-zinc-400'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] tracking-widest uppercase">Вітрина</span>
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-lg relative ${activeTab === 'cart' ? 'text-amber-500' : 'text-zinc-400'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute top-1 right-3 bg-red-600 text-white text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
              {cart.length}
            </span>
          )}
          <span className="text-[10px] tracking-widest uppercase">Кошик</span>
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-lg ${activeTab === 'admin' ? 'text-amber-500' : 'text-zinc-400'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-widest uppercase">Адмін</span>
        </button>
      </div>

      {/* Повідомлення про режим редагування */}
      {isEditingMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-center text-xs font-uaf-sans tracking-wide">
          🔧 РЕЖИМ РЕДАКТОРА АКТИВОВАНО. Клацайте на будь-який обведений жовтою рамкою блок, щоб змінити його вміст. Всі зміни записуються у хмару!
        </div>
      )}

      {/* Головний контент сайту */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Вкладка 1: ВІТРИНА МАГАЗИНУ */}
        {activeTab === 'shop' && (
          <div>
            {/* Рекламний Геро-Банер у мілітарі стилі */}
            <div className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950/80 border border-zinc-800 p-8 sm:p-12 flex flex-col justify-center min-h-[280px] shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.12),transparent_45%)]" />
              <div className="relative z-10 max-w-3xl">
                
                {/* Категорія банера */}
                <div className="inline-block mb-4">
                  {isEditingMode ? (
                    <input 
                      type="text" 
                      value={shopSettings.bannerBadge} 
                      onChange={(e) => updateSettingField('bannerBadge', e.target.value)}
                      className="bg-zinc-950 text-amber-400 text-xs font-uaf-sans tracking-widest border border-amber-500 rounded px-2 py-1 w-56 focus:outline-none"
                    />
                  ) : (
                    <span className="px-3.5 py-1.5 bg-red-950/70 border border-red-800 text-red-400 rounded-full text-xs font-uaf-sans tracking-widest uppercase">
                      {shopSettings.bannerBadge}
                    </span>
                  )}
                </div>

                {/* Заголовок банера (Шрифт Воля) */}
                <div className="mt-2 mb-4">
                  {isEditingMode ? (
                    <textarea 
                      value={shopSettings.bannerTitle} 
                      onChange={(e) => updateSettingField('bannerTitle', e.target.value)}
                      className="bg-zinc-950 text-white text-xl sm:text-2xl font-volja border border-amber-500 rounded p-2 focus:outline-none w-full h-18 resize-none"
                    />
                  ) : (
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-volja leading-tight text-zinc-100">
                      {shopSettings.bannerTitle}
                    </h2>
                  )}
                </div>

                {/* Опис банера (Шрифт Arsenal) */}
                <div className="mb-6">
                  {isEditingMode ? (
                    <textarea 
                      value={shopSettings.bannerText} 
                      onChange={(e) => updateSettingField('bannerText', e.target.value)}
                      className="bg-zinc-950 text-zinc-300 text-xs font-uaf-body border border-amber-500 rounded p-2 focus:outline-none w-full h-24 resize-none"
                    />
                  ) : (
                    <p className="text-zinc-400 text-sm sm:text-base font-uaf-body leading-relaxed max-w-2xl">
                      {shopSettings.bannerText}
                    </p>
                  )}
                </div>

                {/* Переваги на банері (UAF Sans / Arsenal) */}
                <div className="flex flex-col sm:flex-row gap-3 text-xs text-zinc-300 font-uaf-sans">
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800/80">
                    <span className="text-amber-500">✔</span>
                    {isEditingMode ? (
                      <input 
                        type="text" 
                        value={shopSettings.benefit1} 
                        onChange={(e) => updateSettingField('benefit1', e.target.value)}
                        className="bg-zinc-950 text-zinc-200 text-xs font-uaf-sans border border-amber-500 rounded px-1.5 py-0.5 focus:outline-none w-48"
                      />
                    ) : (
                      <span>{shopSettings.benefit1}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800/80">
                    <span className="text-amber-500">✔</span>
                    {isEditingMode ? (
                      <input 
                        type="text" 
                        value={shopSettings.benefit2} 
                        onChange={(e) => updateSettingField('benefit2', e.target.value)}
                        className="bg-zinc-950 text-zinc-200 text-xs font-uaf-sans border border-amber-500 rounded px-1.5 py-0.5 focus:outline-none w-56"
                      />
                    ) : (
                      <span>{shopSettings.benefit2}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Панель категорій та пошуку */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-8">
              
              {/* Пошук делікатесів */}
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="Шукати копченості, ковбасу, свіже м'ясо..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800/80 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder-zinc-500 transition-all font-uaf-body"
                />
              </div>

              {/* Навігація по Категоріях (З можливістю редагування назв прямо тут) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none font-uaf-sans text-xs">
                {categories.map(cat => (
                  <div key={cat.id} className="relative flex items-center gap-1.5 shrink-0">
                    {isEditingMode && cat.id !== 'all' ? (
                      <div className="flex items-center border border-amber-500/60 rounded-xl bg-zinc-900 p-1">
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => handleCategoryNameChange(cat.id, e.target.value)}
                          className="bg-transparent text-white px-2 py-1 focus:outline-none w-28 text-xs font-bold"
                        />
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 hover:text-red-400 text-zinc-500"
                          title="Видалити категорію"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all border ${
                          selectedCategory === cat.id 
                            ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-lg shadow-amber-500/10' 
                            : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditingMode && (
                  <button
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-amber-500 flex items-center gap-1 font-bold shrink-0"
                    title="Додати нову категорію"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Категорія</span>
                  </button>
                )}
              </div>
            </div>

            {/* Відображення товарів */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800 font-uaf-body">
                <p className="text-zinc-500 text-lg mb-2">Нічого не знайдено за вашим запитом</p>
                <p className="text-zinc-600 text-sm">Спробуйте змінити пошукове слово або вибрати іншу категорію.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className="group bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-850 hover:border-amber-500/40 transition-all flex flex-col hover:scale-[1.01] shadow-xl"
                  >
                    {/* Фото товару */}
                    <div className="relative h-56 overflow-hidden bg-zinc-950">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1602491453979-53a99888ecf1?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-50" />
                      
                      {/* Назва категорії на фото */}
                      <span className="absolute top-4 left-4 text-[10px] font-uaf-sans font-bold tracking-wider bg-zinc-900/90 text-amber-500 px-3 py-1 rounded-full border border-zinc-800">
                        {categories.find(c => c.id === product.category)?.name || 'Продукт'}
                      </span>

                      {!product.available && (
                        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center font-uaf-sans">
                          <span className="bg-red-950 text-red-400 border border-red-800 px-4 py-2 rounded-xl text-xs font-bold tracking-widest">
                            Тимчасово немає в наявності
                          </span>
                        </div>
                      )}

                      {/* Кнопка швидкого редагування в режимі редактора */}
                      {isEditingMode && (
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-400 shadow-lg"
                            title="Редагувати в формі"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 shadow-lg"
                            title="Видалити товар"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Інформація про товар */}
                    <div className="p-6 flex-1 flex flex-col justify-between font-uaf-body">
                      <div>
                        {/* Назва та ціна (можливість редагувати прямо з вітрини в режимі редактора) */}
                        {isEditingMode ? (
                          <div className="space-y-2 mb-2">
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? { ...p, name: e.target.value } : p));
                              }}
                              className="w-full bg-zinc-950 text-white text-sm font-volja border border-amber-500 rounded px-2 py-1"
                            />
                            <textarea
                              value={product.description}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? { ...p, description: e.target.value } : p));
                              }}
                              className="w-full bg-zinc-950 text-zinc-400 text-xs border border-amber-500 rounded p-1.5 h-14 resize-none"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-black text-zinc-100 group-hover:text-amber-500 transition-colors font-volja tracking-wide">
                              {product.name}
                            </h3>
                            <p className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                              {product.description || 'Натуральний крафтовий м’ясний виріб найвищої якості.'}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Нижня частина з цінником та додаванням в кошик */}
                      <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-500 tracking-wider uppercase font-uaf-sans">Ціна за 1 {product.unit}</div>
                          {isEditingMode ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="number"
                                value={product.price}
                                onChange={(e) => {
                                  setProducts(products.map(p => p.id === product.id ? { ...p, price: parseFloat(e.target.value) || 0 } : p));
                                }}
                                className="w-20 bg-zinc-950 text-white font-bold border border-amber-500 rounded px-1.5 py-0.5 text-sm"
                              />
                              <span className="text-xs">грн</span>
                            </div>
                          ) : (
                            <div className="text-2xl font-black text-white font-volja tracking-wide">
                              {product.price} <span className="text-xs font-sans font-normal text-zinc-400">грн</span>
                            </div>
                          )}
                        </div>

                        {product.available && (
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-uaf-sans tracking-widest text-xs px-4 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 border border-amber-500/10"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            Замовити
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

        {/* Вкладка 2: КОШИК ТА ОФОРМЛЕННЯ ЗАМОВЛЕННЯ */}
        {activeTab === 'cart' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-volja tracking-wider mb-8 text-white">Кошик вашого замовлення</h2>

            {cart.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800 font-uaf-body">
                <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 text-lg mb-6">Ваш кошик наразі порожній</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-6 py-3.5 rounded-xl font-bold font-uaf-sans tracking-widest text-xs transition-all"
                >
                  Перейти до вибору м'яса
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Список делікатесів */}
                <div className="lg:col-span-7 space-y-4 font-uaf-body">
                  {cart.map(item => (
                    <div 
                      key={item.id}
                      className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-4 justify-between"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover bg-zinc-950 shrink-0" 
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-zinc-100 truncate font-volja tracking-wide">{item.name}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{item.price} грн / {item.unit}</p>
                        
                        {/* Кнопки зміни ваги */}
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

                      <div className="text-right flex flex-col items-end gap-2 shrink-0">
                        <span className="font-bold text-white font-volja">
                          {parseFloat((item.price * item.quantity).toFixed(2))} грн
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Разом */}
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-zinc-400">Всього до сплати:</span>
                      <span className="text-3xl font-black font-volja text-amber-500">
                        {getCartTotal().toFixed(2)} грн
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      * Фінальна вага та фасування шматочків може незначно відрізнятися (у межах 50-100г). Наш спеціаліст зв'яжеться з вами для остаточного підтвердження.
                    </p>
                  </div>
                </div>

                {/* Форма замовлення */}
                <div className="lg:col-span-5 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 font-uaf-body">
                  <h3 className="text-xl font-bold font-volja tracking-wide text-white mb-6">Оформити доставку</h3>
                  
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Ваше Ім'я *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="Петро Кононенко"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Мобільний телефон *</label>
                      <input
                        type="tel"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="+380"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Спосіб доставки</label>
                      <div className="grid grid-cols-2 gap-2 mt-1 font-uaf-sans text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, deliveryType: 'pickup'})}
                          className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                            checkoutForm.deliveryType === 'pickup' 
                              ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          Самовивіз із крамниці
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, deliveryType: 'delivery'})}
                          className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                            checkoutForm.deliveryType === 'delivery' 
                              ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          Адресна доставка
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
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder="Місто, вулиця, будинок, квартира"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Варіант розрахунку</label>
                      <div className="grid grid-cols-2 gap-2 mt-1 font-uaf-sans text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, paymentType: 'cash'})}
                          className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                            checkoutForm.paymentType === 'cash' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          Готівка
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutForm({...checkoutForm, paymentType: 'card_upon_receipt'})}
                          className={`py-2 px-3 rounded-lg font-bold border transition-all ${
                            checkoutForm.paymentType === 'card_upon_receipt' 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          Оплата карткою
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Уточнення до замовлення</label>
                      <textarea
                        value={checkoutForm.comment}
                        onChange={(e) => setCheckoutForm({...checkoutForm, comment: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 h-20 resize-none"
                        placeholder="Наприклад: вакуумувати порційно по 0.5 кг..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-uaf-sans tracking-widest py-4 rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5 animate-pulse" />
                      Надіслати замовлення
                    </button>
                  </form>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Вкладка 3: КЕРУВАННЯ ТА ХМАРА GMAIL */}
        {activeTab === 'admin' && (
          <div>
            
            {/* Меню Адмін-панелі */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8 border-b border-zinc-850 pb-6 font-uaf-sans">
              <div>
                <h2 className="text-3xl font-volja tracking-wider text-white">Адміністраторська панель</h2>
                <p className="text-xs font-uaf-body text-zinc-400 mt-1">Оновлюйте асортимент, стежте за покупками та синхронізуйте базу з хмарою</p>
              </div>
              
              <div className="flex flex-wrap gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 text-xs font-bold">
                <button
                  onClick={() => setAdminSubTab('products')}
                  className={`px-4 py-2.5 rounded-lg transition-all ${
                    adminSubTab === 'products' ? 'bg-zinc-850 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-250'
                  }`}
                >
                  Вітрина товарів
                </button>
                <button
                  onClick={() => setAdminSubTab('orders')}
                  className={`px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    adminSubTab === 'orders' ? 'bg-zinc-850 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-250'
                  }`}
                >
                  Замовлення
                  {orders.filter(o => o.status === 'new').length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>
                <button
                  onClick={() => setAdminSubTab('gdrive')}
                  className={`px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    adminSubTab === 'gdrive' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-250'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Google Диск (Gmail)
                </button>
                <button
                  onClick={() => setAdminSubTab('general')}
                  className={`px-4 py-2.5 rounded-lg transition-all ${
                    adminSubTab === 'general' ? 'bg-zinc-850 text-white border border-zinc-700' : 'text-zinc-400'
                  }`}
                >
                  Загальні тексти
                </button>
              </div>
            </div>

            {/* СУБ-ВКЛАДКА: ТОВАРИ ТА АСОРТИМЕНТ */}
            {adminSubTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-uaf-body">
                
                {/* Форма делікатесу */}
                <div className="lg:col-span-5 bg-zinc-900 p-6 rounded-3xl border border-zinc-800 self-start">
                  <h3 className="text-lg font-volja tracking-wide mb-6 text-white flex items-center gap-2">
                    {editingProduct ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                    {editingProduct ? 'Редагувати опис' : 'Створити нову позицію'}
                  </h3>

                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Назва делікатесу *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="Наприклад: Балик Панський копчений"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Вартість (грн) *</label>
                        <input
                          type="number"
                          required
                          value={productForm.price}
                          onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                          placeholder="490"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Вимір</label>
                        <select
                          value={productForm.unit}
                          onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        >
                          <option value="кг">кг (Кілограми)</option>
                          <option value="шт">шт (Штуки)</option>
                          <option value="уп">уп (Упаковки)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Мін. вага порції</label>
                        <input
                          type="number"
                          step="0.05"
                          value={productForm.minWeight}
                          onChange={(e) => setProductForm({...productForm, minWeight: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Крок ваги (+/-)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={productForm.weightStep}
                          onChange={(e) => setProductForm({...productForm, weightStep: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Категорія меню</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      >
                        {categories.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Зображення (URL)</label>
                      <input
                        type="url"
                        value={productForm.image}
                        onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Короткий опис смаку</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none h-20 resize-none"
                        placeholder="Опишіть особливості приготування або спецій..."
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="available"
                        checked={productForm.available}
                        onChange={(e) => setProductForm({...productForm, available: e.target.checked})}
                        className="rounded border-zinc-800 text-red-600 focus:ring-red-500 bg-zinc-950"
                      />
                      <label htmlFor="available" className="text-sm font-medium text-zinc-300">Відображати на вітрині</label>
                    </div>

                    <div className="flex gap-2 pt-2 font-uaf-sans text-[10px]">
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
                          className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 py-3 rounded-xl font-bold transition-all"
                        >
                          Скасувати
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white py-3 rounded-xl font-bold transition-all shadow-md"
                      >
                        {editingProduct ? 'Оновити' : 'Опублікувати'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Базовий список */}
                <div className="lg:col-span-7 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                  <div className="p-6 border-b border-zinc-800">
                    <h3 className="font-volja tracking-wide text-lg">Усі позиції на вітрині</h3>
                  </div>
                  <div className="divide-y divide-zinc-800 overflow-y-auto max-h-[620px]">
                    {products.map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-850/50 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-950 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-zinc-100 truncate font-volja tracking-wide">{p.name}</h4>
                            <p className="text-xs text-amber-500 font-medium">
                              {p.price} грн / {p.unit} ({categories.find(c => c.id === p.category)?.name || 'Продукт'})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300"
                            title="Змінити опис"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 bg-zinc-800/50 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800"
                            title="Видалити"
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

            {/* СУБ-ВКЛАДКА: ЗАМОВЛЕННЯ */}
            {adminSubTab === 'orders' && (
              <div className="space-y-6 font-uaf-body">
                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
                    <p className="text-zinc-400">Наразі замовлень немає.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div 
                      key={order.id} 
                      className={`bg-zinc-900 border rounded-3xl p-6 transition-all ${
                        order.status === 'new' ? 'border-amber-500/40' : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold font-volja text-white">{order.id}</span>
                            <span className={`text-[10px] font-uaf-sans font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              order.status === 'new' ? 'bg-amber-500/20 text-amber-400' :
                              order.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              'bg-zinc-850 text-zinc-400'
                            }`}>
                              {order.status === 'new' ? 'Очікує' : 
                               order.status === 'completed' ? 'Надіслано' : 'Скасовано'}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 block mt-1">{order.date}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block">Сума замовлення</span>
                          <span className="text-xl font-black text-amber-500 font-volja tracking-wide">
                            {order.total.toFixed(2)} грн
                          </span>
                        </div>
                      </div>

                      {/* Дані клієнта */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-6 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850">
                        <div>
                          <span className="text-[10px] font-uaf-sans font-bold text-zinc-500 tracking-wider uppercase block mb-1">Одержувач</span>
                          <p className="font-bold text-zinc-200">{order.customer.name}</p>
                          <p className="text-zinc-400 mt-1">{order.customer.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-uaf-sans font-bold text-zinc-500 tracking-wider uppercase block mb-1">Варіант доставки</span>
                          <p className="font-bold text-zinc-200">
                            {order.customer.deliveryType === 'pickup' ? 'Самовивіз' : 'Адресна'}
                          </p>
                          {order.customer.deliveryType === 'delivery' && (
                            <p className="text-zinc-400 mt-1">{order.customer.address}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-uaf-sans font-bold text-zinc-500 tracking-wider uppercase block mb-1">Сплата</span>
                          <p className="font-bold text-zinc-200">
                            {order.customer.paymentType === 'cash' ? 'Готівка' : 'Картою при отриманні'}
                          </p>
                        </div>
                      </div>

                      {/* Товари в замовленні */}
                      <div className="space-y-2 mb-6">
                        <span className="text-[10px] font-uaf-sans font-bold text-zinc-500 tracking-wider uppercase block mb-2">Перелік делікатесів</span>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-zinc-900/50 p-2 px-4 rounded-xl border border-zinc-850">
                            <span className="text-sm font-medium text-zinc-300 font-volja">{item.name}</span>
                            <span className="text-sm text-zinc-400">
                              {item.quantity} {item.unit} x {item.price} грн = <b>{parseFloat((item.quantity * item.price).toFixed(2))} грн</b>
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer.comment && (
                        <div className="mb-6 p-3 bg-zinc-950 rounded-xl text-xs text-zinc-400 border-l-2 border-amber-500">
                          <b>Уточнення покупця:</b> {order.customer.comment}
                        </div>
                      )}

                      {order.status === 'new' && (
                        <div className="flex gap-2 font-uaf-sans text-[10px]">
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            Підтвердити виконання
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'canceled')}
                            className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 px-5 py-3 rounded-xl tracking-wider font-bold transition-all"
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

            {/* СУБ-ВКЛАДКА: НАЛАШТУВАННЯ GOOGLE ДИСКУ (GMAIL) */}
            {adminSubTab === 'gdrive' && (
              <div className="max-w-3xl mx-auto bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xl font-uaf-body">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                    <Database className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-volja tracking-wide text-white">Інтеграція з хмарою Gmail</h3>
                    <p className="text-xs text-zinc-400">Вся база товарів, категорій, налаштувань інтерфейсу та замовлень зберігатиметься безпосередньо у вашому особистому Google Drive файлі.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  
                  {/* Детальна довідка */}
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                    <h4 className="font-bold text-zinc-200 mb-2 uppercase tracking-wide flex items-center gap-1.5 font-uaf-sans text-[10px]">
                      <Info className="w-4 h-4 text-amber-500" />
                      Як приєднати свій Gmail-акаунт (за 3 кроки):
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 mt-2">
                      <li>Перейдіть у <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-500 underline">Google Cloud Console</a> та створіть швидкий проєкт.</li>
                      <li>Увімкніть бібліотеку <b>Google Drive API</b>.</li>
                      <li>У розділі <b>Credentials</b> згенеруйте <b>OAuth 2.0 Client ID</b> (тип: Web Application), додайте посилання вашого хостингу в "Authorized JavaScript origins" та вставте скопійований ID нижче.</li>
                    </ol>
                  </div>

                  {/* Введення налаштувань */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 font-uaf-sans">Ваш Google Client ID</label>
                      <input
                        type="text"
                        value={gdriveConfig.clientId}
                        onChange={(e) => setGdriveConfig({...gdriveConfig, clientId: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="Введіть ваш унікальний ідентифікатор Google Client ID..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2 font-uaf-sans text-xs">
                      {gdriveConfig.isConnected ? (
                        <>
                          <button
                            onClick={() => syncWithGoogleDrive()}
                            disabled={isSyncing}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                          >
                            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Зберігаємо дані...' : 'Синхронізувати хмару'}
                          </button>
                          <button
                            onClick={disconnectGdrive}
                            className="bg-zinc-800 hover:bg-zinc-700 text-red-400 font-bold py-3.5 px-6 rounded-xl transition-all border border-zinc-700"
                          >
                            Відключити
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleGoogleLogin}
                          className="flex-1 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Cloud className="w-4 h-4 animate-pulse" />
                          Увійти через Gmail акаунт
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Інформація про стан */}
                  <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-uaf-sans">Режим роботи:</span>
                      <span className={`font-bold uppercase ${gdriveConfig.isConnected ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {gdriveConfig.isConnected ? 'Хмарний (Gmail Drive DB)' : 'Локальний (Браузер)'}
                      </span>
                    </div>
                    {gdriveConfig.fileId && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-uaf-sans">Хмарний ID бази:</span>
                        <span className="text-zinc-300 font-mono select-all text-[10px]">{gdriveConfig.fileId}</span>
                      </div>
                    )}
                    {gdriveConfig.lastSync && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-uaf-sans">Остання хмарна сесія:</span>
                        <span className="text-zinc-300">{gdriveConfig.lastSync}</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* СУБ-ВКЛАДКА: ЗАГАЛЬНІ ТЕКСТИ І БАНЕРИ (ФОРМА) */}
            {adminSubTab === 'general' && (
              <div className="max-w-2xl mx-auto bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-xl font-uaf-body">
                <h3 className="text-xl font-volja tracking-wide text-white mb-6">Текстове наповнення сайту</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Назва крамниці</label>
                    <input
                      type="text"
                      value={shopSettings.title}
                      onChange={(e) => updateSettingField('title', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Опис під назвою</label>
                    <input
                      type="text"
                      value={shopSettings.subtitle}
                      onChange={(e) => updateSettingField('subtitle', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Текст у футері</label>
                    <input
                      type="text"
                      value={shopSettings.footerText}
                      onChange={(e) => updateSettingField('footerText', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        showToast('Всі загальні текстові конфігурації збережено локально! Не забудьте синхронізувати з хмарою Gmail.', 'success');
                        setActiveTab('shop');
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-uaf-sans tracking-widest font-bold py-3.5 rounded-xl text-xs transition-all"
                    >
                      Зберегти зміни та вийти
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Копірайт підвал (Шрифт Arsenal / UAF Sans) */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-500 font-uaf-body">
        {isEditingMode ? (
          <div className="max-w-lg mx-auto space-y-2">
            <input 
              type="text" 
              value={shopSettings.footerText} 
              onChange={(e) => updateSettingField('footerText', e.target.value)}
              className="w-full bg-zinc-950 text-zinc-300 text-xs border border-amber-500 rounded px-2 py-1 focus:outline-none"
            />
            <input 
              type="text" 
              value={shopSettings.footerSubText} 
              onChange={(e) => updateSettingField('footerSubText', e.target.value)}
              className="w-full bg-zinc-950 text-zinc-500 text-[10px] border border-amber-500 rounded px-2 py-1 focus:outline-none"
            />
          </div>
        ) : (
          <>
            <p>{shopSettings.footerText}</p>
            <p className="mt-2 text-zinc-600 text-[11px]">{shopSettings.footerSubText}</p>
          </>
        )}
      </footer>

    </div>
  );
}
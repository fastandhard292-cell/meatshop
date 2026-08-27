import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  AlertTriangle, 
  Send, 
  MessageSquare, 
  Phone, 
  Image as ImageIcon,
  LogIn,
  LogOut
} from 'lucide-react';
import { supabase } from './supabaseClient';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_PHONE = '+380984536052';
const DEFAULT_PHONE_RAW = '380984536052';

const formatImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1602491453979-53a99888ecf1?auto=format&fit=crop&q=80&w=600';
  return url.trim();
};

const compressImage = (file, maxWidth = 900, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression error'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditorMode, setIsEditorMode] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    title: 'М\'ЯСНИЙ КРАФТ',
    subtitle: 'Традиційні м\'ясні вироби за рецептами визвольного руху',
    bannerBadge: 'АРМІЙСЬКИЙ СТАНДАРТ',
    bannerTitle: 'СПРАВЖНЄ М\'ЯСО З ДИМКОМ ТА ВОЛЕЮ В СЕРЦІ',
    bannerDesc: 'Замовляйте свіжі делікатеси, натуральні ковбаси та соковите мариноване м\'ясо до вашого столу.',
    advantage1: 'ЕКОЛОГІЧНО ЧИСТА СИРОВИНА',
    advantage2: 'ВЛАСНЕ КОПТИЛЬНЕ ВИРОБНИЦТВО НА ДРОВАХ',
    contactPhone: DEFAULT_PHONE,
    contactTelegram: DEFAULT_PHONE,
    contactWhatsapp: DEFAULT_PHONE_RAW,
    contactViber: DEFAULT_PHONE
  });

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('products');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = (currentUser) => {
    setUser(currentUser);
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase();
      const hasAdminRights = ADMIN_EMAILS.includes(email);
      setIsAdmin(hasAdminRights);
      if (currentUser && !hasAdminRights) {
        setIsEditorMode(false);
      }
    } else {
      setIsAdmin(false);
      setIsEditorMode(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) showToast(`Помилка входу: ${error.message}`, 'error');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('shop');
    showToast('Ви вийшли з облікового запису', 'info');
  };

  const fetchData = async () => {
    try {
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData) {
        setProducts(prodData.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: Number(p.price),
          unit: p.unit,
          description: p.description,
          image: p.image,
          available: p.available,
          weightStep: Number(p.weight_step || 0.1),
          minWeight: Number(p.min_weight || 0.2)
        })));
      }

      const { data: settData } = await supabase.from('site_settings').select('*').single();
      if (settData) {
        setSiteSettings(prev => ({
          ...prev,
          title: settData.title || prev.title,
          subtitle: settData.subtitle || prev.subtitle,
          bannerBadge: settData.banner_badge || prev.bannerBadge,
          bannerTitle: settData.banner_title || prev.bannerTitle,
          bannerDesc: settData.banner_desc || prev.bannerDesc,
          advantage1: settData.advantage1 || prev.advantage1,
          advantage2: settData.advantage2 || prev.advantage2,
          contactPhone: settData.contact_phone || DEFAULT_PHONE,
          contactTelegram: settData.contact_telegram || DEFAULT_PHONE,
          contactWhatsapp: settData.contact_whatsapp || DEFAULT_PHONE_RAW,
          contactViber: settData.contact_viber || DEFAULT_PHONE
        }));
      }

      const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordData) setOrders(ordData);
    } catch (e) {
      console.error('Помилка завантаження даних:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTextChange = async (key, newValue) => {
    const updated = { ...siteSettings, [key]: newValue };
    setSiteSettings(updated);

    if (isAdmin) {
      await supabase.from('site_settings').upsert({
        id: 1,
        title: updated.title,
        subtitle: updated.subtitle,
        banner_badge: updated.bannerBadge,
        banner_title: updated.bannerTitle,
        banner_desc: updated.bannerDesc,
        advantage1: updated.advantage1,
        advantage2: updated.advantage2,
        contact_phone: updated.contactPhone,
        contact_telegram: updated.contactTelegram,
        contact_whatsapp: updated.contactWhatsapp,
        contact_viber: updated.contactViber
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Оберіть графічний файл', 'error');
      return;
    }

    try {
      showToast('Стиснення та завантаження у Storage...', 'info');
      const compressedBlob = await compressImage(file, 900, 0.75);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedBlob, { 
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: false 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setProductForm(prev => ({ ...prev, image: publicUrl }));
      showToast('Фото успішно завантажено!', 'success');
    } catch (err) {
      console.error('Помилка завантаження фото:', err);
      showToast(`Помилка: ${err.message}`, 'error');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showToast('Вкажіть назву та ціну!', 'error');
      return;
    }

    const payload = {
      id: editingProduct ? editingProduct.id : 'p_' + Date.now(),
      name: productForm.name,
      category: productForm.category,
      price: parseFloat(productForm.price) || 0,
      unit: productForm.unit,
      description: productForm.description,
      image: productForm.image,
      available: productForm.available,
      weight_step: parseFloat(productForm.weightStep) || 0.1,
      min_weight: parseFloat(productForm.minWeight) || 0.2
    };

    const { error } = await supabase.from('products').upsert(payload);
    if (error) {
      showToast(`Помилка збереження: ${error.message}`, 'error');
      return;
    }

    showToast(editingProduct ? 'Товар оновлено!' : 'Товар додано!');
    setEditingProduct(null);
    setProductForm({
      name: '', category: 'sausages', price: '', unit: 'кг',
      description: '', image: '', available: true, weightStep: 0.1, minWeight: 0.2
    });
    fetchData();
  };

  const handleDeleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      showToast(`Помилка видалення: ${error.message}`, 'error');
      return;
    }
    showToast('Товар видалено', 'info');
    fetchData();
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast('Кошик порожній!', 'error');
    if (!checkoutForm.name || !checkoutForm.phone) return showToast('Заповніть контактні дані!', 'error');

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString('uk-UA'),
      customer: { ...checkoutForm },
      items: [...cart],
      total,
      status: 'new'
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) {
      showToast(`Помилка створення замовлення: ${error.message}`, 'error');
      return;
    }

    setLastPlacedOrder(newOrder);
    setCart([]);
    setCheckoutForm({ name: '', phone: '', address: '', deliveryType: 'pickup', paymentType: 'cash', comment: '' });
    showToast(`Замовлення ${newOrder.id} успішно прийнято!`);
    fetchData();
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      showToast(`Помилка: ${error.message}`, 'error');
      return;
    }
    showToast('Статус замовлення оновлено');
    fetchData();
  };

  const generateOrderMessage = (order) => {
    if (!order) return "";
    let itemsText = order.items.map((item, idx) => 
      `${idx + 1}. ${item.name} (${item.quantity} ${item.unit} x ${item.price} грн) = ${(item.quantity * item.price).toFixed(2)} грн`
    ).join('\n');

    return `*Нове замовлення ${order.id}* від ${order.date}\n\n` +
           `👤 *Покупець:* ${order.customer.name}\n` +
           `📞 *Телефон:* ${order.customer.phone}\n` +
           `🚚 *Доставка:* ${order.customer.deliveryType === 'pickup' ? 'Самовивіз' : 'Адресна (' + order.customer.address + ')'}\n` +
           `💳 *Оплата:* ${order.customer.paymentType === 'cash' ? 'Готівка' : 'Термінал'}\n` +
           `💬 *Коментар:* ${order.customer.comment || '-'}\n\n` +
           `*Замовлені вироби:*\n${itemsText}\n\n` +
           `💰 *Загальна сума:* *${order.total.toFixed(2)} грн*`;
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getTelegramLink = (u) => {
    if (!u) return `https://t.me/+380984536052`;
    const clean = u.replace('@', '').trim();
    return clean.startsWith('+') || /^\d+$/.test(clean) ? `https://t.me/${clean.startsWith('+') ? clean : '+' + clean}` : `https://t.me/${clean}`;
  };
  const getWhatsappLink = (p) => `https://wa.me/${(p || DEFAULT_PHONE_RAW).replace(/[+\s()]/g, '')}`;
  const getViberLink = (p) => `viber://chat?number=%2B${(p || DEFAULT_PHONE_RAW).replace(/[+\s()]/g, '')}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-20 selection:bg-red-800 selection:text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-800 text-red-200' : 'bg-zinc-900/90 border-amber-500/30 text-amber-200'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-amber-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Панель адміністратора */}
      {isAdmin && (
        <div className="bg-zinc-900 border-b border-zinc-800 py-2.5 px-4 text-xs font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-zinc-200">АДМІНІСТРАТОР ({user?.email})</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditorMode(!isEditorMode)}
                className={`px-3 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all ${
                  isEditorMode ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Режим редактора {isEditorMode ? 'УВІМК' : 'ВИМК'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шапка сайту */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('shop')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-amber-600 flex items-center justify-center text-white font-serif text-2xl font-black">
              М
            </div>
            <div>
              {isEditorMode ? (
                <input
                  value={siteSettings.title}
                  onChange={(e) => handleTextChange('title', e.target.value)}
                  className="bg-zinc-900 text-white font-bold text-lg font-serif border border-dashed border-amber-500/50 rounded px-1"
                />
              ) : (
                <h1 className="text-lg font-bold text-zinc-100 font-serif">{siteSettings.title}</h1>
              )}
              {isEditorMode ? (
                <input
                  value={siteSettings.subtitle}
                  onChange={(e) => handleTextChange('subtitle', e.target.value)}
                  className="bg-zinc-900 text-amber-500/90 text-xs border border-dashed border-amber-500/50 rounded px-1 block mt-1"
                />
              ) : (
                <p className="text-xs text-amber-500/90 font-medium">{siteSettings.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('shop')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'shop' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Вітрина
              </button>
              <button 
                onClick={() => setActiveTab('cart')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${activeTab === 'cart' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                <ShoppingBag className="w-4 h-4" />
                Кошик {cart.length > 0 && `(${cart.length})`}
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('admin')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'admin' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
                >
                  Керування
                </button>
              )}
            </nav>

            {user ? (
              <div className="flex items-center gap-2 bg-zinc-900 py-1.5 px-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-300 font-mono hidden sm:inline">{user.email}</span>
                <button onClick={handleLogout} title="Вийти" className="text-zinc-500 hover:text-red-400 p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleLogin} 
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-zinc-800"
              >
                <LogIn className="w-4 h-4 text-amber-500" />
                Увійти через Gmail
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Головний блок */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'shop' && (
          <div>
            {/* Банер */}
            <div className="rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 border border-zinc-900 p-8 sm:p-12 mb-10 shadow-2xl">
              <span className="px-3.5 py-1.5 bg-red-950/60 border border-red-800/60 text-red-400 rounded-full text-xs font-bold uppercase">
                {siteSettings.bannerBadge}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black mt-5 mb-3 font-serif leading-tight">
                {siteSettings.bannerTitle}
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mb-6">
                {siteSettings.bannerDesc}
              </p>
            </div>

            {/* Пошук та фільтри */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
              <div className="relative w-full sm:w-96">
                <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Пошук делікатесів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {[
                  { id: 'all', name: 'Усе меню' },
                  { id: 'sausages', name: 'Ковбаси' },
                  { id: 'delicacies', name: 'Делікатеси' },
                  { id: 'fresh_meat', name: 'Свіже м’ясо' },
                  { id: 'semi_finished', name: 'Напівфабрикати' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat.id ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Сітка товарів */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-850 flex flex-col justify-between">
                  <div className="h-56 bg-zinc-950 relative">
                    <img src={formatImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                    {!p.available && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-xs uppercase tracking-wider text-red-400">
                        Немає в наявності
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-serif">{p.name}</h3>
                      <p className="text-xs text-zinc-400 mt-2">{p.description}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div className="text-2xl font-black font-serif">{p.price} <span className="text-xs font-sans text-zinc-400">грн/{p.unit}</span></div>
                      {p.available && (
                        <button
                          onClick={() => {
                            const existing = cart.find(item => item.id === p.id);
                            if (existing) {
                              setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + (p.minWeight || 1) } : i));
                            } else {
                              setCart([...cart, { ...p, quantity: p.minWeight || 1 }]);
                            }
                            showToast(`"${p.name}" додано до кошика!`);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" /> Додати
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кошик */}
        {activeTab === 'cart' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif mb-6">Ваш кошик</h2>
            {cart.length === 0 ? (
              <p className="text-zinc-500">Кошик порожній.</p>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <span className="text-xs text-zinc-400">{item.quantity} {item.unit} × {item.price} грн</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{(item.price * item.quantity).toFixed(2)} грн</span>
                        <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-xl font-bold font-serif pt-2 text-amber-500">
                    Разом: {cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)} грн
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
                  <h3 className="font-bold text-lg font-serif mb-2">Контактні дані</h3>
                  <input
                    required
                    placeholder="Ваше ім'я"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Номер телефону"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                  <button type="submit" className="w-full bg-amber-500 text-zinc-950 font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs">
                    Підтвердити замовлення
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Адмінка */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-8">
            <div className="flex gap-2 border-b border-zinc-800 pb-4">
              <button 
                onClick={() => setAdminSubTab('products')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold ${adminSubTab === 'products' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                Товари ({products.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('orders')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold ${adminSubTab === 'orders' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                Замовлення ({orders.length})
              </button>
              <button 
                onClick={() => setAdminSubTab('contacts')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold ${adminSubTab === 'contacts' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                Контакти & Месенджери
              </button>
            </div>

            {adminSubTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form onSubmit={handleSaveProduct} className="lg:col-span-5 bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4 self-start">
                  <h3 className="font-bold font-serif">{editingProduct ? 'Редагувати товар' : 'Новий товар'}</h3>
                  <input
                    required
                    placeholder="Назва товару"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      type="number"
                      placeholder="Ціна (грн)"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                    />
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm text-zinc-300"
                    >
                      <option value="sausages">Ковбаси</option>
                      <option value="delicacies">Делікатеси</option>
                      <option value="fresh_meat">Свіже м’ясо</option>
                      <option value="semi_finished">Напівфабрикати</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-2 flex items-center justify-between">
                      <span>Зображення</span>
                      <label htmlFor="file-upload" className="cursor-pointer text-amber-500 hover:underline flex items-center gap-1 font-bold">
                        <ImageIcon className="w-4 h-4" /> Завантажити фото
                      </label>
                    </label>
                    <input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <input
                      placeholder="URL фото або оберіть файл"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs"
                    />
                  </div>

                  <textarea
                    placeholder="Опис товару"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm h-20"
                  />

                  <div className="flex gap-2">
                    {editingProduct && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingProduct(null); setProductForm({ name: '', category: 'sausages', price: '', unit: 'кг', description: '', image: '', available: true, weightStep: 0.1, minWeight: 0.2 }); }} 
                        className="flex-1 bg-zinc-800 py-3 rounded-xl text-xs font-bold"
                      >
                        Скасувати
                      </button>
                    )}
                    <button type="submit" className="flex-1 bg-amber-500 text-zinc-950 font-bold py-3 rounded-xl text-xs">
                      Зберегти
                    </button>
                  </div>
                </form>

                <div className="lg:col-span-7 bg-zinc-900 rounded-3xl border border-zinc-800 p-4 space-y-3">
                  {products.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-2xl border border-zinc-850">
                      <div className="flex items-center gap-3">
                        <img src={formatImageUrl(p.image)} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <h5 className="font-bold text-sm">{p.name}</h5>
                          <span className="text-xs text-amber-500 font-bold">{p.price} грн/{p.unit}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingProduct(p); setProductForm({ ...p, price: p.price.toString() }); }} className="p-2 bg-zinc-800 rounded-lg hover:text-amber-500">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-zinc-800 rounded-lg hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSubTab === 'orders' && (
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{o.id}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${o.status === 'new' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{o.customer?.name} ({o.customer?.phone})</p>
                      <div className="text-xs text-zinc-500 mt-2">
                        {o.items?.map((item, idx) => (
                          <div key={idx}>• {item.name} ({item.quantity} {item.unit})</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end justify-between">
                      <span className="text-xl font-bold font-serif text-amber-500">{o.total} грн</span>
                      {o.status === 'new' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(o.id, 'completed')} 
                          className="mt-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          Виконано
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminSubTab === 'contacts' && (
              <div className="max-w-2xl bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
                <h3 className="text-lg font-bold font-serif mb-4">Налаштування контактів</h3>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Номер телефону для дзвінків</label>
                  <input
                    value={siteSettings.contactPhone}
                    onChange={(e) => handleTextChange('contactPhone', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Telegram (Телефон або Username)</label>
                  <input
                    value={siteSettings.contactTelegram}
                    onChange={(e) => handleTextChange('contactTelegram', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">WhatsApp (лише цифри)</label>
                  <input
                    value={siteSettings.contactWhatsapp}
                    onChange={(e) => handleTextChange('contactWhatsapp', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Viber (номер телефону)</label>
                  <input
                    value={siteSettings.contactViber}
                    onChange={(e) => handleTextChange('contactViber', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Модалка після оформлення замовлення */}
      {lastPlacedOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2 font-serif text-center">Замовлення прийнято! 🥩</h3>
            <p className="text-xs text-center text-zinc-400 mb-6">
              Номер замовлення: <b className="text-white">{lastPlacedOrder.id}</b>. Надішліть копію у зручний месенджер:
            </p>

            <div className="space-y-2.5">
              <a
                href={`${getTelegramLink(siteSettings.contactTelegram)}?text=${encodeURIComponent(generateOrderMessage(lastPlacedOrder))}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Надіслати в Telegram
              </a>
              <a
                href={`${getWhatsappLink(siteSettings.contactWhatsapp)}?text=${encodeURIComponent(generateOrderMessage(lastPlacedOrder))}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Надіслати у WhatsApp
              </a>
              <a
                href={`viber://chat?number=%2B${(siteSettings.contactViber || DEFAULT_PHONE_RAW).replace(/[+\s()]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Відкрити у Viber
              </a>
              <button
                type="button"
                onClick={() => setLastPlacedOrder(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 py-3 rounded-xl text-xs font-bold mt-3"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Плаваюче меню швидкого зв'язку */}
      <div className="fixed bottom-6 right-6 z-40">
        {showContactMenu && (
          <div className="mb-3 flex flex-col gap-1.5 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-2xl text-xs font-bold w-44">
            <a href={`tel:${siteSettings.contactPhone}`} className="p-2 hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 text-zinc-200">
              <Phone className="w-4 h-4 text-emerald-500" /> Дзвінок
            </a>
            <a href={getTelegramLink(siteSettings.contactTelegram)} target="_blank" rel="noreferrer" className="p-2 hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 text-zinc-200">
              <Send className="w-4 h-4 text-sky-400" /> Telegram
            </a>
            <a href={getWhatsappLink(siteSettings.contactWhatsapp)} target="_blank" rel="noreferrer" className="p-2 hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 text-zinc-200">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp
            </a>
            <a href={getViberLink(siteSettings.contactViber)} target="_blank" rel="noreferrer" className="p-2 hover:bg-zinc-800 rounded-lg flex items-center gap-2.5 text-zinc-200">
              <Phone className="w-4 h-4 text-purple-400" /> Viber
            </a>
          </div>
        )}
        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
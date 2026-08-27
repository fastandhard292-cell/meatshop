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
  LogOut, 
  Upload, 
  Copy, 
  X,
  Heart,
  User,
  Package
} from 'lucide-react';
import { supabase } from './supabaseClient';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_PHONE = '+380984536052';
const DEFAULT_PHONE_RAW = '380984536052';

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'Усе меню' },
  { id: 'sausages', name: 'Ковбаси' },
  { id: 'delicacies', name: 'Делікатеси' },
  { id: 'fresh_meat', name: 'Свіже м’ясо' },
  { id: 'semi_finished', name: 'Напівфабрикати' }
];

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
  const [myOrders, setMyOrders] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('meat_store_favs') || '[]');
    } catch { return []; }
  });

  const [siteSettings, setSiteSettings] = useState({
    title: 'М\'ЯСНИЙ КРАФТ',
    subtitle: 'Традиційні м\'ясні вироби за рецептами визвольного руху',
    bannerBadge: 'АРМІЙСЬКИЙ СТАНДАРТ',
    bannerTitle: 'СПРАВЖНЄ М\'ЯСО З ДИМКОМ ТА ВОЛЕЮ В СЕРЦІ',
    bannerDesc: 'Замовляйте свіжі делікатеси, натуральні ковбаси та соковите мариноване м\'ясо до вашого столу.',
    advantages: ['ЕКОЛОГІЧНО ЧИСТА СИРОВИНА', 'ВЛАСНЕ КОПТИЛЬНЕ ВИРОБНИЦТВО НА ДРОВАХ'],
    categories: DEFAULT_CATEGORIES,
    contactPhone: DEFAULT_PHONE,
    contactTelegram: DEFAULT_PHONE,
    contactWhatsapp: DEFAULT_PHONE_RAW,
    contactViber: DEFAULT_PHONE
  });

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('meat_store_cart') || '[]');
    } catch { return []; }
  });

  // Локальний стан обраної ваги для кожного товару на вітрині
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [activeTab, setActiveTab] = useState('shop');
  const [adminSubTab, setAdminSubTab] = useState('products');
  const [profileSubTab, setProfileSubTab] = useState('orders');
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

  const handleAuthChange = async (currentUser) => {
    setUser(currentUser);
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase();
      const hasAdminRights = ADMIN_EMAILS.includes(email);
      setIsAdmin(hasAdminRights);
      if (currentUser && !hasAdminRights) {
        setIsEditorMode(false);
      }

      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        let mergedCart = [...cart];
        let mergedFavs = [...favorites];

        if (profile) {
          if (Array.isArray(profile.cart) && profile.cart.length > 0) {
            const combinedMap = new Map();
            [...profile.cart, ...cart].forEach(item => {
              if (combinedMap.has(item.id)) {
                const existing = combinedMap.get(item.id);
                combinedMap.set(item.id, { ...existing, quantity: parseFloat((existing.quantity + item.quantity).toFixed(2)) });
              } else {
                combinedMap.set(item.id, item);
              }
            });
            mergedCart = Array.from(combinedMap.values());
          }

          if (Array.isArray(profile.favorites)) {
            mergedFavs = Array.from(new Set([...mergedFavs, ...profile.favorites]));
          }

          setCheckoutForm(prev => ({
            ...prev,
            name: profile.name || prev.name,
            phone: profile.phone || prev.phone,
            address: profile.address || prev.address
          }));
        }

        setCart(mergedCart);
        setFavorites(mergedFavs);
        localStorage.setItem('meat_store_cart', JSON.stringify(mergedCart));
        localStorage.setItem('meat_store_favs', JSON.stringify(mergedFavs));

        await supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email,
          cart: mergedCart,
          favorites: mergedFavs,
          updated_at: new Date().toISOString()
        });

        const { data: userOrders } = await supabase.from('orders').select('*').or(`user_id.eq.${currentUser.id},customer_email.eq.${currentUser.email}`).order('created_at', { ascending: false });
        if (userOrders) setMyOrders(userOrders);

      } catch (err) {
        console.error('Помилка завантаження профілю:', err);
      }
    } else {
      setIsAdmin(false);
      setIsEditorMode(false);
      setMyOrders([]);
    }
  };

  useEffect(() => {
    localStorage.setItem('meat_store_cart', JSON.stringify(cart));
    if (user) {
      supabase.from('profiles').update({ cart, updated_at: new Date().toISOString() }).eq('id', user.id).then();
    }
  }, [cart, user]);

  useEffect(() => {
    localStorage.setItem('meat_store_favs', JSON.stringify(favorites));
    if (user) {
      supabase.from('profiles').update({ favorites, updated_at: new Date().toISOString() }).eq('id', user.id).then();
    }
  }, [favorites, user]);

  const toggleFavorite = (productId) => {
    const isFav = favorites.includes(productId);
    const updated = isFav ? favorites.filter(id => id !== productId) : [...favorites, productId];
    setFavorites(updated);
    showToast(isFav ? 'Видалено з обраного' : 'Додано в обране! ❤️');
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
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
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
        let loadedAdvantages = ['ЕКОЛОГІЧНО ЧИСТА СИРОВИНА', 'ВЛАСНЕ КОПТИЛЬНЕ ВИРОБНИЦТВО НА ДРОВАХ'];
        if (Array.isArray(settData.advantages) && settData.advantages.length > 0) {
          loadedAdvantages = settData.advantages;
        }

        let loadedCategories = DEFAULT_CATEGORIES;
        if (Array.isArray(settData.categories) && settData.categories.length > 0) {
          loadedCategories = settData.categories;
        }

        setSiteSettings(prev => ({
          ...prev,
          title: settData.title || prev.title,
          subtitle: settData.subtitle || prev.subtitle,
          bannerBadge: settData.banner_badge || prev.bannerBadge,
          bannerTitle: settData.banner_title || prev.bannerTitle,
          bannerDesc: settData.banner_desc || prev.bannerDesc,
          advantages: loadedAdvantages,
          categories: loadedCategories,
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
        ...updated
      });
    }
  };

  // Переваги
  const handleAddAdvantage = async (textToCopy = 'НОВА ПЕРЕВАГА') => {
    const currentList = siteSettings.advantages || [];
    const updated = [...currentList, textToCopy];
    setSiteSettings(prev => ({ ...prev, advantages: updated }));
    showToast('Перевагу додано!', 'success');

    if (isAdmin) {
      await supabase.from('site_settings').upsert({ id: 1, ...siteSettings, advantages: updated });
    }
  };

  const handleUpdateAdvantage = async (index, newText) => {
    const currentList = [...(siteSettings.advantages || [])];
    currentList[index] = newText;
    setSiteSettings(prev => ({ ...prev, advantages: currentList }));

    if (isAdmin) {
      await supabase.from('site_settings').upsert({ id: 1, ...siteSettings, advantages: currentList });
    }
  };

  const handleDeleteAdvantage = async (index) => {
    const currentList = (siteSettings.advantages || []).filter((_, i) => i !== index);
    setSiteSettings(prev => ({ ...prev, advantages: currentList }));
    showToast('Перевагу видалено', 'info');

    if (isAdmin) {
      await supabase.from('site_settings').upsert({ id: 1, ...siteSettings, advantages: currentList });
    }
  };

  // Надійне збереження категорій у базі даних
  const saveCategoriesToDb = async (updatedCategories) => {
    if (!isAdmin) return;
    const { error } = await supabase.from('site_settings').upsert({
      id: 1,
      title: siteSettings.title,
      subtitle: siteSettings.subtitle,
      banner_badge: siteSettings.bannerBadge,
      banner_title: siteSettings.bannerTitle,
      banner_desc: siteSettings.bannerDesc,
      advantages: siteSettings.advantages,
      categories: updatedCategories,
      contact_phone: siteSettings.contactPhone,
      contact_telegram: siteSettings.contactTelegram,
      contact_whatsapp: siteSettings.contactWhatsapp,
      contact_viber: siteSettings.contactViber
    });

    if (error) {
      console.error('Помилка збереження категорій:', error);
      showToast(`Помилка збереження: ${error.message}`, 'error');
    }
  };

  const handleAddCategory = async (nameToCopy = 'Нова категорія') => {
    const currentList = siteSettings.categories || DEFAULT_CATEGORIES;
    const newCatId = 'cat_' + Date.now();
    const updated = [...currentList, { id: newCatId, name: nameToCopy }];
    setSiteSettings(prev => ({ ...prev, categories: updated }));
    showToast('Категорію додано!', 'success');
    await saveCategoriesToDb(updated);
  };

  const handleUpdateCategory = async (catId, newName) => {
    const currentList = (siteSettings.categories || DEFAULT_CATEGORIES).map(c => 
      c.id === catId ? { ...c, name: newName } : c
    );
    setSiteSettings(prev => ({ ...prev, categories: currentList }));
    await saveCategoriesToDb(currentList);
  };

  const handleDeleteCategory = async (catId) => {
    if (catId === 'all') return;
    const currentList = (siteSettings.categories || DEFAULT_CATEGORIES).filter(c => c.id !== catId);
    setSiteSettings(prev => ({ ...prev, categories: currentList }));
    if (selectedCategory === catId) setSelectedCategory('all');
    showToast('Категорію видалено', 'info');
    await saveCategoriesToDb(currentList);
  };

  // Товари
  const handleInlineProductUpdate = async (productId, field, value) => {
    const updatedProducts = products.map(p => p.id === productId ? { ...p, [field]: value } : p);
    setProducts(updatedProducts);

    const target = updatedProducts.find(p => p.id === productId);
    if (target) {
      await supabase.from('products').update({
        name: target.name,
        category: target.category,
        price: parseFloat(target.price) || 0,
        unit: target.unit,
        description: target.description,
        available: target.available,
        image: target.image
      }).eq('id', productId);
    }
  };

  const handleDirectProductPhotoUpload = async (productId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Завантаження фото...', 'info');
      const compressedBlob = await compressImage(file, 900, 0.75);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedBlob, { contentType: 'image/jpeg', cacheControl: '31536000' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      await handleInlineProductUpdate(productId, 'image', publicUrl);
      showToast('Фото оновлено!', 'success');
    } catch (err) {
      showToast(`Помилка: ${err.message}`, 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Завантаження фото...', 'info');
      const compressedBlob = await compressImage(file, 900, 0.75);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedBlob, { contentType: 'image/jpeg', cacheControl: '31536000' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setProductForm(prev => ({ ...prev, image: publicUrl }));
      showToast('Фото додано!', 'success');
    } catch (err) {
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
      showToast(`Помилка: ${error.message}`, 'error');
      return;
    }

    showToast(editingProduct ? 'Товар оновлено!' : 'Товар додано!');
    setEditingProduct(null);
    setProductForm({
      name: '', 
      category: (siteSettings.categories?.find(c => c.id !== 'all')?.id) || 'sausages', 
      price: '', 
      unit: 'кг',
      description: '', 
      image: '', 
      available: true, 
      weightStep: 0.1, 
      minWeight: 0.2
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
      status: 'new',
      user_id: user ? user.id : null,
      customer_email: user ? user.email : null
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) {
      showToast(`Помилка: ${error.message}`, 'error');
      return;
    }

    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: checkoutForm.name,
        phone: checkoutForm.phone,
        address: checkoutForm.address,
        cart: [],
        updated_at: new Date().toISOString()
      });
      setMyOrders(prev => [newOrder, ...prev]);
    }

    setLastPlacedOrder(newOrder);
    setCart([]);
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
           `🚚 *Доставка:* ${order.customer.deliveryType === 'pickup' ? 'Самовивіз' : 'Адресна (' + (order.customer.address || '-') + ')'}\n` +
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

  const availableCategoriesList = (siteSettings.categories || DEFAULT_CATEGORIES).filter(c => c.id !== 'all');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-28 md:pb-20 selection:bg-red-800 selection:text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-800 text-red-200' : 'bg-zinc-900/90 border-amber-500/30 text-amber-200'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-amber-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Верхня панель адміністратора */}
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
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  isEditorMode ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:text-white'
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-amber-600 flex items-center justify-center text-white font-serif text-2xl font-black shrink-0">
              М
            </div>
            <div>
              {isEditorMode ? (
                <input
                  value={siteSettings.title}
                  onChange={(e) => handleTextChange('title', e.target.value)}
                  className="bg-zinc-900 text-white font-bold text-lg font-serif border border-dashed border-amber-500 rounded px-1.5 py-0.5 focus:outline-none"
                />
              ) : (
                <h1 className="text-lg font-bold text-zinc-100 font-serif">{siteSettings.title}</h1>
              )}
              {isEditorMode ? (
                <input
                  value={siteSettings.subtitle}
                  onChange={(e) => handleTextChange('subtitle', e.target.value)}
                  className="bg-zinc-900 text-amber-500 text-xs border border-dashed border-amber-500 rounded px-1.5 py-0.5 block mt-1 focus:outline-none"
                />
              ) : (
                <p className="text-xs text-amber-500/90 font-medium">{siteSettings.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Десктопна навігація */}
            <nav className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('shop')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'shop' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                Вітрина
              </button>
              <button 
                onClick={() => setActiveTab('cart')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'cart' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
              >
                <ShoppingBag className="w-4 h-4" />
                Кошик {cart.length > 0 && `(${cart.length})`}
              </button>

              {user && (
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'profile' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  <User className="w-4 h-4" />
                  Кабінет
                </button>
              )}

              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('admin')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  Керування
                </button>
              )}
            </nav>

            {user ? (
              <div className="flex items-center gap-2 bg-zinc-900 py-1.5 px-3 rounded-xl border border-zinc-800">
                <span 
                  onClick={() => setActiveTab('profile')} 
                  className="text-xs text-zinc-300 font-mono hidden sm:inline cursor-pointer hover:text-amber-400 transition-colors"
                  title="Відкрити кабінет"
                >
                  {user.email}
                </span>
                <button onClick={handleLogout} title="Вийти" className="text-zinc-500 hover:text-red-400 p-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleLogin} 
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-zinc-800 transition-all"
              >
                <LogIn className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Увійти через Gmail</span>
                <span className="sm:hidden">Увійти</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Головний контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* 1. ВІТРИНА */}
        {activeTab === 'shop' && (
          <div>
            {/* Банер */}
            <div className="rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 border border-zinc-900 p-8 sm:p-12 mb-10 shadow-2xl relative">
              <div className="relative z-10 max-w-3xl">
                {isEditorMode ? (
                  <input
                    value={siteSettings.bannerBadge}
                    onChange={(e) => handleTextChange('bannerBadge', e.target.value)}
                    className="bg-zinc-900 text-red-400 border border-dashed border-amber-500 rounded px-2.5 py-1 text-xs font-bold uppercase focus:outline-none"
                  />
                ) : (
                  <span className="px-3.5 py-1.5 bg-red-950/60 border border-red-800/60 text-red-400 rounded-full text-xs font-bold uppercase">
                    {siteSettings.bannerBadge}
                  </span>
                )}

                {isEditorMode ? (
                  <textarea
                    value={siteSettings.bannerTitle}
                    onChange={(e) => handleTextChange('bannerTitle', e.target.value)}
                    className="w-full bg-zinc-900 text-white text-3xl sm:text-4xl font-black mt-4 mb-3 font-serif border border-dashed border-amber-500 rounded p-2 focus:outline-none resize-none h-28"
                  />
                ) : (
                  <h2 className="text-3xl sm:text-5xl font-black mt-5 mb-3 font-serif leading-tight text-white">
                    {siteSettings.bannerTitle}
                  </h2>
                )}

                {isEditorMode ? (
                  <textarea
                    value={siteSettings.bannerDesc}
                    onChange={(e) => handleTextChange('bannerDesc', e.target.value)}
                    className="w-full bg-zinc-900 text-zinc-300 text-sm border border-dashed border-amber-500 rounded p-2 focus:outline-none resize-none h-20"
                  />
                ) : (
                  <p className="text-zinc-400 text-sm sm:text-base mb-6 leading-relaxed">
                    {siteSettings.bannerDesc}
                  </p>
                )}

                {/* Переваги */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold tracking-wider uppercase text-zinc-300 pt-3">
                  {(siteSettings.advantages || []).map((adv, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 bg-zinc-900/90 px-3.5 py-2 rounded-xl border border-zinc-800 shadow-sm transition-all"
                    >
                      <span className="text-amber-500 font-bold">✓</span>
                      {isEditorMode ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={adv}
                            onChange={(e) => handleUpdateAdvantage(idx, e.target.value)}
                            className="bg-zinc-950 text-amber-400 border border-dashed border-amber-500/70 rounded px-2 py-1 text-xs font-bold focus:outline-none min-w-[200px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAdvantage(adv)}
                            title="Дублювати"
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdvantage(idx)}
                            title="Видалити"
                            className="p-1 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>{adv}</span>
                      )}
                    </div>
                  ))}

                  {isEditorMode && (
                    <button
                      type="button"
                      onClick={() => handleAddAdvantage('НОВА ПЕРЕВАГА')}
                      className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Додати перевагу
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Пошук та Динамічні категорії */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
              <div className="relative w-full sm:w-80 shrink-0">
                <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Пошук балика, ковбаси чи стейка..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Панель категорій */}
              <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-none">
                {(siteSettings.categories || DEFAULT_CATEGORIES).map(cat => {
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div key={cat.id} className="relative shrink-0 flex items-center">
                      {isEditorMode ? (
                        <div className="flex items-center gap-1 bg-zinc-900 border border-dashed border-amber-500/60 p-1 rounded-xl">
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => handleUpdateCategory(cat.id, e.target.value)}
                            className="bg-zinc-950 text-amber-400 text-xs font-bold px-2 py-1.5 rounded-lg focus:outline-none w-28 text-center"
                          />
                          {cat.id !== 'all' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAddCategory(cat.name)}
                                title="Дублювати категорію"
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 rounded"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                title="Видалити категорію"
                                className="p-1 hover:bg-red-950 text-zinc-500 hover:text-red-400 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md shadow-amber-500/10' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      )}
                    </div>
                  );
                })}

                {isEditorMode && (
                  <button
                    type="button"
                    onClick={() => handleAddCategory('Нова категорія')}
                    className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-dashed border-amber-500/50 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Категорія
                  </button>
                )}
              </div>
            </div>

            {/* Сітка товарів */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => {
                const isFav = favorites.includes(p.id);

                return (
                  <div key={p.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-850 flex flex-col justify-between shadow-xl relative group">
                    <div className="h-56 bg-zinc-950 relative overflow-hidden">
                      <img src={formatImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                      
                      <button
                        onClick={() => toggleFavorite(p.id)}
                        className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md border transition-all z-10 ${
                          isFav 
                            ? 'bg-red-950/80 border-red-500/50 text-red-500 scale-110 shadow-lg' 
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-red-400 hover:scale-105'
                        }`}
                        title={isFav ? "В обраному" : "Додати в обране"}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                      </button>

                      {isEditorMode && (
                        <label 
                          htmlFor={`photo-upload-${p.id}`}
                          className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer text-amber-400 hover:text-white transition-all font-bold text-xs gap-2"
                        >
                          <Upload className="w-6 h-6" />
                          <span>Змінити фото</span>
                          <input 
                            id={`photo-upload-${p.id}`}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleDirectProductPhotoUpload(p.id, e)}
                          />
                        </label>
                      )}

                      {!p.available && !isEditorMode && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center font-bold text-xs uppercase tracking-wider text-red-400">
                          Немає в наявності
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {isEditorMode ? (
                          <div className="space-y-2">
                            <input
                              value={p.name}
                              onChange={(e) => handleInlineProductUpdate(p.id, 'name', e.target.value)}
                              className="w-full bg-zinc-950 text-white font-bold font-serif text-base border border-dashed border-amber-500 rounded p-1.5 focus:outline-none"
                              placeholder="Назва товару"
                            />
                            
                            <select
                              value={p.category}
                              onChange={(e) => handleInlineProductUpdate(p.id, 'category', e.target.value)}
                              className="w-full bg-zinc-950 text-amber-400 text-xs font-bold border border-dashed border-amber-500 rounded p-1.5 focus:outline-none"
                            >
                              {availableCategoriesList.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>

                            <textarea
                              value={p.description || ''}
                              onChange={(e) => handleInlineProductUpdate(p.id, 'description', e.target.value)}
                              className="w-full bg-zinc-950 text-zinc-300 text-xs border border-dashed border-amber-500 rounded p-1.5 focus:outline-none resize-none h-16"
                              placeholder="Опис товару"
                            />
                            <label className="flex items-center gap-2 text-xs font-bold text-amber-500 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={p.available}
                                onChange={(e) => handleInlineProductUpdate(p.id, 'available', e.target.checked)}
                                className="rounded"
                              />
                              В наявності на вітрині
                            </label>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-bold font-serif text-white">{p.name}</h3>
                            <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">{p.description}</p>
                          </>
                        )}
                      </div>

                      {/* Інтерактивний вибір ваги та кнопка додавання */}
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        {isEditorMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={p.price}
                              onChange={(e) => handleInlineProductUpdate(p.id, 'price', e.target.value)}
                              className="w-20 bg-zinc-950 text-amber-400 font-bold font-serif text-lg border border-dashed border-amber-500 rounded p-1 focus:outline-none"
                            />
                            <select
                              value={p.unit}
                              onChange={(e) => handleInlineProductUpdate(p.id, 'unit', e.target.value)}
                              className="bg-zinc-950 text-zinc-300 text-xs border border-dashed border-amber-500 rounded p-1"
                            >
                              <option value="кг">грн/кг</option>
                              <option value="шт">грн/шт</option>
                              <option value="уп">грн/уп</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Базова ціна за одиницю та розрахунок */}
                            <div className="flex justify-between items-baseline">
                              <div className="text-xl font-black font-serif text-white">
                                {p.price} <span className="text-xs font-sans text-zinc-400 font-normal">грн/{p.unit}</span>
                              </div>
                              
                              {p.available && (
                                <div className="text-sm font-bold text-amber-500 font-serif">
                                  ≈ {((selectedQuantities[p.id] ?? (p.unit === 'кг' ? 0.3 : 1)) * p.price).toFixed(2)} грн
                                </div>
                              )}
                            </div>

                            {p.available && (
                              <>
                                {/* Селектор для вагової продукції (кг) */}
                                {p.unit === 'кг' ? (
                                  <div className="space-y-2">
                                    {/* Швидкі кнопки пресетів ваги */}
                                    <div className="grid grid-cols-4 gap-1">
                                      {[
                                        { label: '200г', val: 0.2 },
                                        { label: '300г', val: 0.3 },
                                        { label: '500г', val: 0.5 },
                                        { label: '1кг', val: 1.0 }
                                      ].map(preset => {
                                        const currentVal = selectedQuantities[p.id] ?? 0.3;
                                        const isActive = Math.abs(currentVal - preset.val) < 0.01;
                                        return (
                                          <button
                                            key={preset.val}
                                            type="button"
                                            onClick={() => setSelectedQuantities(prev => ({ ...prev, [p.id]: preset.val }))}
                                            className={`py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                              isActive 
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                          >
                                            {preset.label}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Точне налаштування ваги - / + та кнопка додати */}
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800 p-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = selectedQuantities[p.id] ?? 0.3;
                                            const next = Math.max(0.1, parseFloat((current - 0.1).toFixed(2)));
                                            setSelectedQuantities(prev => ({ ...prev, [p.id]: next }));
                                          }}
                                          className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm"
                                        >
                                          −
                                        </button>
                                        <span className="w-14 text-center text-xs font-bold font-mono text-zinc-200">
                                          {(selectedQuantities[p.id] ?? 0.3) >= 1 
                                            ? `${selectedQuantities[p.id] ?? 0.3} кг` 
                                            : `${Math.round(((selectedQuantities[p.id] ?? 0.3) * 1000))} г`}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = selectedQuantities[p.id] ?? 0.3;
                                            const next = parseFloat((current + 0.1).toFixed(2));
                                            setSelectedQuantities(prev => ({ ...prev, [p.id]: next }));
                                          }}
                                          className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm"
                                        >
                                          +
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const qtyToAdd = selectedQuantities[p.id] ?? 0.3;
                                          const existing = cart.find(item => item.id === p.id);
                                          if (existing) {
                                            setCart(cart.map(i => i.id === p.id 
                                              ? { ...i, quantity: parseFloat((i.quantity + qtyToAdd).toFixed(2)) } 
                                              : i
                                            ));
                                          } else {
                                            setCart([...cart, { ...p, quantity: qtyToAdd }]);
                                          }
                                          showToast(`Додано: "${p.name}" (${qtyToAdd >= 1 ? qtyToAdd + ' кг' : Math.round(qtyToAdd * 1000) + ' г'})`);
                                        }}
                                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/10"
                                      >
                                        <ShoppingBag className="w-4 h-4" /> Додати
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Селектор для штучних товарів (шт/уп) */
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800 p-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const current = selectedQuantities[p.id] ?? 1;
                                          const next = Math.max(1, current - 1);
                                          setSelectedQuantities(prev => ({ ...prev, [p.id]: next }));
                                        }}
                                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm"
                                      >
                                        −
                                      </button>
                                      <span className="w-12 text-center text-xs font-bold font-mono text-zinc-200">
                                        {selectedQuantities[p.id] ?? 1} {p.unit}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const current = selectedQuantities[p.id] ?? 1;
                                          setSelectedQuantities(prev => ({ ...prev, [p.id]: current + 1 }));
                                        }}
                                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm"
                                      >
                                        +
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const qtyToAdd = selectedQuantities[p.id] ?? 1;
                                        const existing = cart.find(item => item.id === p.id);
                                        if (existing) {
                                          setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + qtyToAdd } : i));
                                        } else {
                                          setCart([...cart, { ...p, quantity: qtyToAdd }]);
                                        }
                                        showToast(`Додано: "${p.name}" (${qtyToAdd} ${p.unit})`);
                                      }}
                                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/10"
                                    >
                                      <ShoppingBag className="w-4 h-4" /> Додати
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. КОШИК */}
        {activeTab === 'cart' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif mb-6">Ваш кошик</h2>
            {cart.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-850">
                <ShoppingBag className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 text-base mb-4">Кошик порожній.</p>
                <button onClick={() => setActiveTab('shop')} className="bg-amber-500 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs">
                  Перейти до покупок
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <span className="text-xs text-zinc-400">
                          {item.unit === 'кг' && item.quantity < 1 
                            ? `${Math.round(item.quantity * 1000)} г` 
                            : `${item.quantity} ${item.unit}`} × {item.price} грн/{item.unit}
                        </span>
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
                  <input
                    placeholder="Адреса доставки (місто, вулиця)"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-sm"
                  />
                  <button type="submit" className="w-full bg-amber-500 text-zinc-950 font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-lg active:scale-95 transition-all">
                    Підтвердити замовлення
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. ОСОБИСТИЙ КАБІНЕТ КЛІЄНТА */}
        {activeTab === 'profile' && user && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif text-white">{checkoutForm.name || 'Особистий кабінет'}</h2>
                  <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setProfileSubTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${profileSubTab === 'orders' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  Мої замовлення ({myOrders.length})
                </button>
                <button
                  onClick={() => setProfileSubTab('favorites')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${profileSubTab === 'favorites' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  Обране ({favorites.length})
                </button>
              </div>
            </div>

            {profileSubTab === 'orders' && (
              <div className="space-y-4">
                {myOrders.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">У вас ще немає оформлених замовлень.</p>
                  </div>
                ) : (
                  myOrders.map(ord => (
                    <div key={ord.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800 pb-3 font-mono">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white text-base">{ord.id}</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              ord.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {ord.status === 'completed' ? 'Виконано' : 'Обробляється'}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 block mt-1">{ord.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-amber-500 font-serif">{ord.total.toFixed(2)} грн</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-400">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{it.name} × {it.unit === 'кг' && it.quantity < 1 ? `${Math.round(it.quantity * 1000)} г` : `${it.quantity} ${it.unit}`}</span>
                            <span className="font-mono">{(it.quantity * it.price).toFixed(2)} грн</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileSubTab === 'favorites' && (
              <div>
                {favorites.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">Ви ще не додали жодного товару в обране.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.filter(p => favorites.includes(p.id)).map(p => (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={formatImageUrl(p.image)} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                          <div>
                            <h4 className="font-bold text-sm text-white font-serif">{p.name}</h4>
                            <span className="text-xs text-amber-500 font-bold">{p.price} грн/{p.unit}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const qtyToAdd = selectedQuantities[p.id] ?? (p.unit === 'кг' ? 0.3 : 1);
                            const existing = cart.find(item => item.id === p.id);
                            if (existing) {
                              setCart(cart.map(i => i.id === p.id ? { ...i, quantity: parseFloat((i.quantity + qtyToAdd).toFixed(2)) } : i));
                            } else {
                              setCart([...cart, { ...p, quantity: qtyToAdd }]);
                            }
                            showToast(`"${p.name}" додано до кошика!`);
                          }}
                          className="p-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold transition-all"
                          title="Додати в кошик"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. АДМІНКА */}
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
                      {availableCategoriesList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
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
                      placeholder="URL фото або завантажте файл"
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
                        onClick={() => { setEditingProduct(null); setProductForm({ name: '', category: (siteSettings.categories?.find(c => c.id !== 'all')?.id) || 'sausages', price: '', unit: 'кг', description: '', image: '', available: true, weightStep: 0.1, minWeight: 0.2 }); }} 
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
                    <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-2xl border border-zinc-855">
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
                          <div key={idx}>• {item.name} ({item.unit === 'кг' && item.quantity < 1 ? `${Math.round(item.quantity * 1000)} г` : `${item.quantity} ${item.unit}`})</div>
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

      {/* Модалка підтвердження замовлення */}
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

      {/* Плаваюче меню зв'язку */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
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

      {/* Мобільна нижня панель навігації */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-900 px-3 py-2 flex justify-around items-center">
        <button 
          onClick={() => setActiveTab('shop')} 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'shop' ? 'text-amber-500' : 'text-zinc-400'}`}
        >
          <span className="p-1 rounded-xl bg-zinc-900 border border-zinc-800">🥩</span>
          Вітрина
        </button>

        <button 
          onClick={() => setActiveTab('cart')} 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold relative transition-colors ${activeTab === 'cart' ? 'text-amber-500' : 'text-zinc-400'}`}
        >
          <div className="relative p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <ShoppingBag className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          Кошик
        </button>

        {user && (
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'profile' ? 'text-amber-500' : 'text-zinc-400'}`}
          >
            <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <User className="w-4 h-4" />
            </div>
            Кабінет
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => setActiveTab('admin')} 
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'admin' ? 'text-amber-500' : 'text-zinc-400'}`}
          >
            <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <Settings className="w-4 h-4" />
            </div>
            Керування
          </button>
        )}
      </div>
    </div>
  );
}
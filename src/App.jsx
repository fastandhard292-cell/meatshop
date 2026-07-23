// ... existing code ...
const formatImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1602491453979-53a99888ecf1?auto=format&fit=crop&q=80&w=600';
  let cleanUrl = url.trim();
  
  // Якщо це файл, завантажений напряму з пристрою (Base64)
  if (cleanUrl.startsWith('data:image/')) {
    return cleanUrl;
  }

  // Конвертація посилань Google Диску виду: /file/d/FILE_ID/view?usp=sharing
  const gdriveFileMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
// ... existing code ...
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

  // Обробник завантаження фото з пристрою (ПК або телефон)
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      setPreviewImageError(false);
      setProductForm(prev => ({ ...prev, image: base64Url }));
      showToast('Фото успішно завантажено з пристрою!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const [checkoutForm, setCheckoutForm] = useState({
// ... existing code ...
                    {/* Поле зображення з розумною обробкою посилань */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2 flex items-center justify-between">
                        <span>Посилання на фото (Google Drive чи веб-лінк)</span>
                        <label 
                          htmlFor="local-file-upload"
                          className="flex items-center gap-1.5 cursor-pointer text-amber-500 hover:text-amber-400 transition-all bg-zinc-800 hover:bg-zinc-750 px-2.5 py-1 rounded-lg border border-amber-500/30 text-[11px] font-bold shadow-sm active:scale-95"
                          title="Обрати фото з комп'ютера чи галереї телефону"
                        >
                          <ImageIcon className="w-4 h-4 text-amber-500" />
                          <span>З пристрою 📁</span>
                        </label>
                      </label>
                      <input 
                        id="local-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <input
                        type="url"
                        value={productForm.image}
                        onChange={(e) => {
                          setPreviewImageError(false);
                          setProductForm({...productForm, image: e.target.value});
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        placeholder="Вставте посилання з Google Диску або оберіть файл з пристрою..."
                      />
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        💡 Можна вставити посилання з Google Диску або натиснути <b>«З пристрою 📁»</b> і вибрати будь-яку фотографію з вашого ПК чи смартфона!
                      </p>

                      {/* Попередній перегляд картинки в режимі реального часу */}
// ... existing code ...
```
eof

Тепер при натисканні на значок картинки або плашку **«З пристрою 📁»** відкривається вибір файлів з вашого смартфона або ПК, а обране фото одразу підтягується в картку товару!

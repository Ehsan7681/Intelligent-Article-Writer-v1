// متغیرهای سراسری
let selectedModel = null;
let uploadedSamples = [];
let allModels = []; // نگهداری همه مدل‌های بارگزاری شده
let searchHistory = []; // نگهداری تاریخچه جستجو
const MAX_SAMPLES = 10;
const MAX_SEARCH_HISTORY = 5; // حداکثر تعداد جستجوهای ذخیره شده

// متغیرهای مربوط به نصب برنامه
let deferredPrompt;
const installButton = document.getElementById('installApp');
const iOSInstallTip = document.getElementById('iOSInstallTip');

// متغیر دکمه تغییر حالت روشن/تاریک
let themeToggleBtn = document.getElementById('theme-toggle');

// دریافت المان‌ها
const modelStatusEl = document.getElementById('modelStatus');
const modelSelectEl = document.getElementById('modelSelect');
const modelSearchEl = document.getElementById('modelSearch');
const historyTagsEl = document.getElementById('historyTags');
const confirmModelBtn = document.getElementById('confirmModel');
const refreshModelsBtn = document.getElementById('refreshModels');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const sampleFilesInput = document.getElementById('sampleFiles');
const filesCountEl = document.getElementById('filesCount');
const uploadSamplesBtn = document.getElementById('uploadSamples');
const articleTopicInput = document.getElementById('articleTopic');
const articleKeywordsInput = document.getElementById('articleKeywords');
const languageRadios = document.querySelectorAll('input[name="language"]');
const articleSizeRadios = document.querySelectorAll('input[name="articleSize"]');
const wordCountInput = document.getElementById('wordCount');
const generateArticleBtn = document.getElementById('generateArticle');
const articleContentEl = document.getElementById('article-content');
const copyArticleBtn = document.getElementById('copyBtn');
const saveAsWordBtn = document.getElementById('saveAsWordBtn');
const uploadProgressEl = document.getElementById('uploadProgress');
const uploadProgressFillEl = document.getElementById('uploadProgressFill');
const uploadProgressTextEl = document.getElementById('uploadProgressText');
const generationProgressEl = document.getElementById('generation-progress');
const generationProgressFillEl = document.getElementById('generation-progress-fill');
const generationProgressTextEl = document.getElementById('generation-progress-text');
const sampleCountInput = document.getElementById('sampleCount') || { value: '5' }; // اگر وجود نداشت، مقدار پیش‌فرض ۵

// بررسی و بارگذاری داده‌های ذخیره شده
document.addEventListener('DOMContentLoaded', () => {
    console.log('صفحه بارگذاری شد، در حال تنظیم المان‌ها...');
    
    // بازیابی مجدد دکمه تغییر حالت برای اطمینان
    themeToggleBtn = document.getElementById('theme-toggle');
    console.log('وضعیت دکمه تغییر حالت:', themeToggleBtn ? 'یافت شد' : 'یافت نشد');
    
    // بارگزاری کلید API
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        fetchModels();
    }
    
    // بارگزاری آخرین مدل انتخاب شده
    const lastSelectedModel = localStorage.getItem('last_selected_model');
    if (lastSelectedModel) {
        selectedModel = lastSelectedModel;
    }
    
    // بارگزاری تاریخچه جستجو
    const savedSearchHistory = localStorage.getItem('search_history');
    if (savedSearchHistory) {
        searchHistory = JSON.parse(savedSearchHistory);
        updateSearchHistoryUI();
    }
    
    // تنظیم حالت ذخیره شده یا پیش‌فرض
    setupTheme();
    
    // تنظیم رویدادهای فرم
    setupEventListeners();

    // بررسی وضعیت نصب PWA
    checkInstallState();
});

// تنظیم حالت روشن/تاریک
function setupTheme() {
    // بررسی حالت ذخیره شده در localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.className = savedTheme + '-mode';
    
    // اگر دکمه تغییر حالت وجود داشته باشد، رویداد کلیک را تنظیم کنید
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// تغییر حالت بین روشن و تاریک
function toggleTheme() {
    console.log('تغییر حالت فراخوانی شد.');
    
    const currentTheme = document.documentElement.className;
    let newTheme;
    
    if (currentTheme === 'light-mode') {
        newTheme = 'dark-mode';
        console.log('تغییر به حالت تاریک');
    } else {
        newTheme = 'light-mode';
        console.log('تغییر به حالت روشن');
    }
    
    // ذخیره حالت جدید در localStorage
    localStorage.setItem('theme', newTheme.replace('-mode', ''));
    
    // اعمال حالت جدید
    document.documentElement.className = newTheme;
    
    // بازخوانی تنظیمات تم
    setTimeout(() => {
        document.body.style.transition = 'none';
        document.body.offsetHeight; // Trigger a reflow
        document.body.style.transition = 'background 0.3s ease-in-out, color 0.3s ease-in-out';
        console.log('تم با موفقیت تغییر کرد');
    }, 50);
}

// تنظیم گوش‌دهنده‌های رویداد
function setupEventListeners() {
    // ذخیره کلید API
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openrouter_api_key', apiKey);
            fetchModels();
        } else {
            alert('لطفاً کلید API را وارد کنید');
        }
    });
    
    // بازخوانی لیست مدل‌ها
    refreshModelsBtn.addEventListener('click', fetchModels);
    
    // جستجوی مدل‌ها
    modelSearchEl.addEventListener('input', filterModels);
    
    // اضافه کردن جستجو به تاریخچه با enter
    modelSearchEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && modelSearchEl.value.trim() !== '') {
            addToSearchHistory(modelSearchEl.value.trim());
        }
    });
    
    // انتخاب مدل از لیست کشویی
    modelSelectEl.addEventListener('change', () => {
        selectedModel = modelSelectEl.value;
        // ذخیره مدل انتخاب شده
        if (selectedModel) {
            localStorage.setItem('last_selected_model', selectedModel);
        }
    });
    
    // تایید مدل انتخاب شده
    confirmModelBtn.addEventListener('click', () => {
        if (!selectedModel) {
            alert('لطفاً یک مدل را انتخاب کنید');
            return;
        }
        
        // ذخیره مدل انتخاب شده
        localStorage.setItem('last_selected_model', selectedModel);
        
        // اضافه کردن به تاریخچه جستجو اگر جستجویی انجام شده است
        if (modelSearchEl.value.trim() !== '') {
            addToSearchHistory(modelSearchEl.value.trim());
        }
        
        alert(`مدل "${selectedModel}" با موفقیت انتخاب شد`);
    });
    
    // انتخاب فایل‌های نمونه
    sampleFilesInput.addEventListener('change', updateFilesList);
    
    // بارگذاری فایل‌های نمونه
    uploadSamplesBtn.addEventListener('click', () => {
        if (sampleFilesInput.files.length === 0) {
            alert('لطفاً حداقل یک فایل نمونه انتخاب کنید');
            return;
        }
        
        uploadSamples();
    });
    
    // تولید مقاله
    generateArticleBtn.addEventListener('click', generateArticle);
    
    // کپی مقاله
    copyArticleBtn.addEventListener('click', () => {
        const content = articleContentEl.innerText;
        if (content && !content.includes('مقاله‌ای تولید نشده است')) {
            navigator.clipboard.writeText(content)
                .then(() => alert('مقاله با موفقیت کپی شد'))
                .catch(err => alert('خطا در کپی مقاله: ' + err));
        }
    });
    
    // دانلود مقاله به صورت Word
    saveAsWordBtn.addEventListener('click', saveAsWord);

    // تنظیم تعداد کلمات بر اساس اندازه انتخاب شده
    articleSizeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            switch(radio.value) {
                case 'short':
                    wordCountInput.value = '400';
                    break;
                case 'medium':
                    wordCountInput.value = '750';
                    break;
                case 'long':
                    wordCountInput.value = '1500';
                    break;
            }
        });
    });

    // تنظیم اندازه مقاله بر اساس تعداد کلمات وارد شده
    wordCountInput.addEventListener('input', () => {
        const count = parseInt(wordCountInput.value);
        if (count >= 300 && count <= 500) {
            document.querySelector('input[name="articleSize"][value="short"]').checked = true;
        } else if (count >= 600 && count <= 900) {
            document.querySelector('input[name="articleSize"][value="medium"]').checked = true;
        } else if (count >= 1000 && count <= 2000) {
            document.querySelector('input[name="articleSize"][value="long"]').checked = true;
        }
    });
}

// فیلتر کردن مدل‌ها براساس جستجو
function filterModels() {
    const searchTerm = modelSearchEl.value.trim().toLowerCase();
    
    if (!allModels.length) return;
    
    if (!searchTerm) {
        // نمایش همه مدل‌ها
        displayModels(allModels);
        return;
    }
    
    // فیلتر مدل‌ها براساس عبارت جستجو
    const filteredModels = allModels.filter(model => {
        const modelName = (model.name || model.id).toLowerCase();
        return modelName.includes(searchTerm);
    });
    
    displayModels(filteredModels);
}

// اضافه کردن جستجو به تاریخچه
function addToSearchHistory(searchTerm) {
    // اگر جستجو تکراری است، آن را حذف کنیم تا دوباره در انتهای لیست اضافه شود
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== searchTerm.toLowerCase());
    
    // اضافه کردن جستجوی جدید
    searchHistory.unshift(searchTerm);
    
    // محدود کردن تعداد جستجوها
    if (searchHistory.length > MAX_SEARCH_HISTORY) {
        searchHistory = searchHistory.slice(0, MAX_SEARCH_HISTORY);
    }
    
    // ذخیره تاریخچه جستجو
    localStorage.setItem('search_history', JSON.stringify(searchHistory));
    
    // بروزرسانی UI
    updateSearchHistoryUI();
}

// به‌روزرسانی نمایش تاریخچه جستجو
function updateSearchHistoryUI() {
    historyTagsEl.innerHTML = '';
    
    if (searchHistory.length === 0) {
        historyTagsEl.innerHTML = '<span class="no-history">تاریخچه‌ای وجود ندارد</span>';
        return;
    }
    
    searchHistory.forEach((term, index) => {
        const tag = document.createElement('div');
        tag.className = 'history-tag';
        tag.innerHTML = `
            <button class="remove-tag" data-index="${index}">&times;</button>
            <span>${term}</span>
        `;
        
        // اضافه کردن رویداد کلیک برای استفاده از جستجوی قبلی
        tag.addEventListener('click', (e) => {
            // اگر روی دکمه حذف کلیک شد، جستجو را اعمال نکنیم
            if (e.target.classList.contains('remove-tag')) return;
            
            modelSearchEl.value = term;
            filterModels();
        });
        
        historyTagsEl.appendChild(tag);
    });
    
    // اضافه کردن رویداد کلیک برای دکمه‌های حذف
    document.querySelectorAll('.remove-tag').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // جلوگیری از رویداد کلیک والد
            const index = parseInt(e.target.dataset.index);
            
            // حذف از تاریخچه
            searchHistory.splice(index, 1);
            localStorage.setItem('search_history', JSON.stringify(searchHistory));
            
            // بروزرسانی UI
            updateSearchHistoryUI();
        });
    });
}

// دریافت لیست مدل‌ها از OpenRouter
async function fetchModels() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        modelStatusEl.innerText = 'کلید API وارد نشده است. لطفاً کلید API را وارد کنید.';
        return;
    }
    
    modelStatusEl.innerText = 'در حال دریافت لیست مدل‌ها...';
    modelSelectEl.innerHTML = '<option value="">-- یک مدل انتخاب کنید --</option>';
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطا در دریافت مدل‌ها: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            modelStatusEl.innerText = `${data.data.length} مدل یافت شد`;
            allModels = data.data; // ذخیره همه مدل‌ها
            
            // اگر عبارت جستجویی وجود دارد، فیلتر کنیم، در غیر این صورت همه را نمایش دهیم
            if (modelSearchEl.value.trim()) {
                filterModels();
            } else {
                displayModels(allModels);
            }
        } else {
            modelStatusEl.innerText = 'هیچ مدلی یافت نشد';
        }
    } catch (error) {
        modelStatusEl.innerText = error.message || 'خطا در دریافت مدل‌ها';
        console.error('Error fetching models:', error);
    }
}

// نمایش مدل‌ها در لیست کشویی
function displayModels(models) {
    // ابتدا لیست را خالی می‌کنیم به جز گزینه پیش‌فرض
    modelSelectEl.innerHTML = '<option value="">-- یک مدل انتخاب کنید --</option>';
    
    // مدل‌ها را مرتب می‌کنیم براساس نام
    models.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        
        // نمایش نام مدل و تعداد توکن‌ها (اگر موجود باشد)
        const tokenCount = model.context_length || model.contextLength || '';
        const tokenText = tokenCount ? ` (${tokenCount} توکن)` : '';
        
        option.textContent = `${model.name || model.id}${tokenText}`;
        
        modelSelectEl.appendChild(option);
    });
    
    // اگر مدلی قبلاً انتخاب شده، آن را مجدداً انتخاب می‌کنیم
    if (selectedModel) {
        modelSelectEl.value = selectedModel;
    }
}

// به‌روزرسانی لیست فایل‌های انتخاب شده
function updateFilesList() {
    const files = sampleFilesInput.files;
    
    if (files.length > MAX_SAMPLES) {
        alert(`حداکثر ${MAX_SAMPLES} فایل می‌توانید انتخاب کنید`);
        sampleFilesInput.value = '';
        filesCountEl.textContent = '0';
        return;
    }
    
    filesCountEl.textContent = files.length;
    
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = `<p>فایل‌های انتخاب شده: <span id="filesCount">${files.length}</span></p>`;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${file.name}</span>
            <small>(${(file.size / 1024).toFixed(2)} KB)</small>
        `;
        filesList.appendChild(fileItem);
    }
}

// بارگذاری فایل‌های نمونه
function uploadSamples() {
    const files = sampleFilesInput.files;
    if (files.length === 0) {
        alert('لطفاً حداقل یک فایل نمونه انتخاب کنید');
        return;
    }

    uploadedSamples = [];
    
    // نمایش نوار پیشرفت
    uploadProgressEl.style.display = 'block';
    uploadProgressFillEl.style.width = '0%';
    uploadProgressTextEl.textContent = 'در حال بارگذاری...';
    
    let processedFiles = 0;
    
    // برای جلوگیری از زمان‌بر شدن، حداکثر 10 فایل را می‌پذیریم
    const filesToProcess = Array.from(files).slice(0, MAX_SAMPLES);
    
    for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        
        // خواندن محتوای فایل‌ها
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileName = file.name;
            const fileContent = e.target.result;
            
            // افزودن به آرایه نمونه‌ها
            uploadedSamples.push({
                name: fileName,
                content: typeof fileContent === 'string' ? fileContent : 'فایل باینری (قابل نمایش نیست)',
                type: file.type
            });
            
            processedFiles++;
            
            // به‌روزرسانی پیشرفت
            const progress = Math.round((processedFiles / filesToProcess.length) * 100);
            uploadProgressFillEl.style.width = `${progress}%`;
            uploadProgressTextEl.textContent = `در حال بارگذاری... ${processedFiles} از ${filesToProcess.length} فایل`;
            
            // اگر همه فایل‌ها پردازش شدند
            if (processedFiles === filesToProcess.length) {
                uploadProgressTextEl.textContent = 'بارگذاری با موفقیت انجام شد';
                console.log(`${processedFiles} فایل بارگذاری شد:`, uploadedSamples);
                setTimeout(() => {
                    uploadProgressEl.style.display = 'none';
                    alert(`${processedFiles} فایل با موفقیت بارگذاری شد`);
                }, 1000);
            }
        };
        
        reader.onerror = function(e) {
            console.error('خطا در خواندن فایل:', file.name, e);
            processedFiles++;
            
            // به‌روزرسانی پیشرفت حتی در صورت خطا
            const progress = Math.round((processedFiles / filesToProcess.length) * 100);
            uploadProgressFillEl.style.width = `${progress}%`;
            uploadProgressTextEl.textContent = `خطا در خواندن فایل ${file.name}`;
            
            if (processedFiles === filesToProcess.length) {
                uploadProgressTextEl.textContent = 'بارگذاری با خطا مواجه شد';
                setTimeout(() => {
                    uploadProgressEl.style.display = 'none';
                }, 1000);
            }
        };
        
        // روش خواندن فایل بر اساس نوع آن
        try {
            if (file.type.includes('pdf')) {
                reader.readAsArrayBuffer(file);
            } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        } catch (error) {
            console.error('خطا در شروع خواندن فایل:', file.name, error);
            processedFiles++;
        }
    }
}

// تابع تولید مقاله با سیستم گسترش بخش به بخش
async function generateArticle() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("لطفاً کلید API را وارد کنید.");
        return;
    }

    if (!selectedModel) {
        alert("لطفاً یک مدل هوش مصنوعی را انتخاب کنید.");
        return;
    }

    const topic = articleTopicInput.value.trim();
    if (!topic) {
        alert("لطفاً موضوع مقاله را وارد کنید.");
        return;
    }

    const keywords = articleKeywordsInput.value.trim();
    const sampleCount = parseInt(sampleCountInput.value) || 0;
    let wordCount = parseInt(wordCountInput.value) || 400; // تعداد کلمات درخواستی
    
    // بررسی محدوده مناسب برای تعداد کلمات
    if (wordCount < 300 || wordCount > 5000) {
        alert("تعداد کلمات باید بین 300 تا 5000 کلمه باشد.");
        return;
    }

    if (sampleCount > 0 && uploadedSamples.length === 0) {
        alert("لطفاً حداقل یک نمونه مقاله بارگذاری کنید.");
        return;
    }

    articleContentEl.innerHTML = '<div class="placeholder">در حال تولید مقاله...</div>';
    
    // نمایش نوار پیشرفت
    generationProgressEl.style.display = 'block';
    generationProgressFillEl.style.width = '5%';
    generationProgressTextEl.innerText = 'در حال آماده‌سازی...';

    try {
        let samplesText = "";
        if (uploadedSamples.length > 0) {
            const usedSamples = uploadedSamples.slice(0, sampleCount).map(sample => sample.content);
            samplesText = "نمونه مقالات:\n\n" + usedSamples.join("\n\n----------\n\n");
        }

        // اندازه مقاله براساس انتخاب کاربر
        const selectedSize = document.querySelector('input[name="articleSize"]:checked').value;
        let articleLength = "متوسط";
        
        switch(selectedSize) {
            case 'short':
                articleLength = "کوتاه";
                break;
            case 'medium':
                articleLength = "متوسط";
                break;
            case 'long':
                articleLength = "بلند";
                break;
        }

        // درخواست اولیه با ساختاربندی مناسب
        const initialPrompt = `تو یک متخصص نویسنده مقالات علمی و تخصصی هستی. 
        لطفاً یک مقاله جامع، یکپارچه و ساختاریافته در مورد "${topic}" بنویس.
        ${keywords ? `کلمات کلیدی: ${keywords}` : ""}
        ${samplesText ? `\n\n${samplesText}` : ""}
        
        مقاله باید دارای ساختار زیر باشد:
        1. عنوان مقاله (<h1>)
        2. چکیده (<h2>چکیده</h2> و محتوا در <p>)
        3. مقدمه (<h2>مقدمه</h2> و محتوا در <p>)
        4. بدنه اصلی با چندین بخش مجزا (هر بخش با <h2> یا <h3> شروع شود)
        5. نتیجه‌گیری (<h2>نتیجه‌گیری</h2> و محتوا در <p>)
        6. منابع (<h2>منابع</h2> و هر منبع در یک <p>)
        
        مهم: مقاله را با HTML کامل تولید کن و هر بخش باید در یک <div class="article-section"> قرار گیرد، مثال:
        
        <h1>عنوان مقاله</h1>
        
        <div class="article-section abstract">
            <h2>چکیده</h2>
            <div class="section-content">
                <p>متن چکیده...</p>
            </div>
        </div>
        
        <div class="article-section introduction">
            <h2>مقدمه</h2>
            <div class="section-content">
                <p>متن مقدمه...</p>
                <p>ادامه مقدمه...</p>
            </div>
        </div>
        
        <div class="article-section">
            <h2>عنوان بخش اول</h2>
            <div class="section-content">
                <p>محتوای بخش اول...</p>
            </div>
        </div>
        
        <div class="article-section conclusion">
            <h2>نتیجه‌گیری</h2>
            <div class="section-content">
                <p>متن نتیجه‌گیری...</p>
            </div>
        </div>
        
        <div class="article-section references">
            <h2>منابع</h2>
            <div class="section-content">
                <p>منبع اول...</p>
                <p>منبع دوم...</p>
            </div>
        </div>
        
        تعداد کلمات کل مقاله: حدود ${wordCount} کلمه
        ساختار HTML مناسب برای هر بخش الزامی است.`;

        // بروزرسانی نوار پیشرفت
        generationProgressFillEl.style.width = '15%';
        generationProgressTextEl.innerText = 'در حال ارسال درخواست...';

        // درخواست اول API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.href,
                "X-Title": "Smart Article Writer"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: "user", content: initialPrompt }
                ],
                stream: true,
                max_tokens: Math.max(wordCount * 2, 2500)
            })
        });

        // بروزرسانی نوار پیشرفت
        generationProgressFillEl.style.width = '25%';
        generationProgressTextEl.innerText = 'شروع دریافت پاسخ...';

        if (!response.ok) {
            let errorMsg = `خطا: ${response.status}`;
            if (response.status === 402) {
                errorMsg = "خطای 402: اعتبار کافی در حساب کاربری OpenRouter وجود ندارد. لطفاً وضعیت حساب خود را بررسی کنید.";
            }
            throw new Error(errorMsg);
        }

        // پاک کردن محتوای قبلی
        articleContentEl.innerHTML = '';
        
        let articleHtml = '';
        let progressCounter = 25;
        
        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialLine = '';
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value, { stream: true });
                const lines = (partialLine + text).split('\n');
                partialLine = lines.pop() || '';
                
                // پردازش هر خط پاسخ
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data:')) continue;
                    if (line === 'data: [DONE]') continue;
                    
                    try {
                        const content = JSON.parse(line.substring(6)).choices[0]?.delta?.content || '';
                        if (content) {
                            articleHtml += content;
                            
                            // بروزرسانی پیشرفت
                            progressCounter += 0.5;
                            if (progressCounter < 95) {
                                generationProgressFillEl.style.width = `${progressCounter}%`;
                                if (progressCounter < 40) {
                                    generationProgressTextEl.innerText = 'در حال تولید عنوان و چکیده...';
                                } else if (progressCounter < 70) {
                                    generationProgressTextEl.innerText = 'در حال تولید متن اصلی مقاله...';
                                } else {
                                    generationProgressTextEl.innerText = 'در حال تکمیل نتیجه‌گیری و منابع...';
                                }
                            }
                        }
                    } catch (parseError) {
                        console.error('خطا در تجزیه پاسخ:', parseError);
                    }
                }
                
                // به‌روزرسانی محتوای مقاله با نمایش HTML
                articleContentEl.innerHTML = articleHtml;
            }
        }
        
        // اصلاح HTML در صورت نیاز
        let finalHtml = fixArticleHtml(articleHtml);
        
        // به‌روزرسانی محتوای مقاله
        articleContentEl.innerHTML = finalHtml;
        
        // تقسیم مقاله به بخش‌های مختلف
        let articleSections = extractArticleSections(articleContentEl);
        
        // بررسی تعداد کلمات مقاله
        let currentWordCount = countArticleWords(articleContentEl);
        
        // نمایش وضعیت پیشرفت
        generationProgressFillEl.style.width = '70%';
        generationProgressTextEl.innerText = `بررسی تعداد کلمات: ${currentWordCount} از ${wordCount} کلمه`;
        
        // اگر تعداد کلمات کمتر از مقدار درخواستی است، بخش‌ها را گسترش می‌دهیم
        if (currentWordCount < wordCount) {
            generationProgressFillEl.style.width = '75%';
            generationProgressTextEl.innerText = `در حال گسترش بخش‌های مقاله...`;
            
            // تلاش برای گسترش مقاله تا رسیدن به تعداد کلمات مطلوب
            await expandArticleToTargetWordCount(
                articleContentEl, 
                articleSections, 
                wordCount, 
                currentWordCount, 
                apiKey,
                topic,
                keywords
            );
            
            // محاسبه مجدد تعداد کلمات
            currentWordCount = countArticleWords(articleContentEl);
        }
        
        // اضافه کردن اطلاعات تعداد کلمات
        const wordCountInfo = document.createElement('div');
        wordCountInfo.className = 'word-count-info';
        wordCountInfo.innerHTML = `<p>تعداد کلمات مقاله: <strong>${currentWordCount}</strong> کلمه از <strong>${wordCount}</strong> کلمه درخواستی</p>`;
        
        if (currentWordCount < wordCount) {
            wordCountInfo.innerHTML += `<p class="warning">توجه: علی‌رغم تلاش‌های سیستم، تعداد کلمات مقاله همچنان کمتر از مقدار درخواستی است!</p>
            <p class="warning">لطفاً مجدداً تلاش کنید یا مدل هوش مصنوعی قوی‌تری انتخاب نمایید.</p>`;
        } else {
            const percentMore = Math.round((currentWordCount - wordCount) / wordCount * 100);
            wordCountInfo.innerHTML += `<p class="success">✓ مقاله با موفقیت تولید شد و <strong>${percentMore}%</strong> بیشتر از تعداد کلمات درخواستی است.</p>`;
        }
        
        articleContentEl.appendChild(wordCountInfo);
        
        // تکمیل نوار پیشرفت
        generationProgressFillEl.style.width = '100%';
        generationProgressTextEl.innerText = 'مقاله با موفقیت تولید شد';
        
        setTimeout(() => {
            generationProgressEl.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('خطا در تولید مقاله:', error);
        articleContentEl.innerHTML = `<div class="error">${error.message}</div>`;
        
        // نمایش خطا در نوار پیشرفت
        generationProgressFillEl.style.width = '100%';
        generationProgressFillEl.style.backgroundColor = '#e74c3c';
        generationProgressTextEl.innerText = 'خطا در تولید مقاله';
    }
}

// اصلاح ساختار HTML مقاله در صورت نیاز
function fixArticleHtml(html) {
    // بررسی ساختار HTML
    if (!html.includes('<div class="article-section')) {
        // ساختار HTML مناسب ندارد، آن را اصلاح می‌کنیم
        let processedHtml = '';
        
        // ایجاد DOM موقت برای تجزیه HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // یافتن عنوان اصلی
        let titleEl = tempDiv.querySelector('h1');
        if (titleEl) {
            processedHtml += titleEl.outerHTML;
        } else {
            // بررسی خط اول برای یافتن عنوان
            const lines = html.split('\n');
            for (const line of lines) {
                if (line.trim() && !line.startsWith('<')) {
                    processedHtml += `<h1 class="article-title">${line.trim()}</h1>`;
                    break;
                }
            }
        }
        
        // پردازش عناوین و بخش‌ها
        const headers = tempDiv.querySelectorAll('h2, h3');
        
        if (headers.length > 0) {
            // استفاده از عناوین موجود برای ساختاردهی
            let currentSection = null;
            let currentContent = '';
            
            // پیمایش همه المان‌ها برای یافتن بخش‌ها
            Array.from(tempDiv.childNodes).forEach((node, index) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'H2' || node.tagName === 'H3') {
                        // اگر بخش قبلی وجود داشت، آن را بستیم
                        if (currentSection) {
                            processedHtml += `<div class="article-section ${getSectionClass(currentSection)}">
                                <h2>${currentSection}</h2>
                                <div class="section-content">${currentContent}</div>
                            </div>`;
                        }
                        
                        // شروع بخش جدید
                        currentSection = node.textContent.trim();
                        currentContent = '';
                    } else if (currentSection && (node.tagName === 'P' || node.tagName === 'UL' || node.tagName === 'OL')) {
                        // اضافه کردن محتوا به بخش فعلی
                        currentContent += node.outerHTML;
                    } else if (!currentSection && node.tagName === 'P') {
                        // پاراگراف قبل از اولین عنوان - احتمالاً چکیده
                        processedHtml += `<div class="article-section abstract">
                            <h2>چکیده</h2>
                            <div class="section-content">${node.outerHTML}</div>
                        </div>`;
                    }
                }
            });
            
            // اضافه کردن آخرین بخش
            if (currentSection) {
                processedHtml += `<div class="article-section ${getSectionClass(currentSection)}">
                    <h2>${currentSection}</h2>
                    <div class="section-content">${currentContent}</div>
                </div>`;
            }
        } else {
            // بدون عنوان - تقسیم پاراگراف‌ها به بخش‌ها
            const paragraphs = tempDiv.querySelectorAll('p');
            
            if (paragraphs.length === 0) {
                // تقسیم متن به پاراگراف‌ها
                const textParts = html.split('\n\n')
                    .filter(part => part.trim())
                    .map(part => `<p>${part.trim()}</p>`)
                    .join('');
                
                processedHtml += `<div class="article-section">
                    <h2>متن مقاله</h2>
                    <div class="section-content">${textParts}</div>
                </div>`;
            } else {
                // بخش چکیده
                processedHtml += `<div class="article-section abstract">
                    <h2>چکیده</h2>
                    <div class="section-content">${paragraphs[0].outerHTML}</div>
                </div>`;
                
                // بخش متن اصلی
                let mainContent = '';
                for (let i = 1; i < paragraphs.length - 1; i++) {
                    mainContent += paragraphs[i].outerHTML;
                }
                
                processedHtml += `<div class="article-section">
                    <h2>متن مقاله</h2>
                    <div class="section-content">${mainContent}</div>
                </div>`;
                
                // بخش نتیجه‌گیری
                processedHtml += `<div class="article-section conclusion">
                    <h2>نتیجه‌گیری</h2>
                    <div class="section-content">${paragraphs[paragraphs.length - 1].outerHTML}</div>
                </div>`;
            }
        }
        
        return processedHtml;
    }
    
    return html;
}

// تعیین کلاس CSS مناسب برای هر بخش
function getSectionClass(title) {
    title = title.toLowerCase();
    if (title.includes('چکیده') || title.includes('abstract')) {
        return 'abstract';
    } else if (title.includes('مقدمه') || title.includes('introduction')) {
        return 'introduction';
    } else if (title.includes('نتیجه') || title.includes('جمع‌بندی') || title.includes('conclusion')) {
        return 'conclusion';
    } else if (title.includes('منابع') || title.includes('references')) {
        return 'references';
    }
    return '';
}

// استخراج بخش‌های مقاله
function extractArticleSections(articleElement) {
    const sections = [];
    
    // افزودن عنوان اصلی
    const title = articleElement.querySelector('h1');
    if (title) {
        sections.push({
            type: 'title',
            element: title,
            title: 'عنوان مقاله',
            content: title.textContent,
            priority: 0 // اولویت پایین برای گسترش
        });
    }
    
    // افزودن سایر بخش‌ها
    const sectionElements = articleElement.querySelectorAll('.article-section');
    
    sectionElements.forEach((sectionEl, index) => {
        const heading = sectionEl.querySelector('h2, h3');
        const contentEl = sectionEl.querySelector('.section-content');
        
        if (heading && contentEl) {
            const sectionTitle = heading.textContent.trim();
            const content = contentEl.innerHTML;
            const wordCount = contentEl.textContent.split(/\s+/).filter(word => word.length > 0).length;
            
            // تعیین اولویت بخش برای گسترش
            let priority = 5; // اولویت متوسط پیش‌فرض
            
            // اختصاص اولویت بر اساس نوع بخش
            if (sectionEl.classList.contains('abstract')) {
                priority = 1; // اولویت پایین برای چکیده
            } else if (sectionEl.classList.contains('introduction')) {
                priority = 3; // اولویت متوسط برای مقدمه
            } else if (sectionEl.classList.contains('conclusion')) {
                priority = 3; // اولویت متوسط برای نتیجه‌گیری
            } else if (sectionEl.classList.contains('references')) {
                priority = 0; // اولویت پایین برای منابع
            } else {
                priority = 10; // اولویت بالا برای بخش‌های اصلی
            }
            
            sections.push({
                type: 'section',
                element: sectionEl,
                title: sectionTitle,
                content: content,
                wordCount: wordCount,
                priority: priority,
                index: index
            });
        }
    });
    
    return sections;
}

// شمارش تعداد کلمات مقاله
function countArticleWords(articleElement) {
    const text = articleElement.textContent || '';
    // حذف محتوای بخش اطلاعات تعداد کلمات (اگر وجود داشته باشد)
    const wordCountInfo = articleElement.querySelector('.word-count-info');
    let wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    if (wordCountInfo) {
        const infoTextLength = wordCountInfo.textContent.split(/\s+/).filter(word => word.length > 0).length;
        wordCount -= infoTextLength;
    }
    
    return wordCount;
}

// گسترش مقاله تا رسیدن به تعداد کلمات هدف
async function expandArticleToTargetWordCount(articleElement, sections, targetWordCount, currentWordCount, apiKey, topic, keywords) {
    // تعداد کلمات اضافی مورد نیاز
    let remainingWords = targetWordCount - currentWordCount;
    
    // فیلتر کردن بخش‌هایی که می‌توانند گسترش یابند (براساس اولویت)
    const expandableSections = sections.filter(section => section.priority > 0);
    
    if (expandableSections.length === 0) {
        console.warn('هیچ بخشی برای گسترش یافت نشد');
        return false;
    }
    
    // مرتب‌سازی بخش‌ها براساس اولویت (نزولی)
    expandableSections.sort((a, b) => b.priority - a.priority);
    
    // حداکثر تلاش برای گسترش
    const maxAttempts = Math.min(expandableSections.length * 2, 10);
    let attempts = 0;
    let isExpanding = false; // پرچم نشان‌دهنده در حال گسترش بودن یک بخش
    
    // گسترش بخش‌ها تا زمانی که به تعداد کلمات هدف برسیم یا تلاش‌ها به پایان برسد
    while ((remainingWords > 0 || isExpanding) && attempts < maxAttempts) {
        // انتخاب بخش برای گسترش (چرخشی در بین بخش‌ها)
        const sectionIndex = attempts % expandableSections.length;
        const sectionToExpand = expandableSections[sectionIndex];
        
        // بروزرسانی نوار پیشرفت
        generationProgressFillEl.style.width = `${75 + (attempts / maxAttempts) * 15}%`;
        generationProgressTextEl.innerText = `در حال گسترش بخش "${sectionToExpand.title}"...`;
        
        // شروع گسترش بخش
        isExpanding = true;
        
        // گسترش بخش فعلی
        const success = await expandSectionAndReplace(
            articleElement, 
            sectionToExpand, 
            apiKey, 
            topic,
            keywords,
            Math.max(Math.min(remainingWords, 300), 100) // حداقل 100 کلمه اضافه شود، حداکثر 300 کلمه
        );
        
        // پایان گسترش بخش فعلی
        isExpanding = false;
        
        if (success) {
            // به‌روزرسانی بخش‌ها
            const updatedSections = extractArticleSections(articleElement);
            
            // پیدا کردن بخش گسترش‌یافته
            const expandedSection = updatedSections.find(s => 
                s.type === 'section' && s.title === sectionToExpand.title
            );
            
            if (expandedSection) {
                // محاسبه تفاوت تعداد کلمات
                const addedWords = expandedSection.wordCount - sectionToExpand.wordCount;
                
                if (addedWords > 0) {
                    // بروزرسانی تعداد کلمات باقیمانده
                    remainingWords -= addedWords;
                    
                    // بروزرسانی لیست بخش‌ها
                    expandableSections[sectionIndex] = expandedSection;
                    
                    console.log(`بخش "${sectionToExpand.title}" با ${addedWords} کلمه گسترش یافت. ${Math.max(0, remainingWords)} کلمه باقی مانده.`);
                    
                    // بروزرسانی نوار پیشرفت
                    const currentWords = targetWordCount - Math.min(remainingWords, 0);
                    generationProgressTextEl.innerText = `پیشرفت: ${currentWords} از ${targetWordCount} کلمه`;
                }
            }
        }
        
        // اگر در مجموع به اندازه کافی کلمه اضافه شده و تعداد تلاش‌ها از نصف حداکثر بیشتر است، کافی است
        if (remainingWords <= 0 && attempts >= maxAttempts / 2) {
            break;
        }
        
        attempts++;
    }
    
    return true;
}

// گسترش یک بخش و جایگزینی آن با نسخه گسترش‌یافته
async function expandSectionAndReplace(articleElement, section, apiKey, topic, keywords, minAdditionalWords) {
    try {
        // ایجاد پرامپت برای گسترش بخش با تأکید بر تکمیل منطقی
        const expansionPrompt = `لطفاً این بخش با عنوان "${section.title}" از مقاله در مورد "${topic}" را به طور کامل گسترش دهید.
        ${keywords ? `کلمات کلیدی مقاله: ${keywords}` : ""}
        
        محتوای فعلی بخش:
        ${section.content}
        
        دستورالعمل‌های گسترش:
        1. محتوای این بخش را با جزئیات بیشتر، مثال‌ها، آمار و شواهد غنی‌تر کنید.
        2. حداقل ${minAdditionalWords} کلمه به این بخش اضافه کنید.
        3. اطلاعات و ساختار فعلی را حفظ کنید، فقط آن را کامل‌تر و مفصل‌تر نمایید.
        4. بخش را به صورت منطقی و کامل توسعه دهید و هیچ ایده یا جمله‌ای را نیمه‌تمام رها نکنید.
        5. ساختار HTML فعلی را حفظ کنید (استفاده از تگ‌های <p> برای پاراگراف‌ها).
        6. از زبان علمی و رسمی استفاده کنید.
        7. حتماً این بخش را با یک جمع‌بندی مناسب به پایان برسانید.
        
        نکته مهم: مهم نیست که تعداد کلمات کل مقاله از حد مشخص شده فراتر رود، مهم این است که این بخش به صورت منطقی و کامل گسترش یابد و هیچ بخشی نیمه‌تمام نماند.
        
        فقط محتوای داخل <div class="section-content"> را پاسخ دهید، نه کل بخش را.
        پاسخ شما جایگزین محتوای فعلی این بخش خواهد شد.`;
        
        // درخواست به API با تعداد توکن بیشتر برای اطمینان از تکمیل
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.href,
                "X-Title": "Smart Article Writer"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: "user", content: expansionPrompt }
                ],
                max_tokens: Math.max(minAdditionalWords * 3, 1500), // افزایش تعداد توکن برای اطمینان از تکمیل
                temperature: 0.7 // تنظیم دما برای خلاقیت بیشتر
            })
        });
        
        if (!response.ok) {
            console.error(`خطا در گسترش بخش: ${response.status}`);
            return false;
        }
        
        const data = await response.json();
        let expandedContent = data.choices[0]?.message?.content || '';
        
        // اطمینان از اینکه خروجی شامل تگ‌های HTML است
        if (!expandedContent.includes('<p>')) {
            // تبدیل متن ساده به پاراگراف‌های HTML
            expandedContent = expandedContent
                .split('\n\n')
                .filter(p => p.trim())
                .map(p => `<p>${p.trim()}</p>`)
                .join('');
        }
        
        // حذف کد‌بلاک‌های احتمالی
        expandedContent = expandedContent.replace(/```html|```/g, '');
        
        // جایگزینی محتوای بخش با محتوای گسترش‌یافته
        const sectionContentEl = section.element.querySelector('.section-content');
        if (sectionContentEl) {
            // ذخیره محتوای قبلی
            const originalContent = sectionContentEl.innerHTML;
            
            // بررسی اینکه آیا پاسخ دریافت شده خالی نیست
            if (!expandedContent || expandedContent.trim() === '') {
                console.error('محتوای دریافتی برای گسترش بخش خالی است');
                return false;
            }
            
            // جایگزینی محتوا
            sectionContentEl.innerHTML = expandedContent;
            
            // بررسی اینکه آیا جایگزینی موفقیت‌آمیز بوده است
            if (!sectionContentEl.innerHTML || sectionContentEl.innerHTML === '') {
                console.error('جایگزینی محتوا ناموفق بود، بازگرداندن محتوای اصلی');
                sectionContentEl.innerHTML = originalContent;
                return false;
            }
            
            // اطمینان از اینکه بخش با پاراگراف پایان می‌یابد (برای جلوگیری از نیمه‌تمام ماندن)
            const lastElement = sectionContentEl.lastElementChild;
            if (lastElement && lastElement.tagName === 'P') {
                // بررسی آیا آخرین پاراگراف با یک نقطه یا علامت سوال یا علامت تعجب پایان می‌یابد
                const lastParagraphText = lastElement.textContent.trim();
                if (!lastParagraphText.endsWith('.') && !lastParagraphText.endsWith('؟') && !lastParagraphText.endsWith('!')) {
                    // اضافه کردن نقطه به انتهای پاراگراف
                    lastElement.textContent = lastParagraphText + '.';
                }
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('خطا در گسترش بخش:', error);
        return false;
    }
}

// اضافه کردن تابع برای بررسی وجود کتابخانه‌ها
function checkAndLoadLibraries() {
    let librariesLoaded = true;
    let errorMessage = '';
    
    if (typeof window.docx === 'undefined') {
        librariesLoaded = false;
        errorMessage += 'کتابخانه docx.js بارگذاری نشده است.\n';
        
        // سعی در بارگذاری مجدد
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/docx/7.8.2/docx.js';
        script.integrity = 'sha512-uClSpXAyU2kuylzdZ8ALjJYt5CGxLfJEJcWkAfM/E9VVfgdLKvbj97iuoPj9lVoWS7aU7SYvWXlOBJUmgKOhNA==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        document.body.appendChild(script);
    }
    
    if (typeof window.saveAs === 'undefined') {
        librariesLoaded = false;
        errorMessage += 'کتابخانه FileSaver.js بارگذاری نشده است.\n';
        
        // سعی در بارگذاری مجدد
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js';
        script.integrity = 'sha512-Qlv6VSKh1gDKGoJbnyA5RMXYcvnpIqhO++MhIM2fStMcGT9i2T//tSwYFlcyoRRDcDZ+TYHpH8azBBCyhpSeqw==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        document.body.appendChild(script);
    }
    
    if (!librariesLoaded) {
        console.error('خطا در بارگذاری کتابخانه‌ها:', errorMessage);
        return false;
    }
    
    console.log('همه کتابخانه‌ها با موفقیت بارگذاری شده‌اند.');
    return true;
}

// ذخیره مقاله به صورت Word - نسخه جدید با API صحیح
async function saveAsWord() {
    try {
        // بررسی وجود محتوا
        const content = articleContentEl.innerText;
        if (!content || content.includes('مقاله‌ای تولید نشده است')) {
            alert('ابتدا یک مقاله تولید کنید');
            return;
        }

        console.log("شروع ایجاد فایل Word...");
        
        // بررسی دسترسی به کتابخانه docx
        if (typeof window.docx === 'undefined') {
            alert("کتابخانه docx بارگذاری نشده است. در حال تلاش مجدد...");
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/docx@7.8.2/build/index.js';
                script.onload = resolve;
                document.body.appendChild(script);
                setTimeout(resolve, 2000); // حداکثر 2 ثانیه منتظر می‌مانیم
            });
            
            if (typeof window.docx === 'undefined') {
                throw new Error("کتابخانه docx بارگذاری نشد. لطفاً صفحه را مجدداً بارگذاری کنید.");
            }
        }
        
        console.log("کتابخانه docx در دسترس است:", typeof window.docx);
        
        // دریافت عنوان مقاله
        const topic = articleTopicInput.value.trim() || 'مقاله';
        const fileName = `${topic}_${new Date().toLocaleDateString('fa-IR')}.docx`;
        
        // ساخت آرایه پاراگراف‌ها
        const paragraphs = [];
        const sections = articleContentEl.children;
        
        // تبدیل محتوا به پاراگراف‌های docx
        for (const section of sections) {
            console.log("پردازش بخش:", section.tagName);
            
            if (section.tagName === 'H1') {
                // عنوان مقاله
                paragraphs.push(
                    new window.docx.Paragraph({
                        text: section.textContent,
                        heading: window.docx.HeadingLevel.HEADING_1,
                        spacing: { after: 400 }
                    })
                );
            } else if (section.classList.contains('article-section')) {
                // عنوان بخش
                const sectionTitle = section.querySelector('h2');
                if (sectionTitle) {
                    paragraphs.push(
                        new window.docx.Paragraph({
                            text: sectionTitle.textContent,
                            heading: window.docx.HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 }
                        })
                    );
                }
                
                // محتوای بخش
                const sectionContent = section.querySelector('.section-content');
                if (sectionContent) {
                    const contentParagraphs = sectionContent.querySelectorAll('p');
                    
                    contentParagraphs.forEach(p => {
                        if (p.textContent.trim()) {
                            paragraphs.push(
                                new window.docx.Paragraph({
                                    children: [
                                        new window.docx.TextRun({
                                            text: p.textContent.trim()
                                        })
                                    ],
                                    spacing: { after: 200 }
                                })
                            );
                        }
                    });
                }
            } else if (section.tagName === 'P' || section.tagName === 'DIV') {
                // پاراگراف‌های متن اصلی
                if (section.textContent.trim() && 
                    !section.textContent.includes('مقاله‌ای تولید نشده است') && 
                    !section.classList.contains('placeholder')) {
                    paragraphs.push(
                        new window.docx.Paragraph({
                            children: [
                                new window.docx.TextRun({
                                    text: section.textContent.trim()
                                })
                            ],
                            spacing: { after: 200 }
                        })
                    );
                }
            }
        }
        
        console.log(`${paragraphs.length} پاراگراف ایجاد شد.`);
        
        // ایجاد سند
        const doc = new window.docx.Document({
            sections: [
                {
                    properties: {},
                    children: paragraphs
                }
            ]
        });
        
        console.log("سند ایجاد شد، در حال تبدیل به Blob...");
        
        // تبدیل به Blob و ذخیره
        window.docx.Packer.toBlob(doc).then(blob => {
            console.log("Blob ایجاد شد، در حال ذخیره...");
            
            // بررسی وجود FileSaver
            if (typeof window.saveAs !== 'undefined') {
                window.saveAs(blob, fileName);
                console.log("فایل با موفقیت ذخیره شد.");
            } else {
                // روش جایگزین ذخیره
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
                console.log("فایل با روش جایگزین ذخیره شد.");
            }
            
            alert('مقاله با موفقیت به صورت Word ذخیره شد');
        }).catch(error => {
            console.error("خطا در ایجاد Blob:", error);
            throw error;
        });
        
    } catch (error) {
        console.error('خطا در ایجاد فایل Word:', error);
        alert('خطا در ایجاد فایل Word: ' + error.message);
    }
}

// بررسی وضعیت اجرای برنامه (به عنوان PWA یا در مرورگر)
function checkInstallState() {
    // بررسی آیا اپلیکیشن در حالت standalone اجرا می‌شود یا نه
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                               window.navigator.standalone || 
                               document.referrer.includes('android-app://');
    
    if (installButton) {
        if (isRunningStandalone) {
            // اگر به عنوان PWA اجرا می‌شود، دکمه نصب را پنهان کنید
            installButton.style.display = 'none';
        } else {
            // در غیر این صورت، رویداد نصب را تنظیم کنید
            setupInstallButton();
        }
    }
    
    // بررسی iOS برای نمایش راهنمای نصب
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && iOSInstallTip && !isRunningStandalone) {
        iOSInstallTip.style.display = 'block';
    }
}

// تنظیم رویداد نصب PWA
function setupInstallButton() {
    // رویداد قبل از نمایش پرامپت نصب
    window.addEventListener('beforeinstallprompt', (e) => {
        // جلوگیری از نمایش خودکار رابط نصب
        e.preventDefault();
        
        // ذخیره رویداد برای استفاده بعدی
        deferredPrompt = e;
        
        // نمایش دکمه نصب
        installButton.style.display = 'inline-block';
        
        console.log('این برنامه قابل نصب است');
    });
    
    // رویداد کلیک دکمه نصب
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
            console.log('برنامه قبلاً نصب شده یا قابل نصب نیست');
            
            // اگر در Safari iOS هستیم، راهنمایی نصب را نشان بده
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                alert('برای نصب این برنامه در iOS، روی دکمه "اشتراک‌گذاری" در مرورگر ضربه بزنید و گزینه "افزودن به صفحه اصلی" را انتخاب کنید.');
            }
            
            return;
        }
        
        // نمایش رابط نصب
        deferredPrompt.prompt();
        
        // منتظر انتخاب کاربر
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`کاربر ${outcome === 'accepted' ? 'پذیرفت' : 'رد کرد'} نصب را`);
        
        // تنظیم مجدد deferredPrompt
        deferredPrompt = null;
        
        // پنهان کردن دکمه نصب
        installButton.style.display = 'none';
    });
    
    // وقتی برنامه با موفقیت نصب شد
    window.addEventListener('appinstalled', (evt) => {
        console.log('برنامه با موفقیت نصب شد');
        
        // پنهان کردن دکمه نصب و راهنما
        installButton.style.display = 'none';
        iOSInstallTip.style.display = 'none';
        
        // اعلان به کاربر
        alert('برنامه با موفقیت نصب شد! می‌توانید آن را از صفحه اصلی دستگاه خود اجرا کنید.');
    });
}

// وقتی برنامه با موفقیت نصب شد
window.addEventListener('appinstalled', (evt) => {
    console.log('برنامه با موفقیت نصب شد');
    
    // پنهان کردن دکمه نصب و راهنما
    installButton.style.display = 'none';
    iOSInstallTip.style.display = 'none';
    
    // اعلان به کاربر
    alert('برنامه با موفقیت نصب شد! می‌توانید آن را از صفحه اصلی دستگاه خود اجرا کنید.');
});

// تنظیم رویدادهای مربوط به تاریخچه جستجو
function setupSearchHistory() {
    // دکمه پاک کردن تاریخچه جستجو
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }
    
    // فرم جستجو
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
}

// پاک کردن تاریخچه جستجو
function clearSearchHistory() {
    searchHistory = [];
    localStorage.setItem('search_history', JSON.stringify(searchHistory));
    updateSearchHistoryUI();
}

// مدیریت جستجو
function handleSearch(event) {
    event.preventDefault();
    const searchTerm = modelSearchEl.value.trim();
    if (searchTerm) {
        addToSearchHistory(searchTerm);
    }
}

// تنظیم رویدادهای مربوط به فایل
function setupFileUpload() {
    // ...کد موجود...
}

// تنظیم رویدادهای مربوط به تاریخچه جستجو
function setupSearchHistory() {
    // ...کد موجود...
}

// تنظیم رویداد دکمه تولید مقاله
function setupGenerateButton() {
    // ...کد موجود...
}

// اعتبارسنجی تعداد کلمات
function validateWordCount(event) {
    const input = event.target;
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 300) {
        alert('تعداد کلمات نمی‌تواند کمتر از 300 باشد.');
        input.value = 300;
    } else if (value > 5000) {
        alert('تعداد کلمات نمی‌تواند بیشتر از 5000 باشد.');
        input.value = 5000;
    }
} 

/**
 * اسکریپت تبدیل SVG به آیکون‌های PNG با اندازه‌های مختلف
 * 
 * برای استفاده از این اسکریپت، ابتدا باید کتابخانه‌های زیر را نصب کنید:
 * npm install sharp fs-extra
 */

const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// آرایه‌ای از اندازه‌های مورد نیاز
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// مسیر فایل SVG منبع
const sourceSvg = path.join(__dirname, 'icons', 'icon-base.svg');

// مسیر پوشه خروجی
const outputDir = path.join(__dirname, 'icons');

// اطمینان از وجود پوشه خروجی
fs.ensureDirSync(outputDir);

// تبدیل SVG به PNG برای هر اندازه
async function generateIcons() {
  try {
    console.log('شروع تولید آیکون‌ها...');
    
    // خواندن فایل SVG منبع
    const svgBuffer = fs.readFileSync(sourceSvg);
    
    // تولید آیکون‌ها برای هر اندازه
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      
      console.log(`در حال تولید آیکون ${size}x${size}...`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .toFile(outputFile);
        
      console.log(`آیکون ${size}x${size} با موفقیت ایجاد شد.`);
    }
    
    // تولید favicon
    const faviconFile = path.join(__dirname, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(faviconFile);
      
    console.log('favicon.ico با موفقیت ایجاد شد.');
    
    console.log('همه آیکون‌ها با موفقیت تولید شدند.');
  } catch (err) {
    console.error('خطا در تولید آیکون‌ها:', err);
  }
}

// اجرای تابع تولید آیکون‌ها
generateIcons(); 
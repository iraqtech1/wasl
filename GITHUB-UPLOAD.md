# رفع مشروع واصل إلى GitHub

1. فك ضغط wasel-github-ready.zip.
2. أنشئ مستودعاً جديداً في GitHub. اختَر Private إذا تريد الكود يبقى خاص.
3. افتح مجلد المشروع وشغّل الأوامر التالية، مع استبدال YOUR-USER وYOUR-REPO باسم حسابك ومستودعك:

```sh
git init
git add .
git commit -m "Initial Wasel PWA source"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

يمكن أيضاً رفع الملفات من Add file → Upload files. ارفع محتويات المجلد بعد فك الضغط، وليس ملف ZIP؛ تأكد من رفع .gitignore ومجلد .github أيضاً. يجب أن يكون package.json في جذر المستودع.

## التشغيل بعد التنزيل

ثبّت Node.js 24 أو أحدث، ثم من مجلد المشروع:

```sh
pnpm install
pnpm build
ppnpm test
pnpm start
```

افتح http://localhost:4173/ . الواجهة تستخدم Vue 3 وVite. ينشئ التشغيل قاعدة بيانات محلية جديدة في data/، مع حسابات الاختبار الموثقة في README.md.

## بيانات وتجهيزات النسخة

هذه حزمة الكود الحالية فقط، بدون قاعدة التشغيل أو الحسابات والمستمسكات المحفوظة. الحسابات التجريبية المكتوبة داخل الكود مقصودة للفحص وليست أسرار تشغيل. يتجاهل .gitignore قواعد البيانات والمستمسكات وملفات البيئة المحلية. لا تضف بيانات حقيقية للمستودع.

يعمل فحص npm test تلقائياً عند الدفع وطلبات الدمج بواسطة GitHub Actions.

## الاستضافة

رفع الكود إلى GitHub لا يشغّل التطبيق على الإنترنت. GitHub Pages وحده لا يشغّل خادم Node.js وSQLite؛ التطبيق يحتاج استضافة Node.js 24 مع قرص دائم لقاعدة البيانات ورابط HTTPS لتثبيت PWA واستخدام الكاميرا. لا تتضمن هذه الحزمة نشر التطبيق أو ربط استضافة.

## نشر تعديلات Vue
بعد تعديل `src/` أو ملفات التنسيق، شغّل `pnpm build:pages` قبل الدفع إلى GitHub. يولّد هذا الأمر نسخة المعاينة التي ينشرها Pages من جذر `main`. تشغيل النظام الكامل يحتاج `pnpm build` و`pnpm start` على استضافة Node.js.

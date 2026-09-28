# نشر واصل على GitHub Pages

المستودع: https://github.com/iraqtech1/wasl

التطبيق: https://iraqtech1.github.io/wasl/

النسخة الحالية واجهة Vue مستقلة ببيانات تجريبية محلية، تعمل على Pages دون خادم.

## نشر التعديلات

1. عدّل ملفات المصدر داخل `src/` أو ملفات التنسيق.
2. شغّل `pnpm build` ثم `pnpm test` و`pnpm check`.
3. شغّل `pnpm build:pages`؛ يولّد `site/` وينسخ نسخة النشر إلى جذر المستودع.
4. أضف ملفات التعديل وملفات البناء الناتجة إلى Git، ثم نفّذ commit وpush إلى `main`.
5. انتظر نجاح نشر GitHub Pages وتحقق من الرابط. إعداد النشر الحالي هو `main / root`.

لا تعدّل `index.html` أو `sw.js` المنشورين يدويًا؛ مصدرهما `web/index.html` و`src/service-worker.js`. أسماء ملفات JavaScript وCSS ذات البصمة ونسخة Service Worker تتغير مع المحتوى لتحديث التطبيق عند إعادة فتحه أو تحديثه.

تنفذ GitHub Actions فحوص البناء والاختبارات عند الدفع. بيانات تجربة المستخدم في المتصفح لا ترفع إلى المستودع.

## التشغيل المحلي

```sh
pnpm install
pnpm dev
```

أو `pnpm start` لبناء وعرض نسخة الإنتاج على http://localhost:4173/ . الربط الحقيقي بالخادم لاحقًا يتم عبر `src/services/api.js`.

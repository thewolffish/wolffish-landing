/**
 * Strings the playground adds on top of the desktop's locale files — the
 * demo-mode reply card, the "this button does nothing" toast, the skeleton's
 * restore line, and the hero frame's chrome. Kept out of en.json / ar.json
 * so those two stay byte-identical copies of the desktop's files.
 */
export const DEMO_STRINGS = {
  en: {
    reply: {
      heading: 'Demo mode',
      body: 'This is a full tour of the Wolffish Cloud desktop app — new messages are not processed here, but you can open every conversation, browse every page and change every setting.',
      outro: '[Book a call](/cloud#schedule) to see it run on your own machines, inside your own perimeter.'
    },
    toast: {
      noop: 'Demo action — this button does nothing here.',
      saved: 'Saved (demo only — nothing leaves this page).',
      locked: 'Locked. Enter any four digits to unlock the demo.'
    },
    restore: {
      title: 'Restoring your workspace',
      subtitle: 'Walking the workspace back out of the organization.',
      steps: [
        'Signing in to Wolffish Inc',
        'Pulling the organization’s config',
        'Restoring 20 conversations',
        'Materializing workspace files',
        'Mirroring capabilities',
        'Opening the chat'
      ]
    },
    frame: {
      title: 'Wolffish Cloud — Younes Alturkey',
      badge: 'Interactive demo',
      open: 'Open full screen',
      hint: 'A replica of the desktop app on demo data: every page, setting and file opens; nothing runs.',
      loading: 'Loading the desktop…'
    },
    lock: {
      title: 'Locked',
      subtitle: 'Enter your PIN to continue',
      hint: 'Any four digits unlock the demo.'
    },
    files: {
      sample: 'Sample file — every file of this type opens the same published sample in the demo.'
    },
    orgKeys: {
      'safety_blockCredentials': 'Block credentials in prompts',
      'updates_enabled': 'Automatic updates',
      'browserExtension_port': 'Browser extension port'
    },
    // Viewer chrome the desktop left as bare English attributes.
    media: {
      openFull: 'Open image at full size',
      openDefaultViewer: 'Open in default viewer',
      openDefaultPlayer: 'Open in default player',
      loadingImage: 'Loading image…',
      loadingVideo: 'Loading video',
      speed: 'Speed: {{rate}}x',
      zoomIn: 'Zoom in',
      zoomInHint: 'Zoom in (+)',
      zoomOut: 'Zoom out',
      zoomOutHint: 'Zoom out (−)',
      resetZoom: 'Reset zoom',
      resetZoomHint: 'Reset zoom (0)',
      panHint: 'Drag to pan · double-click to reset',
      zoomHint: 'Scroll or double-click to zoom'
    },
    code: {
      lines_one: '{{count}} line',
      lines_two: '{{count}} lines',
      lines_few: '{{count}} lines',
      lines_many: '{{count}} lines',
      lines_other: '{{count}} lines'
    },
    // Top-level MIME buckets, used when a file has no extension to show.
    fileTypes: {
      image: 'Image',
      audio: 'Audio',
      video: 'Video',
      text: 'Text',
      application: 'File',
      font: 'Font',
      model: 'Model'
    },
    select: {
      search: 'Search…'
    },
    actions: {
      copyPath: 'Copy path'
    },
    heartbeat: {
      unsaved: '(unsaved)'
    },
    tts: {
      speedSlow: 'Slow',
      speedNormal: 'Normal',
      speedFast: 'Fast',
      speedVeryFast: 'Very fast',
      langEnUs: 'English (US)',
      langEnUk: 'English (UK)',
      female: 'Female',
      male: 'Male'
    },
    admin: {
      recordsOnly: 'this demo carries records for the signed-in account only',
      recordsNote:
        'Every other transcript is archived on the company server, which the replica does not reach.'
    },
    // Audit actions the demo fixture logs that the desktop's own
    // settings.admin.audit.actions map does not name.
    auditActions: {
      'user_suspend': 'Disabled a person',
      'user_role': 'Changed a role',
      'user_activate': 'Activated an account',
      'password_reset': 'Reset a password',
      'session_revoke': 'Signed out every session',
      'pin_clear': 'Cleared a device PIN',
      'org_patch': 'Changed org settings',
      'capability_grant': 'Granted a capability',
      'capability_publish': 'Published a capability'
    }
  },
  ar: {
    reply: {
      heading: 'وضع العرض التجريبي',
      body: 'هذه جولة كاملة في تطبيق وولف فيش كلاود لسطح المكتب. لا تُعالج الرسائل الجديدة هنا، لكن يمكنك فتح كل محادثة وتصفح كل صفحة وتغيير كل إعداد.',
      outro: '[احجز مكالمة](/cloud#schedule) لتراه يعمل على أجهزتك أنت، داخل نطاقك الخاص.'
    },
    toast: {
      noop: 'إجراء تجريبي، هذا الزر لا يفعل شيئًا هنا.',
      saved: 'تم الحفظ (للعرض فقط، لا شيء يغادر هذه الصفحة).',
      locked: 'مقفل. أدخل أي أربعة أرقام لفتح العرض.'
    },
    restore: {
      title: 'جارٍ استعادة مساحة العمل',
      subtitle: 'استعادة مساحة العمل من المؤسسة.',
      steps: [
        'تسجيل الدخول إلى Wolffish Inc',
        'جلب إعدادات المؤسسة',
        'استعادة 20 محادثة',
        'تجهيز ملفات مساحة العمل',
        'مزامنة القدرات',
        'فتح المحادثة'
      ]
    },
    frame: {
      title: 'وولف فيش كلاود — يونس التركي',
      badge: 'عرض تفاعلي',
      open: 'فتح بملء الشاشة',
      hint: 'نسخة طبق الأصل من تطبيق سطح المكتب على بيانات تجريبية: كل صفحة وإعداد وملف يُفتح، ولا شيء يُنفَّذ.',
      loading: 'جارٍ تحميل سطح المكتب…'
    },
    lock: {
      title: 'مقفل',
      subtitle: 'أدخل رمز PIN للمتابعة',
      hint: 'أي أربعة أرقام تفتح العرض.'
    },
    files: {
      sample: 'ملف عيّنة، كل ملف من هذا النوع يفتح العيّنة المنشورة نفسها في العرض.'
    },
    orgKeys: {
      'safety_blockCredentials': 'حجب بيانات الاعتماد في الرسائل',
      'updates_enabled': 'التحديثات التلقائية',
      'browserExtension_port': 'منفذ إضافة المتصفح'
    },
    media: {
      openFull: 'فتح الصورة بالحجم الكامل',
      openDefaultViewer: 'فتح في العارض الافتراضي',
      openDefaultPlayer: 'فتح في المشغّل الافتراضي',
      loadingImage: 'جارٍ تحميل الصورة…',
      loadingVideo: 'جارٍ تحميل الفيديو',
      speed: 'السرعة: {{rate}}×',
      zoomIn: 'تكبير',
      zoomInHint: 'تكبير (+)',
      zoomOut: 'تصغير',
      zoomOutHint: 'تصغير (−)',
      resetZoom: 'إعادة التكبير',
      resetZoomHint: 'إعادة التكبير (0)',
      panHint: 'اسحب للتحريك · انقر نقرًا مزدوجًا لإعادة الضبط',
      zoomHint: 'مرّر أو انقر نقرًا مزدوجًا للتكبير'
    },
    code: {
      lines_one: 'سطر واحد',
      lines_two: 'سطران',
      lines_few: '{{count}} أسطر',
      lines_many: '{{count}} سطرًا',
      lines_other: '{{count}} سطر'
    },
    fileTypes: {
      image: 'صورة',
      audio: 'صوت',
      video: 'فيديو',
      text: 'نص',
      application: 'ملف',
      font: 'خط',
      model: 'نموذج'
    },
    select: {
      search: 'بحث…'
    },
    actions: {
      copyPath: 'نسخ المسار'
    },
    heartbeat: {
      unsaved: '(غير محفوظ)'
    },
    tts: {
      speedSlow: 'بطيئة',
      speedNormal: 'عادية',
      speedFast: 'سريعة',
      speedVeryFast: 'سريعة جدًا',
      langEnUs: 'الإنجليزية (أمريكية)',
      langEnUk: 'الإنجليزية (بريطانية)',
      female: 'أنثى',
      male: 'ذكر'
    },
    admin: {
      recordsOnly: 'هذا العرض يحمل سجلات الحساب الحالي فقط',
      recordsNote: 'كل نسخة محادثة أخرى محفوظة على خادم الشركة، وهذا العرض لا يصل إليه.'
    },
    auditActions: {
      'user_suspend': 'عطّل شخصًا',
      'user_role': 'غيّر دورًا',
      'user_activate': 'فعّل حسابًا',
      'password_reset': 'أعاد تعيين كلمة مرور',
      'session_revoke': 'سجّل الخروج من كل الجلسات',
      'pin_clear': 'مسح رمز جهاز',
      'org_patch': 'غيّر إعدادات المنشأة',
      'capability_grant': 'منح قدرة',
      'capability_publish': 'نشر قدرة'
    }
  }
} as const

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Minimize2, Maximize2, RotateCcw, Copy, Check, ChevronDown, Globe } from 'lucide-react';

// Flag SVG components for reliable display across all devices
const FlagFR = () => (
  <svg className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0" viewBox="0 0 640 480">
    <rect width="213.3" height="480" fill="#002654"/>
    <rect x="213.3" width="213.4" height="480" fill="#fff"/>
    <rect x="426.7" width="213.3" height="480" fill="#ce1126"/>
  </svg>
);

const FlagGB = () => (
  <svg className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0" viewBox="0 0 640 480">
    <path fill="#012169" d="M0 0h640v480H0z"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
  </svg>
);

const FlagIT = () => (
  <svg className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0" viewBox="0 0 640 480">
    <rect width="213.3" height="480" fill="#009246"/>
    <rect x="213.3" width="213.4" height="480" fill="#fff"/>
    <rect x="426.7" width="213.3" height="480" fill="#ce2b37"/>
  </svg>
);

const FlagTN = () => (
  <svg className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0" viewBox="0 0 640 480">
    <path fill="#e70013" d="M0 0h640v480H0z"/>
    <circle cx="320" cy="240" r="100" fill="#fff"/>
    <circle cx="340" cy="240" r="75" fill="#e70013"/>
    <path fill="#e70013" d="m260 240 85-55v110z"/>
  </svg>
);

// Supported languages with SVG flags
const LANGUAGES = {
  fr: { name: 'Français', Flag: FlagFR, dir: 'ltr' },
  en: { name: 'English', Flag: FlagGB, dir: 'ltr' },
  it: { name: 'Italiano', Flag: FlagIT, dir: 'ltr' },
  ar: { name: 'العربية', Flag: FlagTN, dir: 'rtl' }
};

// UI Translations
const UI_TRANSLATIONS = {
  fr: {
    assistant: 'Assistant Expert Soudure',
    placeholder: 'Posez votre question...',
    reset: 'Réinitialiser',
    minimize: 'Réduire',
    maximize: 'Agrandir',
    fullscreen: 'Plein écran',
    close: 'Fermer',
    copy: 'Copier',
    reopenChat: 'Cliquez pour rouvrir le chat',
    seeMessages: 'Voir les messages',
    footer: 'Boualam • Assistant IA pour la soudure et production de tubes spirales',
    openAssistant: 'Ouvrir Boualam - Assistant IA',
    selectLanguage: 'Choisir la langue'
  },
  en: {
    assistant: 'Welding Expert Assistant',
    placeholder: 'Ask your question...',
    reset: 'Reset',
    minimize: 'Minimize',
    maximize: 'Maximize',
    fullscreen: 'Fullscreen',
    close: 'Close',
    copy: 'Copy',
    reopenChat: 'Click to reopen chat',
    seeMessages: 'See messages',
    footer: 'Boualam • AI Assistant for welding and spiral tube production',
    openAssistant: 'Open Boualam - AI Assistant',
    selectLanguage: 'Select language'
  },
  it: {
    assistant: 'Assistente Esperto Saldatura',
    placeholder: 'Fai la tua domanda...',
    reset: 'Ripristina',
    minimize: 'Riduci',
    maximize: 'Ingrandisci',
    fullscreen: 'Schermo intero',
    close: 'Chiudi',
    copy: 'Copia',
    reopenChat: 'Clicca per riaprire la chat',
    seeMessages: 'Vedi messaggi',
    footer: 'Boualam • Assistente IA per saldatura e produzione tubi a spirale',
    openAssistant: 'Apri Boualam - Assistente IA',
    selectLanguage: 'Seleziona lingua'
  },
  ar: {
    assistant: 'مساعد خبير اللحام',
    placeholder: 'اطرح سؤالك...',
    reset: 'إعادة تعيين',
    minimize: 'تصغير',
    maximize: 'تكبير',
    fullscreen: 'ملء الشاشة',
    close: 'إغلاق',
    copy: 'نسخ',
    reopenChat: 'انقر لإعادة فتح المحادثة',
    seeMessages: 'عرض الرسائل',
    footer: 'بوعلام • مساعد ذكاء اصطناعي للحام وإنتاج الأنابيب الحلزونية',
    openAssistant: 'افتح بوعلام - مساعد الذكاء الاصطناعي',
    selectLanguage: 'اختر اللغة'
  }
};

// Multilingual Knowledge Base
const KNOWLEDGE_BASE = {
  // SAW Welding
  soudure_saw: {
    keywords: {
      fr: ['saw', 'submerged', 'arc', 'submerge', 'flux', 'soudure'],
      en: ['saw', 'submerged', 'arc', 'welding', 'flux'],
      it: ['saw', 'sommerso', 'arco', 'saldatura', 'flusso'],
      ar: ['saw', 'لحام', 'مغمور', 'قوس', 'تدفق']
    },
    response: {
      fr: `**Soudure SAW (Submerged Arc Welding)** 🔥

La soudure à l'arc submergé est le procédé principal utilisé pour les tubes spirales API 5L :

**Principe :**
• L'arc électrique est protégé par une couche de flux granulé
• Température de fusion : ~3500°C
• Pénétration profonde et cordons réguliers

**Paramètres clés :**
• Intensité : 400-1200 A selon l'épaisseur
• Tension : 28-38 V
• Vitesse de soudage : 0.8-2.5 m/min
• Stick-out : 25-35 mm

**Avantages :**
✅ Haute qualité métallurgique
✅ Rendement élevé (95%+)
✅ Faible déformation
✅ Pas de projections`,

      en: `**SAW Welding (Submerged Arc Welding)** 🔥

Submerged arc welding is the main process used for API 5L spiral tubes:

**Principle:**
• The electric arc is protected by a layer of granular flux
• Melting temperature: ~3500°C
• Deep penetration and regular beads

**Key Parameters:**
• Current: 400-1200 A depending on thickness
• Voltage: 28-38 V
• Welding speed: 0.8-2.5 m/min
• Stick-out: 25-35 mm

**Advantages:**
✅ High metallurgical quality
✅ High efficiency (95%+)
✅ Low distortion
✅ No spatter`,

      it: `**Saldatura SAW (Submerged Arc Welding)** 🔥

La saldatura ad arco sommerso è il processo principale utilizzato per i tubi a spirale API 5L:

**Principio:**
• L'arco elettrico è protetto da uno strato di flusso granulare
• Temperatura di fusione: ~3500°C
• Penetrazione profonda e cordoni regolari

**Parametri chiave:**
• Intensità: 400-1200 A secondo lo spessore
• Tensione: 28-38 V
• Velocità di saldatura: 0.8-2.5 m/min
• Stick-out: 25-35 mm

**Vantaggi:**
✅ Alta qualità metallurgica
✅ Alto rendimento (95%+)
✅ Bassa deformazione
✅ Nessun spruzzo`,

      ar: `**لحام SAW (لحام القوس المغمور)** 🔥

لحام القوس المغمور هو العملية الرئيسية المستخدمة لأنابيب API 5L الحلزونية:

**المبدأ:**
• القوس الكهربائي محمي بطبقة من التدفق الحبيبي
• درجة حرارة الانصهار: ~3500 درجة مئوية
• اختراق عميق وخرز منتظم

**المعلمات الرئيسية:**
• شدة التيار: 400-1200 أمبير حسب السماكة
• الجهد: 28-38 فولت
• سرعة اللحام: 0.8-2.5 م/دقيقة
• البروز: 25-35 مم

**المزايا:**
✅ جودة معدنية عالية
✅ كفاءة عالية (+95%)
✅ تشوه منخفض
✅ لا رذاذ`
    }
  },

  // Welding heads
  tetes_soudure: {
    keywords: {
      fr: ['tete', 'tetes', '4 tetes', 'interieur', 'exterieur', 'id', 'od'],
      en: ['head', 'heads', '4 heads', 'interior', 'exterior', 'id', 'od', 'inside', 'outside'],
      it: ['testa', 'teste', '4 teste', 'interno', 'esterno', 'id', 'od'],
      ar: ['رأس', 'رؤوس', '4 رؤوس', 'داخلي', 'خارجي', 'id', 'od']
    },
    response: {
      fr: `**Configuration des 4 têtes de soudure** 🎯

Les tubes spirales utilisent 4 têtes SAW :

**Têtes intérieures (ID) :**
• **ID1** - Première passe intérieure (racine)
• **ID2** - Deuxième passe intérieure (remplissage)

**Têtes extérieures (OD) :**
• **OD1** - Première passe extérieure
• **OD2** - Deuxième passe extérieure (finition)

**Séquence de soudage :**
1. ID1 → Crée la pénétration initiale
2. OD1 → Soude depuis l'extérieur
3. ID2 → Renforce l'intérieur
4. OD2 → Finition extérieure

**Conseil :** Les paramètres doivent être synchronisés entre les têtes pour éviter les défauts de fusion.`,

      en: `**4 Welding Heads Configuration** 🎯

Spiral tubes use 4 SAW heads:

**Interior Heads (ID):**
• **ID1** - First interior pass (root)
• **ID2** - Second interior pass (fill)

**Exterior Heads (OD):**
• **OD1** - First exterior pass
• **OD2** - Second exterior pass (cap)

**Welding Sequence:**
1. ID1 → Creates initial penetration
2. OD1 → Welds from outside
3. ID2 → Reinforces inside
4. OD2 → Final exterior finish

**Tip:** Parameters must be synchronized between heads to avoid fusion defects.`,

      it: `**Configurazione delle 4 teste di saldatura** 🎯

I tubi a spirale utilizzano 4 teste SAW:

**Teste interne (ID):**
• **ID1** - Prima passata interna (radice)
• **ID2** - Seconda passata interna (riempimento)

**Teste esterne (OD):**
• **OD1** - Prima passata esterna
• **OD2** - Seconda passata esterna (finitura)

**Sequenza di saldatura:**
1. ID1 → Crea la penetrazione iniziale
2. OD1 → Salda dall'esterno
3. ID2 → Rinforza l'interno
4. OD2 → Finitura esterna

**Consiglio:** I parametri devono essere sincronizzati tra le teste per evitare difetti di fusione.`,

      ar: `**تكوين 4 رؤوس لحام** 🎯

تستخدم الأنابيب الحلزونية 4 رؤوس SAW:

**الرؤوس الداخلية (ID):**
• **ID1** - التمريرة الداخلية الأولى (الجذر)
• **ID2** - التمريرة الداخلية الثانية (الملء)

**الرؤوس الخارجية (OD):**
• **OD1** - التمريرة الخارجية الأولى
• **OD2** - التمريرة الخارجية الثانية (التشطيب)

**تسلسل اللحام:**
1. ID1 ← يخلق الاختراق الأولي
2. OD1 ← يلحم من الخارج
3. ID2 ← يعزز الداخل
4. OD2 ← التشطيب الخارجي النهائي

**نصيحة:** يجب مزامنة المعلمات بين الرؤوس لتجنب عيوب الانصهار.`
    }
  },

  // Defects
  defauts: {
    keywords: {
      fr: ['defaut', 'probleme', 'fissure', 'porosite', 'inclusion', 'manque', 'caniveau', 'soufflure'],
      en: ['defect', 'problem', 'crack', 'porosity', 'inclusion', 'lack', 'undercut', 'blowhole'],
      it: ['difetto', 'problema', 'fessura', 'porosita', 'inclusione', 'mancanza', 'incisione', 'soffiatura'],
      ar: ['عيب', 'مشكلة', 'شق', 'مسامية', 'شوائب', 'نقص', 'قطع', 'ثقب']
    },
    response: {
      fr: `**Défauts de soudure courants et solutions** ⚠️

**1. Porosités / Soufflures**
• Cause : Humidité dans le flux, contamination
• Solution : Sécher le flux (300°C/2h), nettoyer la tôle

**2. Fissures**
• Cause : Refroidissement trop rapide, contraintes
• Solution : Préchauffage, réduire la vitesse

**3. Manque de pénétration**
• Cause : Intensité insuffisante, vitesse trop élevée
• Solution : Augmenter l'intensité, réduire la vitesse

**4. Caniveaux (undercut)**
• Cause : Tension trop élevée, angle incorrect
• Solution : Réduire la tension, ajuster l'angle

**5. Inclusions de laitier**
• Cause : Mauvais nettoyage inter-passes
• Solution : Brosser entre chaque passe

**Contrôle qualité :** Radiographie (RT), Ultrasons (UT), Magnétoscopie (MT)`,

      en: `**Common Welding Defects and Solutions** ⚠️

**1. Porosity / Blowholes**
• Cause: Moisture in flux, contamination
• Solution: Dry flux (300°C/2h), clean the plate

**2. Cracks**
• Cause: Too rapid cooling, stresses
• Solution: Preheat, reduce speed

**3. Lack of Penetration**
• Cause: Insufficient current, speed too high
• Solution: Increase current, reduce speed

**4. Undercut**
• Cause: Voltage too high, incorrect angle
• Solution: Reduce voltage, adjust angle

**5. Slag Inclusions**
• Cause: Poor inter-pass cleaning
• Solution: Brush between each pass

**Quality Control:** Radiography (RT), Ultrasonic (UT), Magnetic Particle (MT)`,

      it: `**Difetti di saldatura comuni e soluzioni** ⚠️

**1. Porosità / Soffiature**
• Causa: Umidità nel flusso, contaminazione
• Soluzione: Asciugare il flusso (300°C/2h), pulire la lamiera

**2. Fessure**
• Causa: Raffreddamento troppo rapido, tensioni
• Soluzione: Preriscaldamento, ridurre la velocità

**3. Mancanza di penetrazione**
• Causa: Intensità insufficiente, velocità troppo alta
• Soluzione: Aumentare l'intensità, ridurre la velocità

**4. Incisioni marginali (undercut)**
• Causa: Tensione troppo alta, angolo errato
• Soluzione: Ridurre la tensione, regolare l'angolo

**5. Inclusioni di scoria**
• Causa: Pulizia inter-passata insufficiente
• Soluzione: Spazzolare tra ogni passata

**Controllo qualità:** Radiografia (RT), Ultrasuoni (UT), Magnetoscopia (MT)`,

      ar: `**عيوب اللحام الشائعة والحلول** ⚠️

**1. المسامية / الثقوب**
• السبب: رطوبة في التدفق، تلوث
• الحل: تجفيف التدفق (300 درجة مئوية/ساعتين)، تنظيف اللوحة

**2. الشقوق**
• السبب: تبريد سريع جداً، إجهادات
• الحل: التسخين المسبق، تقليل السرعة

**3. نقص الاختراق**
• السبب: شدة تيار غير كافية، سرعة عالية جداً
• الحل: زيادة الشدة، تقليل السرعة

**4. القطع السفلي (Undercut)**
• السبب: جهد مرتفع جداً، زاوية غير صحيحة
• الحل: تقليل الجهد، ضبط الزاوية

**5. شوائب الخبث**
• السبب: تنظيف ضعيف بين التمريرات
• الحل: التنظيف بين كل تمريرة

**مراقبة الجودة:** التصوير الإشعاعي (RT)، الموجات فوق الصوتية (UT)، الجسيمات المغناطيسية (MT)`
    }
  },

  // API 5L Standard
  api_5l: {
    keywords: {
      fr: ['api', '5l', 'norme', 'standard', 'specification', 'grade', 'psl'],
      en: ['api', '5l', 'standard', 'specification', 'grade', 'psl', 'norm'],
      it: ['api', '5l', 'norma', 'standard', 'specifica', 'grado', 'psl'],
      ar: ['api', '5l', 'معيار', 'مواصفة', 'درجة', 'psl']
    },
    response: {
      fr: `**Norme API 5L - Tubes de conduite** 📋

**Grades courants :**
| Grade | Limite élastique | Résistance |
|-------|------------------|------------|
| B | 241 MPa | 414 MPa |
| X42 | 290 MPa | 414 MPa |
| X52 | 359 MPa | 455 MPa |
| X60 | 414 MPa | 517 MPa |
| X65 | 448 MPa | 531 MPa |
| X70 | 483 MPa | 565 MPa |

**Niveaux PSL :**
• **PSL1** : Exigences standard
• **PSL2** : Exigences renforcées (chimie, essais)

**Essais obligatoires :**
• Traction, pliage, dureté
• Impact Charpy (PSL2)
• Contrôle non destructif 100%`,

      en: `**API 5L Standard - Line Pipes** 📋

**Common Grades:**
| Grade | Yield Strength | Tensile Strength |
|-------|----------------|------------------|
| B | 241 MPa | 414 MPa |
| X42 | 290 MPa | 414 MPa |
| X52 | 359 MPa | 455 MPa |
| X60 | 414 MPa | 517 MPa |
| X65 | 448 MPa | 531 MPa |
| X70 | 483 MPa | 565 MPa |

**PSL Levels:**
• **PSL1**: Standard requirements
• **PSL2**: Enhanced requirements (chemistry, testing)

**Mandatory Tests:**
• Tensile, bend, hardness
• Charpy impact (PSL2)
• 100% non-destructive testing`,

      it: `**Norma API 5L - Tubi di linea** 📋

**Gradi comuni:**
| Grado | Limite di snervamento | Resistenza |
|-------|----------------------|------------|
| B | 241 MPa | 414 MPa |
| X42 | 290 MPa | 414 MPa |
| X52 | 359 MPa | 455 MPa |
| X60 | 414 MPa | 517 MPa |
| X65 | 448 MPa | 531 MPa |
| X70 | 483 MPa | 565 MPa |

**Livelli PSL:**
• **PSL1**: Requisiti standard
• **PSL2**: Requisiti rafforzati (chimica, prove)

**Prove obbligatorie:**
• Trazione, piegatura, durezza
• Impatto Charpy (PSL2)
• Controllo non distruttivo 100%`,

      ar: `**معيار API 5L - أنابيب الخطوط** 📋

**الدرجات الشائعة:**
| الدرجة | قوة الخضوع | قوة الشد |
|--------|-----------|----------|
| B | 241 ميجاباسكال | 414 ميجاباسكال |
| X42 | 290 ميجاباسكال | 414 ميجاباسكال |
| X52 | 359 ميجاباسكال | 455 ميجاباسكال |
| X60 | 414 ميجاباسكال | 517 ميجاباسكال |
| X65 | 448 ميجاباسكال | 531 ميجاباسكال |
| X70 | 483 ميجاباسكال | 565 ميجاباسكال |

**مستويات PSL:**
• **PSL1**: متطلبات قياسية
• **PSL2**: متطلبات معززة (الكيمياء، الاختبارات)

**الاختبارات الإلزامية:**
• الشد، الانحناء، الصلابة
• صدمة شاربي (PSL2)
• اختبار غير إتلافي 100%`
    }
  },

  // Production steps
  etapes_production: {
    keywords: {
      fr: ['etape', 'production', 'processus', 'fabrication', '12 etapes'],
      en: ['step', 'production', 'process', 'manufacturing', '12 steps'],
      it: ['fase', 'produzione', 'processo', 'fabbricazione', '12 fasi'],
      ar: ['خطوة', 'إنتاج', 'عملية', 'تصنيع', '12 خطوة']
    },
    response: {
      fr: `**Les 12 étapes de production des tubes spirales** 🏭

1. **Réception bobine** - Contrôle matière première
2. **Déroulage** - Mise en place sur dérouleuse
3. **Planage** - Redressement de la tôle
4. **Cisaillage** - Découpe des rives
5. **Raboutage** - Soudure bout à bout des bobines
6. **Formage spiral** - Création de la forme tubulaire
7. **Soudage ID** - Soudure intérieure (2 passes)
8. **Soudage OD** - Soudure extérieure (2 passes)
9. **Coupe plasma** - Découpe à longueur
10. **Chanfreinage** - Préparation des extrémités
11. **Contrôle UT/RT** - Contrôle non destructif
12. **Expansion/Calibrage** - Dimensionnement final

**Temps moyen :** 15-45 min par tube selon diamètre`,

      en: `**12 Steps of Spiral Tube Production** 🏭

1. **Coil Reception** - Raw material inspection
2. **Uncoiling** - Placement on uncoiler
3. **Leveling** - Plate straightening
4. **Edge Trimming** - Edge cutting
5. **Coil Joining** - Butt welding of coils
6. **Spiral Forming** - Creating tubular shape
7. **ID Welding** - Interior welding (2 passes)
8. **OD Welding** - Exterior welding (2 passes)
9. **Plasma Cutting** - Cutting to length
10. **Beveling** - End preparation
11. **UT/RT Inspection** - Non-destructive testing
12. **Expansion/Calibration** - Final sizing

**Average Time:** 15-45 min per tube depending on diameter`,

      it: `**Le 12 fasi di produzione dei tubi a spirale** 🏭

1. **Ricevimento bobina** - Controllo materia prima
2. **Svolgimento** - Posizionamento sullo svolgitore
3. **Spianatura** - Raddrizzamento della lamiera
4. **Cesoiatura** - Taglio dei bordi
5. **Giuntatura** - Saldatura testa a testa delle bobine
6. **Formatura a spirale** - Creazione della forma tubolare
7. **Saldatura ID** - Saldatura interna (2 passate)
8. **Saldatura OD** - Saldatura esterna (2 passate)
9. **Taglio plasma** - Taglio a misura
10. **Smussatura** - Preparazione delle estremità
11. **Controllo UT/RT** - Controllo non distruttivo
12. **Espansione/Calibratura** - Dimensionamento finale

**Tempo medio:** 15-45 min per tubo secondo il diametro`,

      ar: `**12 خطوة لإنتاج الأنابيب الحلزونية** 🏭

1. **استلام اللفة** - فحص المواد الخام
2. **فك اللفة** - الوضع على جهاز الفك
3. **التسوية** - تقويم اللوحة
4. **قص الحواف** - قطع الحواف
5. **ربط اللفات** - لحام نهايات اللفات
6. **التشكيل الحلزوني** - إنشاء الشكل الأنبوبي
7. **لحام ID** - اللحام الداخلي (تمريرتان)
8. **لحام OD** - اللحام الخارجي (تمريرتان)
9. **قطع البلازما** - القطع حسب الطول
10. **الشطف** - تحضير النهايات
11. **فحص UT/RT** - الاختبار غير الإتلافي
12. **التوسيع/المعايرة** - التحجيم النهائي

**الوقت المتوسط:** 15-45 دقيقة لكل أنبوب حسب القطر`
    }
  },

  // Flux
  flux: {
    keywords: {
      fr: ['flux', 'poudre', 'agglomere', 'fondu'],
      en: ['flux', 'powder', 'agglomerated', 'fused'],
      it: ['flusso', 'polvere', 'agglomerato', 'fuso'],
      ar: ['تدفق', 'مسحوق', 'متكتل', 'منصهر']
    },
    response: {
      fr: `**Flux de soudure SAW** 🧪

**Types de flux :**

**1. Flux fondus**
• Fabrication : Fusion à haute température
• Avantages : Homogènes, faible hygroscopie
• Usage : Soudage haute vitesse

**2. Flux agglomérés**
• Fabrication : Liants + granulés
• Avantages : Ajout d'éléments d'alliage possible
• Usage : Applications spéciales

**Stockage et manipulation :**
• Température : 15-25°C
• Humidité : < 60%
• Étuvage : 300°C pendant 2h si exposé

**Granulométrie recommandée :**
• Gros grain : 2-0.5 mm
• Fin : 0.5-0.1 mm
• Ratio : 70/30 gros/fin`,

      en: `**SAW Welding Flux** 🧪

**Types of Flux:**

**1. Fused Flux**
• Manufacturing: High temperature fusion
• Advantages: Homogeneous, low hygroscopy
• Use: High-speed welding

**2. Agglomerated Flux**
• Manufacturing: Binders + granules
• Advantages: Alloying elements can be added
• Use: Special applications

**Storage and Handling:**
• Temperature: 15-25°C
• Humidity: < 60%
• Baking: 300°C for 2h if exposed

**Recommended Granulometry:**
• Coarse grain: 2-0.5 mm
• Fine: 0.5-0.1 mm
• Ratio: 70/30 coarse/fine`,

      it: `**Flusso di saldatura SAW** 🧪

**Tipi di flusso:**

**1. Flusso fuso**
• Fabbricazione: Fusione ad alta temperatura
• Vantaggi: Omogeneo, bassa igroscopicità
• Uso: Saldatura ad alta velocità

**2. Flusso agglomerato**
• Fabbricazione: Leganti + granuli
• Vantaggi: Possibilità di aggiungere elementi di lega
• Uso: Applicazioni speciali

**Stoccaggio e manipolazione:**
• Temperatura: 15-25°C
• Umidità: < 60%
• Essiccazione: 300°C per 2h se esposto

**Granulometria raccomandata:**
• Grano grosso: 2-0.5 mm
• Fine: 0.5-0.1 mm
• Rapporto: 70/30 grosso/fine`,

      ar: `**تدفق لحام SAW** 🧪

**أنواع التدفق:**

**1. التدفق المنصهر**
• التصنيع: انصهار بدرجة حرارة عالية
• المزايا: متجانس، قليل الاستهوائية
• الاستخدام: لحام عالي السرعة

**2. التدفق المتكتل**
• التصنيع: روابط + حبيبات
• المزايا: إمكانية إضافة عناصر السبائك
• الاستخدام: تطبيقات خاصة

**التخزين والمعاملة:**
• درجة الحرارة: 15-25 درجة مئوية
• الرطوبة: أقل من 60%
• التجفيف: 300 درجة مئوية لمدة ساعتين إذا تعرض

**الحجم الحبيبي الموصى به:**
• حبيبات خشنة: 2-0.5 مم
• ناعمة: 0.5-0.1 مم
• النسبة: 70/30 خشن/ناعم`
    }
  },

  // Parameters
  parametres: {
    keywords: {
      fr: ['parametre', 'reglage', 'setting', 'intensite', 'tension', 'vitesse', 'courant'],
      en: ['parameter', 'setting', 'current', 'voltage', 'speed', 'amperage'],
      it: ['parametro', 'impostazione', 'intensita', 'tensione', 'velocita', 'corrente'],
      ar: ['معلمة', 'إعداد', 'شدة', 'جهد', 'سرعة', 'تيار']
    },
    response: {
      fr: `**Paramètres de soudage SAW** ⚙️

**Influence des paramètres :**

**Intensité (A) ↑**
• Pénétration ↑
• Largeur cordon ↗
• Taux de dépôt ↑

**Tension (V) ↑**
• Largeur cordon ↑
• Pénétration ↘
• Consommation flux ↑

**Vitesse (m/min) ↑**
• Pénétration ↓
• Largeur cordon ↓
• Productivité ↑

**Formule de référence :**
Apport thermique (kJ/mm) = (V × I × 60) / (S × 1000)

**Conseil :** Toujours valider avec un DMOS/WPS qualifié.`,

      en: `**SAW Welding Parameters** ⚙️

**Parameter Influence:**

**Current (A) ↑**
• Penetration ↑
• Bead width ↗
• Deposition rate ↑

**Voltage (V) ↑**
• Bead width ↑
• Penetration ↘
• Flux consumption ↑

**Speed (m/min) ↑**
• Penetration ↓
• Bead width ↓
• Productivity ↑

**Reference Formula:**
Heat Input (kJ/mm) = (V × I × 60) / (S × 1000)

**Tip:** Always validate with a qualified WPS/PQR.`,

      it: `**Parametri di saldatura SAW** ⚙️

**Influenza dei parametri:**

**Intensità (A) ↑**
• Penetrazione ↑
• Larghezza cordone ↗
• Tasso di deposito ↑

**Tensione (V) ↑**
• Larghezza cordone ↑
• Penetrazione ↘
• Consumo flusso ↑

**Velocità (m/min) ↑**
• Penetrazione ↓
• Larghezza cordone ↓
• Produttività ↑

**Formula di riferimento:**
Apporto termico (kJ/mm) = (V × I × 60) / (S × 1000)

**Consiglio:** Sempre validare con un WPS/PQR qualificato.`,

      ar: `**معلمات لحام SAW** ⚙️

**تأثير المعلمات:**

**شدة التيار (A) ↑**
• الاختراق ↑
• عرض الخرزة ↗
• معدل الترسيب ↑

**الجهد (V) ↑**
• عرض الخرزة ↑
• الاختراق ↘
• استهلاك التدفق ↑

**السرعة (م/دقيقة) ↑**
• الاختراق ↓
• عرض الخرزة ↓
• الإنتاجية ↑

**صيغة مرجعية:**
المدخل الحراري (كيلوجول/مم) = (V × I × 60) / (S × 1000)

**نصيحة:** تحقق دائماً مع WPS/PQR مؤهل.`
    }
  },

  // Quality control
  controle: {
    keywords: {
      fr: ['controle', 'qualite', 'ndt', 'radiographie', 'ultrason', 'test', 'essai'],
      en: ['control', 'quality', 'ndt', 'radiography', 'ultrasonic', 'test', 'inspection'],
      it: ['controllo', 'qualita', 'ndt', 'radiografia', 'ultrasuoni', 'test', 'prova'],
      ar: ['مراقبة', 'جودة', 'ndt', 'تصوير إشعاعي', 'موجات فوق صوتية', 'اختبار', 'فحص']
    },
    response: {
      fr: `**Contrôle qualité des tubes spirales** 🔍

**Contrôles Non Destructifs (CND) :**

**1. Ultrasons (UT)**
• Détection : Défauts internes, manque de fusion
• Couverture : 100% du cordon
• Seuil : Généralement 50% DAC

**2. Radiographie (RT)**
• Détection : Porosités, inclusions
• Usage : Soudures bout à bout
• Norme : ISO 10675 / ASME V

**3. Magnétoscopie (MT)**
• Détection : Fissures de surface
• Usage : Extrémités, zones réparées

**4. Ressuage (PT)**
• Détection : Défauts débouchants
• Usage : Aciers inoxydables

**Essais destructifs :**
• Traction, pliage guidé, Charpy
• Macrographie, dureté HV10`,

      en: `**Spiral Tube Quality Control** 🔍

**Non-Destructive Testing (NDT):**

**1. Ultrasonic (UT)**
• Detection: Internal defects, lack of fusion
• Coverage: 100% of weld seam
• Threshold: Usually 50% DAC

**2. Radiography (RT)**
• Detection: Porosity, inclusions
• Use: Butt welds
• Standard: ISO 10675 / ASME V

**3. Magnetic Particle (MT)**
• Detection: Surface cracks
• Use: Ends, repaired areas

**4. Dye Penetrant (PT)**
• Detection: Surface-breaking defects
• Use: Stainless steels

**Destructive Tests:**
• Tensile, guided bend, Charpy
• Macro examination, HV10 hardness`,

      it: `**Controllo qualità dei tubi a spirale** 🔍

**Controlli Non Distruttivi (CND):**

**1. Ultrasuoni (UT)**
• Rilevamento: Difetti interni, mancanza di fusione
• Copertura: 100% del cordone
• Soglia: Generalmente 50% DAC

**2. Radiografia (RT)**
• Rilevamento: Porosità, inclusioni
• Uso: Saldature testa a testa
• Norma: ISO 10675 / ASME V

**3. Magnetoscopia (MT)**
• Rilevamento: Fessure superficiali
• Uso: Estremità, zone riparate

**4. Liquidi penetranti (PT)**
• Rilevamento: Difetti affioranti
• Uso: Acciai inossidabili

**Prove distruttive:**
• Trazione, piegatura guidata, Charpy
• Macrografia, durezza HV10`,

      ar: `**مراقبة جودة الأنابيب الحلزونية** 🔍

**الاختبارات غير الإتلافية (NDT):**

**1. الموجات فوق الصوتية (UT)**
• الكشف: العيوب الداخلية، نقص الانصهار
• التغطية: 100% من خط اللحام
• العتبة: عادة 50% DAC

**2. التصوير الإشعاعي (RT)**
• الكشف: المسامية، الشوائب
• الاستخدام: لحام نهاية إلى نهاية
• المعيار: ISO 10675 / ASME V

**3. الجسيمات المغناطيسية (MT)**
• الكشف: شقوق السطح
• الاستخدام: النهايات، المناطق المصلحة

**4. اختبار الاختراق (PT)**
• الكشف: العيوب السطحية
• الاستخدام: الفولاذ المقاوم للصدأ

**الاختبارات الإتلافية:**
• الشد، الانحناء الموجه، شاربي
• الفحص الماكروي، صلابة HV10`
    }
  },

  // Repairs
  reparation: {
    keywords: {
      fr: ['reparation', 'reparer', 'gougeage', 'meulage', 'reprise'],
      en: ['repair', 'fix', 'gouging', 'grinding', 'rework'],
      it: ['riparazione', 'riparare', 'scriccatura', 'molatura', 'ripresa'],
      ar: ['إصلاح', 'ترميم', 'حفر', 'طحن', 'إعادة العمل']
    },
    response: {
      fr: `**Procédure de réparation des soudures** 🔧

**Étapes de réparation :**

1. **Identification du défaut**
   • Marquage précis de la zone
   • Documentation photographique

2. **Élimination du défaut**
   • Gougeage arc-air ou meulage
   • Profondeur : défaut + 2mm mini

3. **Préparation**
   • Contrôle MT/PT après gougeage
   • Chanfrein adapté (30-45°)

4. **Ressoudage**
   • Même WPS que soudure initiale
   • Préchauffage si nécessaire

5. **Contrôle final**
   • CND 100% de la zone réparée
   • Documentation complète

**Limite :** Max 2 réparations au même endroit`,

      en: `**Weld Repair Procedure** 🔧

**Repair Steps:**

1. **Defect Identification**
   • Precise marking of the area
   • Photographic documentation

2. **Defect Removal**
   • Air-arc gouging or grinding
   • Depth: defect + 2mm minimum

3. **Preparation**
   • MT/PT inspection after gouging
   • Appropriate bevel (30-45°)

4. **Re-welding**
   • Same WPS as original weld
   • Preheat if necessary

5. **Final Inspection**
   • 100% NDT of repaired area
   • Complete documentation

**Limit:** Max 2 repairs at the same location`,

      it: `**Procedura di riparazione delle saldature** 🔧

**Fasi di riparazione:**

1. **Identificazione del difetto**
   • Marcatura precisa della zona
   • Documentazione fotografica

2. **Eliminazione del difetto**
   • Scriccatura ad arco o molatura
   • Profondità: difetto + 2mm minimo

3. **Preparazione**
   • Controllo MT/PT dopo scriccatura
   • Cianfrino adeguato (30-45°)

4. **Risaldatura**
   • Stesso WPS della saldatura originale
   • Preriscaldo se necessario

5. **Controllo finale**
   • CND 100% della zona riparata
   • Documentazione completa

**Limite:** Max 2 riparazioni nello stesso punto`,

      ar: `**إجراء إصلاح اللحام** 🔧

**خطوات الإصلاح:**

1. **تحديد العيب**
   • تحديد دقيق للمنطقة
   • توثيق فوتوغرافي

2. **إزالة العيب**
   • حفر بالقوس الهوائي أو الطحن
   • العمق: العيب + 2 مم كحد أدنى

3. **التحضير**
   • فحص MT/PT بعد الحفر
   • شطف مناسب (30-45°)

4. **إعادة اللحام**
   • نفس WPS للحام الأصلي
   • التسخين المسبق إذا لزم الأمر

5. **الفحص النهائي**
   • NDT 100% للمنطقة المصلحة
   • توثيق كامل

**الحد:** أقصى إصلاحين في نفس المكان`
    }
  },

  // Safety
  securite: {
    keywords: {
      fr: ['securite', 'epi', 'protection', 'danger', 'risque'],
      en: ['safety', 'ppe', 'protection', 'danger', 'risk', 'hazard'],
      it: ['sicurezza', 'dpi', 'protezione', 'pericolo', 'rischio'],
      ar: ['سلامة', 'معدات حماية', 'حماية', 'خطر', 'مخاطر']
    },
    response: {
      fr: `**Sécurité en soudage SAW** 🛡️

**EPI obligatoires :**
• Masque de soudeur (DIN 10-13)
• Gants cuir haute température
• Tablier/veste ignifugé
• Chaussures de sécurité S3
• Bouchons d'oreilles

**Risques principaux :**
⚠️ Brûlures (métal en fusion, UV)
⚠️ Fumées de soudage (ventilation !)
⚠️ Électrocution
⚠️ Incendie (flux, projections)

**Bonnes pratiques :**
• Ventilation/aspiration obligatoire
• Zone dégagée 10m autour
• Extincteur à proximité
• Permis de feu si nécessaire
• Contrôle électrique régulier`,

      en: `**SAW Welding Safety** 🛡️

**Mandatory PPE:**
• Welding helmet (DIN 10-13)
• High-temperature leather gloves
• Fire-resistant apron/jacket
• S3 safety shoes
• Ear plugs

**Main Hazards:**
⚠️ Burns (molten metal, UV)
⚠️ Welding fumes (ventilation!)
⚠️ Electrocution
⚠️ Fire (flux, spatter)

**Best Practices:**
• Mandatory ventilation/extraction
• 10m clear zone around
• Fire extinguisher nearby
• Hot work permit if required
• Regular electrical inspection`,

      it: `**Sicurezza nella saldatura SAW** 🛡️

**DPI obbligatori:**
• Maschera da saldatore (DIN 10-13)
• Guanti in pelle alta temperatura
• Grembiule/giacca ignifuga
• Scarpe antinfortunistiche S3
• Tappi per le orecchie

**Rischi principali:**
⚠️ Ustioni (metallo fuso, UV)
⚠️ Fumi di saldatura (ventilazione!)
⚠️ Elettrocuzione
⚠️ Incendio (flusso, spruzzi)

**Buone pratiche:**
• Ventilazione/aspirazione obbligatoria
• Zona libera 10m intorno
• Estintore nelle vicinanze
• Permesso di lavoro a caldo se necessario
• Controllo elettrico regolare`,

      ar: `**السلامة في لحام SAW** 🛡️

**معدات الحماية الشخصية الإلزامية:**
• خوذة لحام (DIN 10-13)
• قفازات جلدية عالية الحرارة
• مريلة/سترة مقاومة للحريق
• أحذية سلامة S3
• سدادات أذن

**المخاطر الرئيسية:**
⚠️ حروق (معدن منصهر، أشعة فوق بنفسجية)
⚠️ أبخرة اللحام (تهوية!)
⚠️ صعق كهربائي
⚠️ حريق (تدفق، رذاذ)

**أفضل الممارسات:**
• تهوية/شفط إلزامي
• منطقة خالية 10 أمتار حولها
• طفاية حريق قريبة
• تصريح عمل ساخن إذا لزم الأمر
• فحص كهربائي منتظم`
    }
  }
};

// Default responses per language
const DEFAULT_RESPONSES = {
  fr: [
    `Je suis **Boualam**, votre assistant expert en soudure et production de tubes spirales. 🔧

Je peux vous aider sur les sujets suivants :
• **Soudage SAW** - Paramètres, réglages, 4 têtes
• **Défauts** - Identification et solutions
• **Norme API 5L** - Grades, exigences
• **Processus** - Les 12 étapes de production
• **Contrôle qualité** - CND, essais
• **Réparations** - Procédures
• **Sécurité** - EPI, bonnes pratiques

Posez-moi votre question ! 💬`,

    `Je n'ai pas trouvé d'information précise sur ce sujet. Essayez de reformuler votre question avec des mots-clés comme :
• "soudure SAW", "paramètres", "têtes"
• "défaut", "porosité", "fissure"
• "API 5L", "grade", "norme"
• "étapes production", "contrôle qualité"

Je suis là pour vous aider ! 🤝`
  ],
  en: [
    `I'm **Boualam**, your expert assistant for welding and spiral tube production. 🔧

I can help you with the following topics:
• **SAW Welding** - Parameters, settings, 4 heads
• **Defects** - Identification and solutions
• **API 5L Standard** - Grades, requirements
• **Process** - The 12 production steps
• **Quality Control** - NDT, testing
• **Repairs** - Procedures
• **Safety** - PPE, best practices

Ask me your question! 💬`,

    `I couldn't find precise information on this topic. Try rephrasing your question with keywords like:
• "SAW welding", "parameters", "heads"
• "defect", "porosity", "crack"
• "API 5L", "grade", "standard"
• "production steps", "quality control"

I'm here to help! 🤝`
  ],
  it: [
    `Sono **Boualam**, il tuo assistente esperto per la saldatura e la produzione di tubi a spirale. 🔧

Posso aiutarti sui seguenti argomenti:
• **Saldatura SAW** - Parametri, impostazioni, 4 teste
• **Difetti** - Identificazione e soluzioni
• **Norma API 5L** - Gradi, requisiti
• **Processo** - Le 12 fasi di produzione
• **Controllo qualità** - CND, prove
• **Riparazioni** - Procedure
• **Sicurezza** - DPI, buone pratiche

Fammi la tua domanda! 💬`,

    `Non ho trovato informazioni precise su questo argomento. Prova a riformulare la tua domanda con parole chiave come:
• "saldatura SAW", "parametri", "teste"
• "difetto", "porosità", "fessura"
• "API 5L", "grado", "norma"
• "fasi produzione", "controllo qualità"

Sono qui per aiutarti! 🤝`
  ],
  ar: [
    `أنا **بوعلام**، مساعدك الخبير في اللحام وإنتاج الأنابيب الحلزونية. 🔧

يمكنني مساعدتك في المواضيع التالية:
• **لحام SAW** - المعلمات، الإعدادات، 4 رؤوس
• **العيوب** - التحديد والحلول
• **معيار API 5L** - الدرجات، المتطلبات
• **العملية** - 12 خطوة الإنتاج
• **مراقبة الجودة** - NDT، الاختبارات
• **الإصلاحات** - الإجراءات
• **السلامة** - معدات الحماية، أفضل الممارسات

اطرح سؤالك! 💬`,

    `لم أجد معلومات دقيقة حول هذا الموضوع. حاول إعادة صياغة سؤالك بكلمات مفتاحية مثل:
• "لحام SAW"، "معلمات"، "رؤوس"
• "عيب"، "مسامية"، "شق"
• "API 5L"، "درجة"، "معيار"
• "خطوات الإنتاج"، "مراقبة الجودة"

أنا هنا للمساعدة! 🤝`
  ]
};

// Function to find the best response
const findBestResponse = (question, lang) => {
  const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let bestMatch = null;
  let maxScore = 0;

  for (const [key, data] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    const keywords = data.keywords[lang] || data.keywords.en;
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (q.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = data.response[lang] || data.response.en;
    }
  }

  return bestMatch;
};

export default function BoualamChat({ isOpen, onClose }) {
  const [lang, setLang] = useState('fr');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: DEFAULT_RESPONSES.fr[0],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const langMenuRef = useRef(null);

  const ui = UI_TRANSLATIONS[lang];
  const isRTL = LANGUAGES[lang].dir === 'rtl';
  const CurrentFlag = LANGUAGES[lang].Flag;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto fullscreen on mobile when opened
  useEffect(() => {
    if (isOpen && isMobile) {
      setIsFullscreen(true);
    }
  }, [isOpen, isMobile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when opened (desktop only)
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, isMobile]);

  // Prevent body scroll when fullscreen on mobile
  useEffect(() => {
    if (isFullscreen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isFullscreen, isMobile]);

  // Close language menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Change language
  const changeLanguage = (newLang) => {
    setLang(newLang);
    setShowLangMenu(false);
    // Update initial message to new language
    setMessages([{
      id: Date.now(),
      type: 'bot',
      content: DEFAULT_RESPONSES[newLang][0],
      timestamp: new Date()
    }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = findBestResponse(userMessage.content, lang) || DEFAULT_RESPONSES[lang][1];

    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: response,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: DEFAULT_RESPONSES[lang][0],
        timestamp: new Date()
      }
    ]);
  };

  const handleCopy = (content, id) => {
    const plainText = content.replace(/\*\*/g, '').replace(/[•✅⚠️🔥🎯📋🏭🧪⚙️🔍🔧🛡️💬🤝]/g, '');
    navigator.clipboard.writeText(plainText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatContent = (content) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h4 key={i} className="font-bold text-violet-700 mt-3 mb-2 text-base sm:text-lg">{line.replace(/\*\*/g, '')}</h4>;
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="my-1 text-[15px] sm:text-base leading-relaxed text-gray-700">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-violet-600 font-semibold">{part.replace(/\*\*/g, '')}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      });
  };

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const toggleFullscreen = () => {
    if (isMobile) {
      if (isFullscreen) {
        handleClose();
      }
    } else {
      setIsFullscreen(!isFullscreen);
      setIsMinimized(false);
    }
  };

  if (!isOpen) return null;

  const getContainerClasses = () => {
    if (isMinimized) {
      return 'bottom-4 right-4 w-72 h-auto';
    }
    if (isFullscreen || isMobile) {
      return 'inset-0 w-full h-full rounded-none';
    }
    return 'bottom-4 right-4 w-[95vw] sm:w-[420px] md:w-[480px] h-[85vh] sm:h-[600px] max-h-[700px]';
  };

  return (
    <div 
      ref={chatContainerRef}
      className={`fixed z-50 transition-all duration-300 ease-out ${getContainerClasses()}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden h-full ${isFullscreen || isMobile ? 'rounded-none' : 'rounded-2xl'}`}>
        
        {/* Header - Violet gradient kept for brand identity */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-3 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between flex-shrink-0 safe-area-top">
          <div className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className={`font-bold text-white flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                Boualam
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
              </h3>
              <p className="text-[12px] sm:text-sm text-violet-100 truncate font-medium">{ui.assistant}</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className={`flex items-center gap-1 sm:gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors flex items-center gap-2"
                title={ui.selectLanguage}
              >
                <CurrentFlag />
                <Globe className="w-4 h-4 text-white/80" />
              </button>
              
              {showLangMenu && (
                <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 min-w-[180px] ${isRTL ? 'left-0' : 'right-0'}`}>
                  {Object.entries(LANGUAGES).map(([code, { name, Flag }]) => (
                    <button
                      key={code}
                      onClick={() => changeLanguage(code)}
                      className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-violet-50 transition-colors ${lang === code ? 'bg-violet-100 text-violet-700' : 'text-gray-700'} ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Flag />
                      <span className="text-sm font-medium whitespace-nowrap">{name}</span>
                      {lang === code && (
                        <Check className={`w-4 h-4 text-violet-600 ${isRTL ? 'mr-auto' : 'ml-auto'}`} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors"
              title={ui.reset}
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
            {!isMobile && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors"
                title={isMinimized ? ui.maximize : ui.minimize}
              >
                {isMinimized ? <Maximize2 className="w-5 h-5 text-white" /> : <Minimize2 className="w-5 h-5 text-white" />}
              </button>
            )}
            {!isMobile && !isMinimized && (
              <button
                onClick={toggleFullscreen}
                className="p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors"
                title={isFullscreen ? ui.minimize : ui.fullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
              </button>
            )}
            <button
              onClick={handleClose}
              className={`p-2 sm:p-2.5 hover:bg-white/20 active:bg-white/30 rounded-xl transition-colors ${isRTL ? 'mr-1' : 'ml-1'}`}
              title={ui.close}
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages area - Light theme */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-sm ${
                      msg.type === 'user'
                        ? `bg-gradient-to-br from-violet-600 to-purple-600 text-white ${isRTL ? 'rounded-bl-md' : 'rounded-br-md'}`
                        : `bg-white border border-gray-100 text-gray-800 ${isRTL ? 'rounded-br-md' : 'rounded-bl-md'} shadow-md`
                    }`}
                  >
                    {msg.type === 'bot' && (
                      <div className={`flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-violet-600 flex-shrink-0" />
                        </div>
                        <span className="text-sm font-semibold text-violet-700">Boualam</span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className={`p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors ${isRTL ? 'mr-auto' : 'ml-auto'}`}
                          title={ui.copy}
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                    <div className={`text-[15px] sm:text-base leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                      {msg.type === 'bot' ? formatContent(msg.content) : msg.content}
                    </div>
                    <div className={`text-[11px] sm:text-xs mt-2.5 ${msg.type === 'user' ? 'text-violet-200' : 'text-gray-400'} ${isRTL ? 'text-left' : 'text-right'}`}>
                      {msg.timestamp.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : lang === 'it' ? 'it-IT' : lang === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                  <div className={`bg-white border border-gray-100 shadow-md rounded-2xl ${isRTL ? 'rounded-br-md' : 'rounded-bl-md'} px-5 py-4`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area - Light theme */}
            <div className="p-4 sm:p-5 border-t border-gray-100 flex-shrink-0 safe-area-bottom bg-white">
              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={ui.placeholder}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-[16px] sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:from-violet-700 active:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white p-3.5 sm:p-4 rounded-xl transition-all flex-shrink-0 shadow-lg shadow-violet-200 disabled:shadow-none"
                >
                  <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {!isMobile && (
                <p className="text-[12px] text-gray-400 mt-3 text-center font-medium">
                  {ui.footer}
                </p>
              )}
            </div>
          </>
        )}

        {/* Minimized state */}
        {isMinimized && (
          <div className="p-4 text-center bg-gray-50">
            <p className="text-sm text-gray-600">{ui.reopenChat}</p>
            <button
              onClick={() => setIsMinimized(false)}
              className="mt-2 text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1 mx-auto"
            >
              <ChevronDown className="w-4 h-4" />
              {ui.seeMessages}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating button
export function BoualamButton({ onClick }) {
  const [pulse, setPulse] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    setPulse(false);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed z-40 group transition-all duration-300 ease-out ${
        isVisible 
          ? 'bottom-20 sm:bottom-6 right-4 sm:right-6 opacity-100 translate-y-0' 
          : 'bottom-20 sm:bottom-6 right-4 sm:right-6 opacity-0 translate-y-16 pointer-events-none'
      } ${pulse ? 'animate-bounce' : ''}`}
      title="Boualam - AI Assistant"
      aria-label="Open Boualam AI Assistant"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-violet-500 rounded-full blur-lg opacity-40 sm:opacity-50 group-hover:opacity-75 transition-opacity"></div>
        
        <div className="relative bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 active:from-violet-700 active:to-purple-800 text-white p-4 sm:p-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95">
          <Bot className="w-7 h-7 sm:w-7 sm:h-7" />
        </div>

        <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1 shadow-md">
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span>IA</span>
        </div>
      </div>
    </button>
  );
}

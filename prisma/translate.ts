/**
 * Comprehensive trilingual translation update.
 * Adds Swahili (sw) + Arabic (ar) translations to ALL content in the database.
 * Run: bun run prisma/translate.ts
 */
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

// ── Site Settings translations ──────────────────────────────────────────────
const SETTINGS_TR: Record<string, any> = {
  tagline: {
    sw: "Taasisi ya Kiislamu yenye mwanzo nchini Tanzania, iliyoanzishwa kwa dira ya kufufua mafundisho halisi ya Kiislamu na kukuza maendeleo ya vijana ndani ya imani.",
    ar: "مؤسسة إسلامية رائدة في تنزانيا، تأسست برؤية إحياء التعاليم الإسلامية الأصيلة وتعزيز تنمية الشباب ضمن الإيمان.",
  },
  mission: {
    sw: "Kulea kizazi cha vijana waliopata elimu, wenye nidhamu, wanaoshikamana na mafunzo ya Kiislamu kwa kuunganisha elimu, malezi na huduma za kijamii.",
    ar: "غرس جيل من الشباب المتعلم المنضبط الملتزم بالتعاليم الإسلامية من خلال دمج التعليم والتربية والخدمات الاجتماعية.",
  },
  vision: {
    sw: "Kuwa mfano wa taasisi bora ya Kiislamu inayotoa elimu bora na programu za malezi kwa vijana na jamii ili kuleta ustawi wa kiroho na kiakili kulingana na tafsiri ya Kiislamu kama ilivyoongozwa na wema wa miongo.",
    ar: "أن نكون نموذجاً لمؤسسة إسلامية متميزة تقدم تعليماً عالي الجودة وبرامج تنشئة للشباب والمجتمع لتحقيق الازدهار الروحي والفكري وفق تفسير الإسلام كما هدى به السلف الصالح.",
  },
}

// ── Article translations ────────────────────────────────────────────────────
const ARTICLE_TR: Record<string, any> = {
  "amyc-distributes-zakatul-fitr-1350kg-rice": {
    sw: {
      title: "AMYC Inagawa Zaidi ya Kg 1,350 za Mchele kama Zakatul Fitr",
      excerpt: "Kituo cha Vijana wa Kiislamu cha Ansaar kimegawa zaidi ya kilo 1,350 za mchele kama Zakatul Fitr kwa familia katika Majimbo yake.",
      content: "Sehemu ya programu yake ya mwaka ya ustawi, Kituo cha Vijana wa Kiislamu cha Ansaar (AMYC) kimegawa zaidi ya kilo 1,350 za mchele kama Zakatul Fitr kwa familia dhaifu katika mtandao wake wa Majimbo. Uwgawanyi, ulioratibiwa kupitia matawi ya kikanda, ulihakikisha familia zinaweza kusherehekea Eid al-Fitr kwa heshima. Kitengo cha ustawi cha AMYC hufanya kazi mwaka mzima kutambua familia dhaifu na kutoa msaada kwa njia inayoheshimu utamaduni.",
    },
    ar: {
      title: "المركز يوزع أكثر من 1,350 كيلوغرام من الأرز كزكاة الفطر",
      excerpt: "وزع مركز شباب الأنصار المسلمين أكثر من 1,350 كيلوغرام من الأرز كزكاة الفطر على العائلات في مناطقه.",
      content: "كجزء من برنامج الرعاية السنوي، وزع مركز شباب الأنصار المسلمين (AMYC) أكثر من 1,350 كيلوغرام من الأرز كزكاة الفطر على الأسر المحتاجة في جميع أنحاء شبكة مناطقه. تم التنسيق للتوزيع عبر الفروع الإقليمية، لضمان قدرة الأسر على الاحتفال بعيد الفطر بكرامة. يعمل ذراع الرعاية في المركز على مدار العام لتحديد الأسر الضعيفة وتقديم الدعم بطريقة تليق بالثقافة.",
    },
  },
  "tanga-ras-speaks-on-hijab-importance": {
    sw: {
      title: "Katibu Tawala Mkoa wa Tanga Anazungumzia Umuhimu wa Hijabu",
      excerpt: "Katibu Tawala Mkoa wa Tanga aliwahutubia jamii kuhusu nafasi ya hijabu katika kuimarisha maadili na usalama.",
      content: "Katibu Tawala Mkoa wa Tanga alihoji mhadhara wa umma, ulioandaliwa chini ya programu ya da'wah ya AMYC, kuhusu umuhimu wa hijabu katika kuimarisha tabia nzuri na usalama wa kibinafsi. Mhadhara huu ulikuwa sehemu ya mfululizo wa mishahara ya jamii inayolenga kuimarisha maadili ya Kiislamu na uelewa wa umma.",
    },
    ar: {
      title: "أمين عام إقليم تانغا يتحدث عن أهمية الحجاب",
      excerpt: "خاطب أمين عام إقليم تانغا المجتمع حول دور الحجاب في تعزيز الأخلاق والسلامة.",
      content: "ألقى أمين عام إقليم تانغا محاضرة عامة، نظمت ضمن برنامج الدعوة في المركز، حول أهمية الحجاب في تعزيز الأخلاق والسلامة الشخصية. شكلت المحاضرة جزءاً من سلسلة من الفعاليات المجتمعية التي تهدف إلى تعزيز القيم الإسلامية والوعي العام.",
    },
  },
  "amyc-school-heads-receive-modern-guidelines": {
    sw: {
      title: "Wakuu wa Shule za AMYC Wapata Miongozo ya Kisasa",
      excerpt: "Wakuu wa shule za AMYC walikusanyika kwa kikao cha ujengeaji uwezo kupokea miongozo ya kisasa ya usimamizi na ufundishaji.",
      content: "Wakuu wa shule za AMYC kote mtandaoni walikusanyika kwa programu ya ujengeaji uwezo kupokea miongozo ya kisasa za usimamizi na ufundishaji. Mwanzo huu unaakisi azimio la AMYC la kuboresha endelevu ubora wa elimu katika taasisi zake zaidi ya 25, kwa kuunganisha elimu ya Kiislamu ya kweli na viwango vya kisasa vya kitaaluma.",
    },
    ar: {
      title: "مديرو مدارس المركز يتلقون إرشادات حديثة",
      excerpt: "اجتمع مديرو مدارس المركز في جلسة بناء قدرات لتلقي إرشادات حديثة في الإدارة والتعليم.",
      content: "اجتمع مديرو مدارس المركز عبر الشبكة في برنامج بناء قدرات لتلقي إرشادات حديثة في الإدارة والتربية. يعكس هذا الإinitiative التزام المركز بالتحسين المستمر لجودة التعليم في أكثر من 25 مؤسسة، من خلال دمج المعرفة الإسلامية الأصيلة مع المعايير الأكاديمية الحديثة.",
    },
  },
  "eid-al-fitr-wednesday-moon-not-sighted": {
    sw: {
      title: "Eid al-Fitr Itasherehekewa Jumatano — Mwezi Haukuonekana",
      excerpt: "Mwezi haukuonekana; Eid al-Fitr itasherehekewa Jumatano. AMYC inawapongeza jamii Eid njema.",
      content: "Kufuatia hitimishwa ya Ramadhan na kutokwa kuonekana kwa mwezi wa Shawwal, Eid al-Fitr itasherehekewa Jumatano. Kituo cha Vijana wa Kiislamu cha Ansaar kinawapongeza Waislamu wote Eid njema. Mwenyezi Mungu atakubali funga, sala na matendo mema yetu. Sala za Eid zitafanyika kwenye misikiti ya AMYC na maeneo maalum kote Majimbo.",
    },
    ar: {
      title: "عيد الفطر سيكون يوم الأربعاء — لم يُرَ الهلال",
      excerpt: "لم يُرَ الهلال؛ سيكون عيد الفطر يوم الأربعاء. يهنئ المركز المجتمع بعيد سعيد.",
      content: "إثر انتهاء شهر رمضان وعدم رؤية هلال شوال، سيُحتفل بعيد الفطر يوم الأربعاء. يهنئ مركز شباب الأنصار المسلمين جميع المسلمين بعيد سعيد. نسأل الله أن يتقبل صيامنا وصلاتنا وأعمالنا الصالحة. ستُقام صلاة العيد في مساجد المركز والأماكن المخصصة في جميع المناطق.",
    },
  },
  "community-iftar-programme-ramadan": {
    sw: {
      title: "Programu ya Iftar ya Jamii — Udhamini wa Ramadhan Umeanza",
      excerpt: "AMYC na Majimbo yake anaandaa Iftar za jamii katika mikoa mitano. Udhamini umefunguliwa.",
      content: "Wakati wa mwezi mtukufu wa Ramadhan, AMYC na Majimbo yake huandaa programu za Iftar za jamii katika mikoa ya Tanga, Mtwara, Kagera, Ruvuma na Singida. Wanajamii na wafadhili wanaalikwa kudhamini Iftar. Michango inaweza kutumwa kupitia makao makuu ya AMYC au tawi lolote la kikanda.",
    },
    ar: {
      title: "برنامج إفطار جماعي — رمضان — فُتح الرعاية",
      excerpt: "ينظم المركز ومناطقه إفطارات جماعية في خمس مناطق. الرعاية متاحة.",
      content: "خلال شهر رمضان المبارك، ينظم المركز ومناطقه برنامج الإفطار الجماعي في مناطق تانغا ومتوارا وكاغيرا وروفوما وسينغيدا. تُدعى أفراد المجتمع والمحسنون لرعاية إفطار. يمكن توجيه المساهمات عبر المقر الرئيسي للمركز أو أي فرع إقليمي.",
    },
  },
  "annual-general-meeting-call-to-delegates": {
    sw: {
      title: "Mkutano Mkuu wa Mwaka — Wito kwa Ajili Wajumbe",
      excerpt: "Mawenyekiti wote wa matawi na wajumbe wa AMYC wanaalikwa kwenye Mkutano Mkuu wa Mwaka makao makuu Tanga.",
      content: "Mkutano Mkuu wa Mwaka wa Kituo cha Vijana wa Kiislamu cha Ansaar utafanyika makao makuu Tanga. Mawenyekiti wote wa matawi na wajumbe wanaalikwa kuhudhuria. Ajenda ni pamoja na kuwasilisha ripoti ya mwaka, taarifa zilizokaguliwa za kifedha, mapitio ya programu, na uchaguzi kulingana na katiba ya AMYC na kanuni za Kiislamu.",
    },
    ar: {
      title: "الاجتماع العام السنوي — دعوة للمندوبين",
      excerpt: "يُدعى جميع رؤساء الفروع والمندوبين إلى الاجتماع العام السنوي في المقر الرئيسي بتانغا.",
      content: "يعقد الاجتماع العام السنوي لمركز شباب الأنصار المسلمين في المقر الرئيسي بتانغا. يُدعى جميع رؤساء الفروع والمندوبين للحضور. تشمل جدول الأعمال تقديم التقرير السنوي والبيانات المالية المدققة ومراجعة البرامج والانتخابات وفقاً لدستور المركز ومبادئ الإسلام.",
    },
  },
  "scholarships-announced-for-orphaned-students": {
    sw: {
      title: "Ufadhuli wa Masomo Umetangazwa kwa Wanafunzi Yatima",
      excerpt: "AMYC inatoa ufadhuli wa masomo kwa wanafunzi yatima kuendelea na elimu ya sekondari na chuo.",
      content: "Sehemu ya programu yake ya Ustawi wa Mayatima, AMYC imetangaza ufadhuli wa masomo unaowawezesha wanafunzi yatima kuendelea na elimu ya sekondari na chuo. Fomu za maombi zinapatikana kwenye matawi yote ya AMYC. Ufadhuli huu unashughulikia ada, vifaa vya kujifunzia na msaada msingi wa ustawi, ukionyesha azimio la AMYC la kulea vijana wanaojitegemea wenye heshima.",
    },
    ar: {
      title: "إعلان منح دراسية للطلاب الأيتام",
      excerpt: "يقدم المركز منحاً دراسية للأيتام لمواصلة التعليم الثانوي والجامعي.",
      content: "كجزء من برنامج رعاية الأيتام، أعلن المركز عن منح دراسية تمكّن الطلاب الأيتام من مواصلة تعليمهم الثانوي والجامعي. تتوفر نماذج الطلب في جميع فروع المركز. تغطي المنحة الرسوم الدراسية والمواد التعليمية والدعم الأساسي للرعاية، مما يعكس التزام المركز بتنشئة شباب مستقلين صالحين.",
    },
  },
}

// ── Region (Jimbo) overview translations ────────────────────────────────────
const REGION_TR: Record<string, { sw: { overview: string }; ar: { overview: string } }> = {
  "jimbo-la-tanga-mjini": {
    sw: { overview: "Mkoa wa makao makuu ya AMYC, unao ratibu da'wah, usimamizi wa shule, ustawi na utawala wa kitaifa." },
    ar: { overview: "المنطقة التي بها المقر الرئيسي للمركز، تنسق الدعوة والإشراف على المدارس والرعاية والإدارة الوطنية." },
  },
  "jimbo-la-muheza": {
    sw: { overview: "Kusaidia shule, uratibu wa misikiti na ugawanyaji wa zakat katika Wilaya ya Muheza." },
    ar: { overview: "دعم المدارس وتنسيق المساجد وتوزيع الزكاة في منطقة موهيزا." },
  },
  "jimbo-la-korogwe": {
    sw: { overview: "Programu za vijana, halaqah na upatanishi wa jamii katika Mji wa Korogwe." },
    ar: { overview: "برامج الشباب والحلقات العلمية والتواصل المجتمعي في مدينة كوروغوي." },
  },
  "jimbo-la-pangani": {
    sw: { overview: "Da'wah ya pwani na ustawi kwa jamii za wavuvi kando ya pwani ya Pangani." },
    ar: { overview: "الدعوة الساحلية والرعاية لمجتمعات الصيادين على ساحل بانغاني." },
  },
  "jimbo-la-lushoto-mjini": {
    sw: { overview: "Elimu na da'wah katika jamii za milima ya Usambara." },
    ar: { overview: "التعليم والدعوة في مجتمعات جبال أوسامبارا." },
  },
  "jimbo-la-moa": {
    sw: { overview: "Da'wah ya vijijini na msaada wa shule katika eneo la Moa." },
    ar: { overview: "الدعوة الريفية ودعم المدارس في منطقة موا." },
  },
  "jimbo-la-mkinga": {
    sw: { overview: "Programu za jamii katika eneo la mpaka katika Wilaya ya Mkinga." },
    ar: { overview: "برامج المجتمع في منطقة الحدود في منطقة ميكينغا." },
  },
  "jimbo-la-handeni": {
    sw: { overview: "Miradi ya maendeleo ya vijijini ikiwa ni pamoja na kuchimba visima na ujenzi wa misikiti." },
    ar: { overview: "مشاريع التنمية الريفية بما في ذلك حفر الآبار وبناء المساجد." },
  },
  "jimbo-la-maramba": {
    sw: { overview: "Huduma za jamii na ujenzi wa misikiti katika eneo la Maramba." },
    ar: { overview: "خدمات المجتمع وبناء المساجد في منطقة مارامبا." },
  },
  "jimbo-la-kilindi": {
    sw: { overview: "Da'wah na elimu katika Wilaya ya mbali ya Kilindi." },
    ar: { overview: "الدعوة والتعليم في منطقة كيليندي النائية." },
  },
  "jimbo-la-nkamba-kidatu": {
    sw: { overview: "Ustawi wa jamii karibu na eneo la hydro ya Nkamba-Kidatu." },
    ar: { overview: "رعاية المجتمع بالقرب من منطقة نكامبا-كيداتو المائية." },
  },
  "jimbo-la-matui-azimio": {
    sw: { overview: "Da'wah na ustawi wa ki-tawi katika eneo la Matui-Azimio." },
    ar: { overview: "الدعوة والرعاية على مستوى الفرع في منطقة ماتوي-أزيميو." },
  },
  "jimbo-la-mikunda-mtwara": {
    sw: { overview: "Da'wah na msaada wa shule wa kusini mwa Tanzania." },
    ar: { overview: "الدعوة ودعم المدارس في جنوب تنزانيا." },
  },
  "jimbo-la-masasi": {
    sw: { overview: "Ustawi wa jamii na ujenzi wa misikiti katika Wilaya ya Masasi." },
    ar: { overview: "رعاية المجتمع وبناء المساجد في منطقة ماساسي." },
  },
  "jimbo-la-mbinga": {
    sw: { overview: "Da'wah ya milima na elimu ya vijijini katika Wilaya ya Mbinga." },
    ar: { overview: "الدعوة الجبلية والتعليم الريفي في منطقة مبينغا." },
  },
  "jimbo-la-karagwe": {
    sw: { overview: "Da'wah ya mkoa wa magharibi wa ziwa katika Wilaya ya Karagwe." },
    ar: { overview: "دعوة منطقة البحيرة الغربية في منطقة كاراغوي." },
  },
  "jimbo-la-bukoba-mjini": {
    sw: { overview: "Da'wah ya mijini na programu za vijana katika Bukoba." },
    ar: { overview: "الدعوة الحضرية وبرامج الشباب في بوكوبا." },
  },
  "jimbo-la-katoro": {
    sw: { overview: "Ustawi wa jamii ya vijijini kwenye mpaka wa Geita/Kagera." },
    ar: { overview: "رعاية المجتمع الريفي على حدود غيتا/كاغيرا." },
  },
  "jimbo-la-misenyi": {
    sw: { overview: "Msaada wa misikiti na shule katika eneo la mpaka katika Wilaya ya Misenyi." },
    ar: { overview: "دعم المساجد والمدارس في المنطقة الحدودية في منطقة ميسيني." },
  },
  "jimbo-la-kyaka": {
    sw: { overview: "Upatanishi wa jamii katika eneo la biashara ya mpaka wa Kyaka." },
    ar: { overview: "التواصل المجتمعي في منطقة التجارة الحدودية في كياكا." },
  },
  "jimbo-la-muleba": {
    sw: { overview: "Maendeleo ya jamii ya ziwa katika Wilaya ya Muleba." },
    ar: { overview: "تنمية المجتمع البحيري في منطقة موليبا." },
  },
  "jimbo-la-singida": {
    sw: { overview: "Da'wah ya kati ya Tanzania na kuchimba visima katika eneo la kavu la Singida." },
    ar: { overview: "دعوة وسط تنزانيا وحفر الآبار في منطقة سينغيدا الجافة." },
  },
  "jimbo-la-juhudi-makonga": {
    sw: { overview: "Programu za jamii za ki-tawi (eneo litathibitishwa)." },
    ar: { overview: "برامج مجتمعية على مستوى الفرع (الموقع سيتم تأكيده)." },
  },
  "jimbo-la-kitangili-newara": {
    sw: { overview: "Da'wah na ustawi wa vijijini (eneo litathibitishwa)." },
    ar: { overview: "الدعوة والرعاية الريفية (الموقع سيتم تأكيده)." },
  },
  "jimbo-la-kanda-ya-kaskazini": {
    sw: { overview: "Uratibu wa ki-zonal kote matawi ya kaskazini mwa Tanzania." },
    ar: { overview: "تنسيق على مستوى المنطقة لجميع فروع شمال تنزانيا." },
  },
}

// ── Page translations (about, privacy, terms, etc.) ────────────────────────
const PAGE_TR: Record<string, any> = {
  about: {
    sw: {
      title: "Kuhusu AMYC",
      excerpt: "Kituo cha Vijana wa Kiislamu cha Ansaar (AMYC) ni taasisi ya Kiislamu yenye mwanzo iliyoko Tanga, Tanzania, iliyoanzishwa 1980.",
      content: `## Tuko Nani

Kituo cha Vijana wa Kiislamu cha Ansaar (AMYC) ni taasisi ya Kiislamu yenye mwanzo iliyoko Tanga, Tanzania. Ilianzishwa mwaka **1980** kwa dhamira ya kufufua mafundisho halisi ya Kiislamu na kukuza maendeleo ya jumla ya vijana ndani ya imani.

Kwa zaidi ya miongo minne ya huduma, AMYC imekuwa taasisi yenye programu nyingi ikiendesha mtandao wa kitaifa wa shule, matawi ya kikanda (*Majimbo*), miradi ya ustawi wa jamii, michango ya afya, programu za ustawi wa mayatima, na kitengo cha ndani cha media na mawasiliano — ikiwa ni pamoja na kituo chake cha redio, **Redio Ihsaan FM**.

## Muundo wa Shirika

AMYC inafanya kazi kwenye mfumo uliojengwa wa matawi na mikoa, kuhakikisha mfumo wa pamoja na wenye ufanisi. Kila tawi linaundwa na wanachama angalau 15 na kuchangia katika juhudi za pamoja za maendeleo ya kikanda. Shirika linaendesha mfumo wa uchaguzi wa nidhamu katika ngazi zote, kufuata kwa ukamilifu sheria za Kiislamu.

## Maadili Yetu

- **Uelewa** — Kuwa na ufahamu na ufahamu wa matendo, mawazo, na nia mtu kulingana na mafunzo ya Kiislamu.
- **Ubora** — Kufikia ubora, uadilifu, na viwango vya juu katika nyanja zote za maisha.
- **Hekima** — Kutafuta, kuelewa na kutumia elimu na hukumu nzuri katika maamuzi.
- **Kushikamana** — Kudumisha nidhamu, kujitolea, na kushikamana na kanuni za Kiislamu.
- **Kuaminika** — Kuonyesha uaminifu, uadilifu, na kuaminika katika shughuli zote.
- **Ushirikiano** — Kufanya kazi pamoja kwa ufanisi kufikia malengo ya pamoja.`,
    },
    ar: {
      title: "عن المركز",
      excerpt: "مركز شباب الأنصار المسلمين (AMYC) مؤسسة إسلامية رائدة مقرها في تانغا، تنزانيا، تأسست عام 1980.",
      content: `## من نحن

مركز شباب الأنصار المسلمين (AMYC) مؤسسة إسلامية رائدة مقرها في تانغا، تنزانيا. تأسس عام **1980** برسالة إحياء التعاليم الإسلامية الأصيلة وتعزيز التنمية الشاملة للشباب ضمن الإيمان.

على مدى أكثر من أربعة عقود من الخدمة، نمت المنظمة لتصبح مؤسسة متعددة البرامج تدير شبكة وطنية من المدارس والفروع الإقليمية (*المناطق*)، ومبادرات الرعاية المجتمعية، والمساهمات الصحية، وبرامج رعاية الأيتام، وذراع إعلامي داخلي — بما في ذلك محطة إذاعية خاصة، **إذاعة إحسان إف إم**.

## الهيكل التنظيمي

يعمل المركز على نظام منظم من الفروع والمناطق، مما يضمن إطاراً متماسكاً وفعالاً. يتكون كل فرع من 15 عضواً كحد أدنى ويساهم في الجهود التنموية الإقليمية. تحافظ المنظمة على نظام انتخابي منضبط في جميع المستويات، ملتزمة تماماً بالشريعة الإسلامية.

## قيمنا

- **الوعي** — الوعي والانتباه للأفعال والأفكار والنوايا وفقاً للتعاليم الإسلامية.
- **الجودة** -- السعي نحو التميز والنزاهة والمعايير العالية في جميع جوانب الحياة.
- **الحكمة** -- السعي لفهم وتطبيق المعرفة والحكم السليم في اتخاذ القرارات.
- **الالتزام** -- الحفاظ على الانضباط والالتزام بمبادئ الإسلام.
- **الأمانة** -- إظهار الصدق والنزاهة والموثوقية في جميع المساعي.
- **التعاون** -- العمل معاً بفعالية لتحقيق الأهداف المشتركة.`,
    },
  },
  "privacy-policy": {
    sw: {
      title: "Sera ya Faragha",
      excerpt: "Jinsi AMYC inavyokusanya, kutumia na kulinda taarifa zako.",
      content: `## Sera ya Faragha

Kituo cha Vijana wa Kiislamu cha Ansaar (AMYC) kimejitolea kulinda faragha ya wageni wa tovuti hii. Sera hii inaelezea jinsi tunavyokusanya, kutumia na kulinda taarifa zako.

### Taarifa Tunazokusanya

- Maelezo ya mawasiliano unayowasilisha kupitia fomu zetu za mawasiliano (jina, barua pepe, simu, mada, ujumbe).
- Data ya takwimu isiyojulikana kuhusu jinsi tovuti inavyotumiwa.
- Taarifa unayotoa unapojiandikisha kwa matukio au programu.

### Jinsi Tunavyotumia Taarifa

- Kujibu maswali yako na kutoa huduma unazohitaji.
- Kuboresha programu na tovuti yetu.
- Kutuma mawasiliano ya taasisi pale ambapo umekubali.

### Usalama wa Data

Tunatumia hatua za kiufundi na za shirika zinazofaa kulinda taarifa zako, ikiwa ni pamoja na kuhifadhi nywila kwa usalama, udhibiti wa ufikiaji na kuingia kwa ukaguzi.

### Haki Zako

Unaweza kuomba ufikiaji, marekebisho, au kufuta data yako ya kibinafsi kwa kuwasiliana na info@amyc.or.tz.`,
    },
    ar: {
      title: "سياسة الخصوصية",
      excerpt: "كيف يجمع المركز ويستخدم ويحمي معلوماتك.",
      content: `## سياسة الخصوصية

يلتزم مركز شباب الأنصار المسلمين (AMYC) بحماية خصوصية زوار هذا الموقع. تصف هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك.

### المعلومات التي نجمعها

- تفاصيل الاتصال التي تقدمها من خلال نماذج الاتصال (الاسم، البريد الإلكتروني، الهاتف، الموضوع، الرسالة).
- بيانات تحليلية مجهولة الهوية حول كيفية استخدام الموقع.
- المعلومات التي تقدمها عند التسجيل في الفعاليات أو البرامج.

### كيف نستخدم المعلومات

- للرد على استفساراتك وتقديم الخدمات المطلوبة.
- لتحسين برامجنا وموقعنا.
- لإرسال اتصالات مؤسسية حيث وافقت على ذلك.

### أمن البيانات

نطبق تدابير تقنية وتنظيمية مناسبة لحماية معلوماتك، بما في ذلك تجزئة كلمات المرور الآمنة وضوابط الوصول وسجلات التدقيق.

### حقوقك

يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها عن طريق الاتصال بـ info@amyc.or.tz.`,
    },
  },
  terms: {
    sw: {
      title: "Masharti ya Matumizi",
      excerpt: "Masharti yanayotawala matumizi ya tovuti ya AMYC.",
      content: `## Masharti ya Matumizi

Kwa kufikia tovuti hii unakubali masharti yafuatayo:

1. Maudhui yaliyochapishwa kwenye tovuti hii ni mali ya Kituo cha Vijana wa Kiislamu cha Ansaar (AMYC) isipokuwa kama imebainishwa vinginevyo.
2. Taarifa zinatolewa kwa madhumuni ya jumla ya habari na zinaweza kusasishwa bila taarifa.
3. Viungo vya nje vinateuliwa kwa marejeleo; AMYC haihusiki na maudhui ya tovuti za nje.
4. Majaribio yasiyoruhusiwa ya kufikia au kuharibu usalama wa tovuti hii yamekataliwa na yanaweza kuwa chini ya hatua za kisheria.
5. Alama za biashara, nembo na picha za taasisi hazitumiki bila ruhusa iliyoandikwa mapema.`,
    },
    ar: {
      title: "شروط الاستخدام",
      excerpt: "الشروط التي تحكم استخدام موقع المركز.",
      content: `## شروط الاستخدام

بدخولك هذا الموقع فإنك توافق على الشروط التالية:

1. المحتوى المنشور على هذا الموقع مملوك لمركز شباب الأنصار المسلمين (AMYC) ما لم يُذكر خلاف ذلك.
2. تُقدم المعلومات لأغراض إعلامية عامة وقد يتم تحديثها دون إشعار.
3. الروابط الخارجية مُقدمة للإشارة؛ والمركز غير مسؤول عن محتوى المواقع الخارجية.
4. يُحظر أي محاولة غير مصرح بها للوصول إلى أمن هذا الموقع أو اختراقه، وقد تخضع لإجراءات قانونية.
5. لا يجوز استخدام العلامات التجارية والشعارات والصور المؤسسية دون إذن كتابي مسبق.`,
    },
  },
  accessibility: {
    sw: {
      title: "Tamko la Ufikivu",
      excerpt: "Azimio la AMYC kuhusu tovuti yenye ufikivu.",
      content: `## Tamko la Ufikivu

Kituo cha Vijana wa Kiislamu cha Ansaar kimejitolea kufanya tovuti yake ipatikane kwa watumiaji wote, ikiwa ni pamoja na wale wenye ulemavu. Tunajitahidi kufuata Miongozo ya Ufikivu ya Maudhui ya Wavuti (WCAG) 2.1 Kiwango cha AA.

Ukikuta kikwazo chochote cha ufikivu kwenye tovuti hii, tafadhali wasiliana nasi kwa info@amyc.or.tz ili tuweze kulitatua.`,
    },
    ar: {
      title: "بيان إمكانية الوصول",
      excerpt: "التزام المركز بموقع يمكن الوصول إليه.",
      content: `## بيان إمكانية الوصول

يلتزم مركز شباب الأنصار المسلمين بجعل موقعه متاحاً لجميع المستخدمين، بما في ذلك ذوي الإعاقة. نسعى للالتزام بإرشادات الوصول إلى محتوى الويب (WCAG) 2.1 المستوى AA.

إذا واجهت أي حاجز يمنع الوصول على هذا الموقع، يرجى الاتصال بنا على info@amyc.or.tz لمعالجته.`,
    },
  },
  "cookie-policy": {
    sw: {
      title: "Sera ya Cookies",
      excerpt: "Jinsi AMYC inavyotumia cookies.",
      content: `## Sera ya Cookies

Tovuti hii inatumia cookies muhimu kudumisha kikao chako na mipangilio ya mapendeleo. Hatutumii cookies za ufuatiliaji wa watu wengine bila ridhaa yako. Unaweza kudhibiti cookies kupitia mipangilio ya kivinjari chako.`,
    },
    ar: {
      title: "سياسة ملفات تعريف الارتباط",
      excerpt: "كيف يستخدم المركز ملفات تعريف الارتباط.",
      content: `## سياسة ملفات تعريف الارتباط

يستخدم هذا الموقع ملفات تعريف ارتباط أساسية للحفاظ على جلستك وإعدادات التفضيلات. لا نستخدم ملفات تعريف ارتباط تابعة لجهات خارجية دون موافقتك. يمكنك التحكم فيها من خلال إعدادات المتصفح.`,
    },
  },
}

// ── Event translations ──────────────────────────────────────────────────────
const EVENT_TR: Record<string, any> = {
  "annual-general-meeting-2026": {
    sw: {
      title: "Mkutano Mkuu wa Mwaka 2026",
      description: "Mkutano Mkuu wa Mwaka wa AMYC, unaoleta wajumbe kutoka Majimbo yote kwa ripoti ya mwaka, akaunti zilizokaguliwa na uchaguzi.",
    },
    ar: {
      title: "الاجتماع العام السنوي 2026",
      description: "الاجتماع العام السنوي للمركز، يجمع المندوبين من جميع المناطق للتقرير السنوي والحسابات المدققة والانتخابات.",
    },
  },
  "national-dawah-conference-2026": {
    sw: {
      title: "Mkutano wa Kitaifa wa Da'wah 2026",
      description: "Mkusanyiko wa du'aat na imaams kutoka mtandao wote wa AMYC ili kuimarisha metodolojia ya da'wah na uratibu.",
    },
    ar: {
      title: "المؤتمر الوطني للدعوة 2026",
      description: "تجمع الدعاة والأئمة من شبكة المركز لتعزيز منهجية الدعوة والتنسيق.",
    },
  },
  "youth-leadership-retreat-2026": {
    sw: {
      title: "Kambi ya Uongozi wa Vijana 2026",
      description: "Kambi ya ujenzi wa tabia na uongozi kwa vijana Waislamu kote Majimbo ya AMYC.",
    },
    ar: {
      title: "معسكر القيادة الشبابية 2026",
      description: "معسكر لبناء الشخصية والقيادة للشباب المسلمين في جميع مناطق المركز.",
    },
  },
  "community-health-camp-handeni": {
    sw: {
      title: "Kambi ya Afya ya Jamii — Handeni",
      description: "Kambi ya bure ya afya ya jamii inayotoa uchunguzi, upatanishi wa afya ya mama na mtoto, na elimu ya kinga.",
    },
    ar: {
      title: "معسكر صحي مجتمعي — هانديني",
      description: "معسكر صحي مجتمعي مجاني يقدم الفحوصات والتوعية بصحة الأم والطفل والتعليم الوقائي.",
    },
  },
}

async function main() {
  console.log("Adding comprehensive SW + AR translations…\n")

  // ── Update site settings ─────────────────────────────────────────────────
  for (const [key, tr] of Object.entries(SETTINGS_TR)) {
    const setting = await db.siteSetting.findUnique({ where: { key } })
    if (setting) {
      const current = JSON.parse(setting.value)
      await db.siteSetting.update({
        where: { key },
        data: { value: JSON.stringify({ ...current, ...tr }) },
      })
      console.log(`  ✓ setting: ${key}`)
    }
  }

  // ── Update articles ──────────────────────────────────────────────────────
  for (const [slug, tr] of Object.entries(ARTICLE_TR)) {
    const article = await db.article.findUnique({ where: { slug } })
    if (article) {
      const current = article.translations ? JSON.parse(article.translations) : {}
      await db.article.update({
        where: { slug },
        data: { translations: JSON.stringify({ ...current, ...tr }) },
      })
      console.log(`  ✓ article: ${slug}`)
    }
  }

  // ── Update regions ───────────────────────────────────────────────────────
  for (const [slug, tr] of Object.entries(REGION_TR)) {
    const region = await db.region.findUnique({ where: { slug } })
    if (region) {
      const current = region.translations ? JSON.parse(region.translations) : {}
      await db.region.update({
        where: { slug },
        data: { translations: JSON.stringify({ ...current, ...tr }) },
      })
      console.log(`  ✓ region: ${slug}`)
    }
  }

  // ── Update pages ─────────────────────────────────────────────────────────
  for (const [slug, tr] of Object.entries(PAGE_TR)) {
    const page = await db.page.findUnique({ where: { slug } })
    if (page) {
      const current = page.translations ? JSON.parse(page.translations) : {}
      await db.page.update({
        where: { slug },
        data: { translations: JSON.stringify({ ...current, ...tr }) },
      })
      console.log(`  ✓ page: ${slug}`)
    }
  }

  // ── Update events ────────────────────────────────────────────────────────
  for (const [slug, tr] of Object.entries(EVENT_TR)) {
    const event = await db.event.findUnique({ where: { slug } })
    if (event) {
      const current = event.translations ? JSON.parse(event.translations) : {}
      await db.event.update({
        where: { slug },
        data: { translations: JSON.stringify({ ...current, ...tr }) },
      })
      console.log(`  ✓ event: ${slug}`)
    }
  }

  console.log("\n✅ All translations added.")
}

main().catch(console.error).finally(() => db.$disconnect())

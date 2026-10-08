import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/lib/password"

const db = new PrismaClient()

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

async function main() {
  console.log("Seeding AMYC database…")

  // ── Users / RBAC (simplified to 2 roles) ────────────────────────────────
  // SUPER_ADMIN — developer / system maintainer (full access including settings & audit)
  // ADMIN — operator (handles all content: news, documents, schools, regions, events, media)
  const initialAdminPassword = process.env.AMYC_INITIAL_ADMIN_PASSWORD
  if (!initialAdminPassword || initialAdminPassword.length < 14) {
    throw new Error("Set a 14+ character AMYC_INITIAL_ADMIN_PASSWORD before seeding.")
  }
  const users = [
    { name: "System Administrator", email: process.env.AMYC_INITIAL_ADMIN_EMAIL?.trim().toLowerCase() || "", role: "SUPER_ADMIN", pw: initialAdminPassword },
  ]
  if (!users[0].email) throw new Error("Set AMYC_INITIAL_ADMIN_EMAIL before seeding.")
  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash: hashPassword(u.pw),
        status: "ACTIVE",
      },
    })
  }
  console.log(`  ✓ ${users.length} active system administrator account(s); create institution Admin accounts from /admin/users`)

  // ── Categories ──────────────────────────────────────────────────────────
  const categories = [
    { name: "Da'wah", slug: "dawah", type: "NEWS" },
    { name: "Education", slug: "education", type: "NEWS" },
    { name: "Welfare", slug: "welfare", type: "NEWS" },
    { name: "Community", slug: "community", type: "NEWS" },
    { name: "Announcement", slug: "announcement", type: "NEWS" },
    { name: "Governance", slug: "governance", type: "NEWS" },
    { name: "Annual Report", slug: "annual-report", type: "DOCUMENT" },
    { name: "Strategic Plan", slug: "strategic-plan", type: "DOCUMENT" },
    { name: "Policy", slug: "policy", type: "DOCUMENT" },
    { name: "Form", slug: "form", type: "DOCUMENT" },
    { name: "Publication", slug: "publication", type: "DOCUMENT" },
    { name: "Financial", slug: "financial", type: "DOCUMENT" },
    { name: "Events", slug: "events", type: "GALLERY" },
    { name: "Schools", slug: "schools", type: "GALLERY" },
    { name: "Projects", slug: "projects", type: "GALLERY" },
    { name: "Da'wah", slug: "dawah-gallery", type: "GALLERY" },
    { name: "Community Work", slug: "community-work", type: "GALLERY" },
  ]
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  // ── Site Settings (statistics managed in CMS) ───────────────────────────
  const settings: Record<string, any> = {
    orgName: "Ansaar Muslim Youth Centre",
    orgShortName: "AMYC",
    tagline:
      "A pioneering Islamic organization in Tanzania, established with the vision of reviving the authentic teachings of Islam and fostering the development of youth within the faith.",
    mission:
      "To nurture a generation of educated, disciplined youth who adhere to Islamic teachings by integrating education, upbringing, and social services.",
    vision:
      "To be a model of an excellent Islamic institution providing quality education and nurturing programs for youth and the community to bring about spiritual and intellectual prosperity in accordance with the interpretation of Islam as per the guidance of righteous predecessors.",
    foundedYear: "1980",
    headquarters: "Tanga, Tanzania",
    email: "info@amyc.or.tz",
    phone: "+2646620",
    address: "Tanga, Tanzania",
    officeHours: "Monday – Friday: 10:00 AM – 8:00 PM",
    radioStation: "Radio Ihsaan FM",
    stats: {
      yearsOfService: { label: "Years of Service", value: "45+", note: "Since 1980" },
      schoolsCount: { label: "Schools & Institutions", value: "30+", note: "Across Tanzania" },
      regionsCount: { label: "Regions (Majimbo)", value: "25", note: "Nationwide network" },
      programmesCount: { label: "Programmes & Services", value: "9", note: "Holistic mission" },
      orphansCaredFor: { label: "Orphans Cared For", value: "600+", note: "Shelter, food & schooling" },
      membersCount: { label: "Members", value: "50,000+", note: "Nationwide" },
    },
    heroImage: "/images/hero-amyc.jpg",
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    })
  }

 // ── Programmes & Services ───────────────────────────────────────────────
// Short descriptions are used on the Home page.
// Full descriptions are used on each Programme Detail page.

const programmes = [
  {
    name: "Da'wah Efforts",
    slug: "dawah",
    icon: "BookOpen",
    shortDescription:
      "Classes, lectures and community outreach that share the message of Islam through the Qur'an and Sunnah.",
    description: `
AMYC's Da'wah programme is dedicated to sharing the message of Islam through sound knowledge, wisdom, good character and meaningful engagement with individuals, families and communities. The programme supports Qur'an and Sunnah-based teaching through lectures, study circles, Islamic classes, mosque activities, educational materials and community outreach. Its purpose is not only to communicate Islamic teachings, but also to help Muslims strengthen their faith, understanding, worship, character and sense of responsibility towards society.

Through its institutional structure, AMYC delivers Da'wah services through its Majimbo and local branches. Each Jimbo responds to the religious and social circumstances of the communities it serves, taking into account local needs, available resources and community priorities. This approach enables Da'wah activities to remain relevant, accessible and connected to the realities of people in different areas.

The programme also encourages the development of knowledgeable and responsible scholars, teachers, imams, youth and community leaders who can contribute positively to society. Da'wah may include public lectures, halaqah, Qur'an teaching, Islamic educational programmes, youth activities, family guidance and the use of modern media and digital platforms.

AMYC believes that effective Da'wah is strengthened through cooperation. The Centre therefore welcomes cooperation with scholars, educators, community leaders, institutions, donors, volunteers and other partners who share the objective of promoting beneficial knowledge, good character and peaceful community development.

Through Da'wah, AMYC seeks to contribute to a knowledgeable, morally responsible and spiritually strong society, while encouraging Muslims and the wider community to learn, cooperate and contribute positively to the development of their communities.
    `,
    sortOrder: 1,
  },

  {
    name: "Education",
    slug: "education",
    icon: "GraduationCap",
    shortDescription:
      "Islamic and academic education that develops knowledgeable, skilled and morally responsible generations.",
    description: `
Education is one of AMYC's important areas of service because the Centre believes that sustainable community development begins with knowledge and the development of capable people. AMYC supports educational institutions and programmes that seek to combine sound Islamic education with relevant academic knowledge and practical skills. Through these efforts, the Centre aims to nurture children, young people and adults who are knowledgeable, disciplined, ethical and capable of contributing positively to society.

Through its network of Majimbo and branches, AMYC responds to educational needs according to the circumstances of each community. Educational priorities may differ from one area to another depending on population, access to schools, available facilities, community needs and other local factors. This enables the institution to support education in a way that is practical, relevant and responsive to the communities it serves.

AMYC's educational work includes Islamic learning institutions, Maahad, schools and other educational initiatives. Where appropriate, these institutions seek to develop both religious understanding and academic competence, while encouraging discipline, responsibility, critical thinking, good manners and respect for others.

The Centre also recognises that quality education requires cooperation. AMYC therefore works, where appropriate, with teachers, parents, education professionals, government authorities, donors, charitable organisations, community members and other development partners to strengthen educational opportunities and facilities.

AMYC invites individuals and organisations who value education to support these efforts through knowledge, expertise, resources, volunteering and other constructive forms of partnership. By investing in education, the community contributes to the development of a generation capable of serving Islam, their families and society with knowledge, integrity and responsibility.
    `,
    sortOrder: 2,
  },

  {
    name: "Social Welfare",
    slug: "social-welfare",
    icon: "HeartHandshake",
    shortDescription:
      "Practical support for families and individuals through welfare, charitable assistance, emergency support and community care.",
    description: `
AMYC's Social Welfare programme seeks to strengthen compassion, dignity and mutual support within the community. The programme responds to social needs affecting individuals and families and may include support for people facing hardship, assistance to vulnerable households, zakat and sadaqah-related services, emergency assistance, matrimonial guidance, funeral arrangements and other forms of community welfare.

The programme operates through AMYC's institutional structure, including Majimbo and local branches. This enables local teams to understand the circumstances of the communities they serve and identify needs according to the realities of each area. The nature and scale of assistance may therefore differ from one Jimbo to another depending on the needs identified, available resources and the support received from partners and the community.

AMYC seeks to ensure that welfare support is provided with dignity, fairness and respect. The objective is not simply to provide temporary assistance, but also, where possible, to encourage solutions that strengthen individuals and families and help them become more stable and self-reliant.

The Centre recognises that social welfare requires collective responsibility. For this reason, AMYC works with community members, volunteers, donors, charitable organisations, professionals, local institutions and other partners to respond to identified needs. Support may take different forms depending on the circumstances and priorities of a particular community.

AMYC invites the wider community to participate in strengthening welfare services through volunteering, charitable contributions, professional support, community initiatives and responsible partnerships. Together, these efforts can help protect dignity, reduce hardship and strengthen a culture of compassion, cooperation and social responsibility.
    `,
    sortOrder: 3,
  },

  {
    name: "Community Services",
    slug: "community-services",
    icon: "Hammer",
    shortDescription:
      "Practical community services and infrastructure initiatives that respond to local needs and improve everyday life.",
    description: `
AMYC's Community Services programme focuses on practical initiatives that respond to important needs affecting Muslim communities and society more broadly. While religious and educational services remain central to the institution's mission, AMYC recognises that healthy and resilient communities also require access to essential services and supportive infrastructure.

Through its Majimbo and branches, AMYC identifies community needs according to local circumstances and priorities. Depending on the situation and available resources, community initiatives may include support for clean water access, well drilling, mosque construction and rehabilitation, community facilities, emergency assistance and other projects that contribute to improved living conditions.

These initiatives are not implemented in exactly the same way in every area. Each Jimbo considers the needs of its community, the urgency of the issue, available resources, technical requirements and opportunities for partnership. This allows AMYC to focus its efforts where they can make a meaningful contribution.

For projects such as water wells, mosque construction, health-related facilities and other community infrastructure, AMYC may work together with donors, charitable organisations, local communities, technical experts, government authorities and other development partners. Community participation is particularly important because sustainable projects require local ownership, responsibility and cooperation.

AMYC welcomes individuals and organisations who wish to support practical community development. Through partnership, expertise, charitable support and voluntary service, more communities can gain access to projects that respond to genuine needs.

The programme reflects AMYC's commitment to serving people in practical ways while strengthening cooperation, dignity, self-reliance and community development.
    `,
    sortOrder: 4,
  },

  {
    name: "Healthcare",
    slug: "healthcare",
    icon: "Stethoscope",
    shortDescription:
      "Healthcare and health-awareness initiatives that promote physical well-being, prevention and responsible community care.",
    description: `
AMYC recognises that good health is an important foundation for a productive and dignified life. Its Healthcare programme seeks to contribute to the well-being of individuals and communities through healthcare services, health education, preventive awareness and community-based initiatives where such services are available and appropriate.

Through its Majimbo structure, AMYC responds to health-related needs according to the circumstances of each community. The nature of healthcare activities may vary depending on local needs, available facilities, professional capacity and opportunities for cooperation. This allows each area to focus on priorities that are relevant to the people it serves.

Where healthcare initiatives are established, AMYC seeks to promote responsible care, health awareness and respect for human dignity. Activities may include basic healthcare services, preventive health education, maternal and child health awareness, community health campaigns and other initiatives designed to encourage healthier communities.

Healthcare projects can require significant technical expertise, equipment, facilities and financial resources. For this reason, AMYC may collaborate with healthcare professionals, charitable organisations, donors, government authorities, community members and other partners to strengthen the quality and reach of services.

AMYC believes that community health is a shared responsibility. Individuals and organisations can contribute through professional expertise, volunteering, resources, awareness programmes and constructive partnerships.

Through this programme, AMYC seeks to support communities in understanding and addressing health challenges while promoting compassion, responsibility and cooperation. The ultimate objective is to contribute to healthier, more informed and more resilient communities.
    `,
    sortOrder: 5,
  },

  {
    name: "Youth Development",
    slug: "youth-development",
    icon: "Users",
    shortDescription:
      "Leadership, skills, mentorship and character development programmes that prepare young people to serve their communities.",
    description: `
Young people represent an important part of the present and future of every community. AMYC's Youth Development programme focuses on helping young Muslims develop knowledge, confidence, leadership skills, good character and practical abilities that enable them to contribute positively to society.

The programme recognises that young people have different needs and opportunities depending on their communities. Through AMYC's Majimbo and branches, youth initiatives can therefore be developed according to local circumstances, available resources and the priorities identified by young people and community leadership.

Activities may include leadership development, mentorship, Islamic character-building, educational programmes, skills development, sports and recreation, community service, youth discussions and initiatives that encourage responsible participation in society. The objective is to help young people develop not only academically or professionally, but also morally and socially.

AMYC believes that youth development requires guidance and cooperation between young people, parents, teachers, scholars, community leaders, professionals and institutions. The Centre therefore encourages partnerships that provide young people with positive learning environments, practical experience and opportunities to develop their abilities.

AMYC also encourages young people to become active contributors rather than passive beneficiaries. Through volunteering, community service, education and leadership opportunities, youth can develop a stronger sense of responsibility towards their families, communities and society.

The Centre welcomes individuals and organisations interested in supporting youth development through mentorship, training, resources, professional expertise and constructive partnerships. By investing in young people today, the community contributes to a future built on knowledge, skills, integrity, service and strong moral values.
    `,
    sortOrder: 6,
  },

  {
    name: "Development Projects",
    slug: "development-projects",
    icon: "Sprout",
    shortDescription:
      "Community development initiatives including water, education, infrastructure, mosque projects and environmental activities.",
    description: `
AMYC's Development Projects programme supports practical initiatives aimed at improving living conditions and strengthening the capacity of communities. The programme recognises that sustainable development requires more than individual assistance; communities also need infrastructure, access to essential services, education and opportunities that enable them to build stronger futures.

Through the Majimbo and branch structure, AMYC identifies development priorities according to the needs and circumstances of different communities. Projects may include clean water initiatives such as well drilling, educational facilities, mosque construction or rehabilitation, sanitation-related activities, environmental conservation and other community infrastructure projects.

The availability and type of projects may differ from one area to another. Each initiative depends on the needs identified, technical feasibility, available resources, community participation and opportunities for partnership. This approach allows AMYC to focus on practical priorities rather than applying the same project model to every community.

Many development projects require cooperation beyond the capacity of one institution. AMYC therefore works, where appropriate, with donors, charitable organisations, local communities, government authorities, professionals, development partners and other well-wishers. Such partnerships can provide financial resources, technical expertise, materials, volunteer support and other forms of assistance.

AMYC believes that successful development projects should benefit communities while also encouraging local ownership and responsibility. Community participation is therefore an important part of planning, implementation and sustainability.

The Centre invites individuals, organisations, donors and other partners to join these efforts. By working together, communities can address important needs, expand access to essential services and create opportunities that contribute to long-term social development.
    `,
    sortOrder: 7,
  },

  {
    name: "Media & Communication",
    slug: "media-communication",
    icon: "Radio",
    shortDescription:
      "Radio, digital platforms and communication initiatives that share education, information, Islamic knowledge and community messages.",
    description: `
AMYC recognises the important role of media and communication in educating communities, sharing beneficial knowledge and connecting people with the work of the institution. Its Media & Communication programme uses appropriate communication channels to share Islamic education, community information, announcements, news, lectures and other useful content.

The programme enables AMYC to communicate beyond the physical locations of its centres, schools, mosques and branches. Through radio, digital platforms, social media and other communication channels, the institution can reach audiences in different communities and provide information about its activities and services.

AMYC's Majimbo and branches also play an important role in community communication. Local communication needs can differ from one area to another, and therefore content may address local educational, religious, social or development priorities while remaining consistent with the institution's wider mission.

Media is also an important tool for transparency and public awareness. By communicating activities, programmes, educational opportunities and community initiatives, AMYC seeks to help the public understand who the institution is, what it does and how its services contribute to society.

The Centre encourages responsible use of media based on accuracy, good manners, beneficial information and respect for the community. It also welcomes cooperation with media professionals, educators, technology partners, content creators, volunteers and other organisations that can strengthen communication capacity.

Through this programme, AMYC seeks to build an informed and connected community while extending access to beneficial knowledge and creating greater understanding of the institution's contribution to society.
    `,
    sortOrder: 8,
  },

  {
    name: "Orphan Welfare",
    slug: "orphan-welfare",
    image: "/images/misaada.JPG",
    icon: "Baby",
    shortDescription:
      "Care, education, protection and support for orphaned children, helping them grow in a safe and nurturing environment.",
    description: `
AMYC's Orphan Welfare programme is dedicated to supporting orphaned children and helping them grow in an environment that protects their dignity, education, well-being and future prospects. The programme recognises that children who have lost parental care may require support that goes beyond immediate material assistance.

Through its institutional structure and community network, AMYC seeks to identify and respond to the needs of orphaned children according to the circumstances of each area. Support may include education, food, clothing, shelter where applicable, healthcare, Islamic upbringing, emotional and social support, and other forms of assistance depending on identified needs and available resources.

The programme places strong emphasis on education and character development because the long-term well-being of an orphan depends not only on meeting immediate needs, but also on providing opportunities to develop knowledge, skills, confidence and responsible character.

AMYC recognises that caring for orphans is a shared community responsibility. The Centre therefore works, where appropriate, with donors, charitable organisations, schools, healthcare professionals, volunteers, families, local communities and other partners to strengthen the support available to children.

The needs of orphaned children may differ significantly from one community to another. AMYC's Majimbo and branches therefore respond according to local circumstances, while maintaining the broader institutional commitment to protecting children and supporting their development.

AMYC welcomes responsible partnerships that help provide sustainable support for orphaned children. Through education, care, compassion and community cooperation, we can help children grow with dignity, develop their potential and become confident and responsible members of society.
    `,
    sortOrder: 9,
  },
];


// ── Programme Translations ──────────────────────────────────────────────

const programmeTranslations: Record<string, any> = {
  dawah: {
    sw: {
      name: "Juhudi za Da'wah",
      shortDescription:
        "Madarasa, mihadhara na shughuli za kuwaelimisha jamii kuhusu Uislamu kwa kuzingatia Qur'an na Sunnah.",
      description: `
Programu ya Da'wah ya AMYC inalenga kufikisha ujumbe wa Uislamu kwa kutumia elimu sahihi, hekima, tabia njema na mawasiliano yenye manufaa kwa watu binafsi, familia na jamii. Programu hii inasaidia mafundisho yanayotokana na Qur'an na Sunnah kupitia mihadhara, darsa, halaqah, madarasa ya Qur'an na elimu ya Kiislamu, shughuli za misikiti, machapisho na njia mbalimbali za mawasiliano. Lengo lake si kufikisha ujumbe wa dini pekee, bali pia kuwasaidia Waislamu kuimarisha imani, uelewa wa dini, ibada, maadili na wajibu wao katika jamii.

Kupitia mfumo wake wa taasisi, AMYC inatekeleza huduma za Da'wah kupitia Majimbo na matawi yake. Kila Jimbo huzingatia mazingira na mahitaji ya jamii inayohudumia, pamoja na changamoto, rasilimali na vipaumbele vya eneo husika. Mfumo huu huifanya Da'wah kuwa yenye uhusiano wa karibu na maisha halisi ya watu katika maeneo mbalimbali.

Programu hii pia inalenga kukuza walimu, maimamu, vijana, viongozi na waelimishaji wenye maarifa na uwezo wa kushiriki katika kujenga jamii yenye elimu, maadili na mshikamano. Shughuli zinaweza kujumuisha mihadhara, halaqah, mafundisho ya Qur'an, malezi ya vijana, ushauri wa familia na matumizi ya vyombo vya habari na majukwaa ya kidijitali.

AMYC inaamini kuwa Da'wah yenye mafanikio huimarishwa na ushirikiano. Kwa hiyo, taasisi inakaribisha ushirikiano na wanazuoni, walimu, viongozi wa jamii, taasisi, wahisani, wajitolea na wadau wengine wanaoshiriki katika kuendeleza elimu yenye manufaa na maadili mema.

Kupitia Da'wah, AMYC inalenga kuchangia katika kujenga jamii yenye elimu, imani, maadili na uwajibikaji, huku ikiwahamasisha Waislamu na jamii kwa ujumla kujifunza, kushirikiana na kuwa sehemu ya maendeleo ya jamii.
      `,
    },
    ar: {
      name: "جهود الدعوة",
      shortDescription:
        "الدروس والمحاضرات والأنشطة المجتمعية لنشر رسالة الإسلام وفق القرآن والسنة.",
      description: `
يهدف برنامج الدعوة في مركز أنصار الشباب المسلم (AMYC) إلى إيصال رسالة الإسلام من خلال العلم الصحيح والحكمة وحسن الخلق والتواصل النافع مع الأفراد والأسر والمجتمعات. ويدعم البرنامج التعليم المستند إلى القرآن الكريم والسنة النبوية من خلال المحاضرات والدروس وحلقات العلم وتعليم القرآن والأنشطة في المساجد والمواد التعليمية ووسائل الاتصال المختلفة. ولا يقتصر الهدف على إيصال المعلومات الدينية فحسب، بل يسعى أيضاً إلى تعزيز الإيمان والفهم الصحيح للدين والعبادة والأخلاق والشعور بالمسؤولية تجاه المجتمع.

ومن خلال الهيكل المؤسسي للمركز، تُنفذ أنشطة الدعوة عبر الولايات والفروع التابعة له. وتعمل كل ولاية وفق الظروف والاحتياجات الفعلية للمجتمع الذي تخدمه، مع مراعاة التحديات والموارد والأولويات المحلية. ويساعد هذا الأسلوب على جعل الدعوة قريبة من واقع الناس واحتياجاتهم في مختلف المناطق.

كما يهتم البرنامج بتأهيل المعلمين والأئمة والشباب والقادة والمربين الذين يمكنهم الإسهام في بناء مجتمع قائم على العلم والأخلاق والتعاون. وتشمل الأنشطة، بحسب الحاجة، المحاضرات وحلقات العلم وتعليم القرآن وبرامج الشباب والإرشاد الأسري والاستفادة من وسائل الإعلام والمنصات الرقمية.

ويؤمن المركز بأن نجاح الدعوة يحتاج إلى التعاون بين مختلف الأطراف، ولذلك يرحب بالتعاون مع العلماء والمعلمين وقادة المجتمع والمؤسسات والمحسنين والمتطوعين والشركاء الآخرين الذين يسهمون في نشر العلم النافع وتعزيز الأخلاق الحسنة.

ومن خلال هذا البرنامج، يسعى المركز إلى الإسهام في بناء مجتمع واعٍ ومتمسك بالقيم الإسلامية، وتشجيع المسلمين والمجتمع عامة على التعلم والتعاون والمشاركة الإيجابية في تنمية مجتمعاتهم.
      `,
    },
  },

  education: {
    sw: {
      name: "Elimu",
      shortDescription:
        "Elimu ya Kiislamu na kitaaluma inayolenga kujenga kizazi chenye maarifa, ujuzi na maadili.",
      description: `
Elimu ni moja ya maeneo muhimu ya huduma ya AMYC kwa sababu taasisi inaamini kuwa maendeleo endelevu ya jamii huanza na maarifa na watu wenye uwezo. AMYC inaunga mkono taasisi na programu za elimu zinazolenga kuunganisha elimu sahihi ya Kiislamu na maarifa ya kitaaluma pamoja na stadi zinazohitajika katika maisha. Kupitia juhudi hizi, taasisi inalenga kulea watoto, vijana na watu wazima wenye maarifa, nidhamu, maadili na uwezo wa kuchangia maendeleo ya jamii.

Kupitia mtandao wa Majimbo na matawi yake, AMYC hujibu mahitaji ya elimu kulingana na mazingira ya kila jamii. Vipaumbele vya elimu vinaweza kutofautiana kutoka eneo moja hadi jingine kutokana na idadi ya watu, upatikanaji wa shule, miundombinu, mahitaji ya jamii na sababu nyingine za eneo husika. Hii huwezesha taasisi kusaidia elimu kwa namna inayozingatia uhalisia wa jamii.

Kazi za elimu za AMYC zinahusisha taasisi za elimu ya Kiislamu, Maahad, shule na programu nyingine za kielimu. Pale inapowezekana, taasisi inalenga kukuza uelewa wa dini sambamba na uwezo wa kitaaluma, nidhamu, uwajibikaji, fikra, maadili mema na kuheshimu wengine.

AMYC inatambua kuwa elimu bora inahitaji ushirikiano. Kwa hiyo, taasisi inaweza kushirikiana na walimu, wazazi, wataalamu wa elimu, mamlaka za serikali, wahisani, taasisi za misaada, jamii na wadau wengine katika kuimarisha fursa na mazingira ya elimu.

AMYC inakaribisha watu binafsi na taasisi zinazothamini elimu kushiriki katika juhudi hizi kupitia maarifa, utaalamu, rasilimali, kujitolea na ushirikiano mwingine wenye manufaa. Kuwekeza katika elimu ni kujenga kizazi chenye uwezo wa kuitumikia dini, familia na jamii kwa maarifa, uadilifu na uwajibikaji.
      `,
    },
    ar: {
      name: "التعليم",
      shortDescription:
        "تعليم إسلامي وأكاديمي يسهم في إعداد جيل متعلم وماهر وملتزم بالقيم والأخلاق.",
      description: `
يُعد التعليم من أهم مجالات خدمة مركز أنصار الشباب المسلم، إذ يؤمن المركز بأن التنمية المستدامة للمجتمع تبدأ بالعلم وبناء الإنسان القادر. ويدعم المركز المؤسسات والبرامج التعليمية التي تسعى إلى الجمع بين التعليم الإسلامي الصحيح والمعارف الأكاديمية والمهارات العملية. ومن خلال هذه الجهود، يهدف المركز إلى تربية الأطفال والشباب والكبار ليكونوا أفراداً متعلمين ومنضبطين وملتزمين بالقيم وقادرين على الإسهام الإيجابي في المجتمع.

ومن خلال شبكة الولايات والفروع، يستجيب المركز للاحتياجات التعليمية وفق ظروف كل مجتمع. وقد تختلف الأولويات التعليمية من منطقة إلى أخرى بحسب عدد السكان وتوفر المدارس والمرافق والاحتياجات المحلية وغيرها من العوامل. ويساعد هذا الأسلوب على تقديم خدمات تعليمية أكثر ارتباطاً بواقع المجتمعات واحتياجاتها.

تشمل الجهود التعليمية للمركز المؤسسات الإسلامية والمعاهد والمدارس والمبادرات التعليمية المختلفة. ويسعى المركز، بحسب الإمكانات والظروف، إلى تنمية المعرفة الإسلامية إلى جانب الكفاءة الأكاديمية والانضباط والمسؤولية والتفكير السليم وحسن الأخلاق واحترام الآخرين.

ويؤمن المركز بأن التعليم الجيد يحتاج إلى التعاون بين المعلمين وأولياء الأمور والمتخصصين والجهات الحكومية والمحسنين والمؤسسات والمجتمع والشركاء الآخرين. ولذلك يعمل المركز على بناء شراكات تسهم في تحسين فرص التعليم وبيئته.

ويرحب المركز بكل من يرغب في دعم التعليم من خلال المعرفة والخبرة والموارد والتطوع والشراكات البناءة. فالاستثمار في التعليم هو استثمار في جيل قادر على خدمة دينه وأسرته ومجتمعه بالعلم والأمانة والمسؤولية.
      `,
    },
  },

  "social-welfare": {
    sw: {
      name: "Ustawi wa Kijamii",
      shortDescription:
        "Huduma za kijamii kwa watu na familia kupitia msaada wa wahitaji, zakat, sadaqah, dharura na huduma nyingine.",
      description: `
Programu ya Ustawi wa Kijamii ya AMYC inalenga kuimarisha huruma, utu na mshikamano ndani ya jamii. Programu hii hushughulikia mahitaji mbalimbali ya kijamii yanayowakabili watu binafsi na familia, ikiwa ni pamoja na msaada kwa watu wenye changamoto za maisha, familia zenye mahitaji, huduma zinazohusiana na zakat na sadaqah, misaada ya dharura, huduma za ndoa, maandalizi ya mazishi na huduma nyingine za kijamii.

Programu hii hutekelezwa kupitia mfumo wa AMYC unaohusisha Majimbo na matawi yake. Mfumo huu huwezesha viongozi na wahudumu wa eneo kuelewa hali halisi ya jamii wanayoihudumia na kutambua mahitaji kulingana na mazingira ya eneo husika. Kwa hiyo, aina na kiwango cha huduma vinaweza kutofautiana kutoka Jimbo moja hadi jingine kulingana na mahitaji, rasilimali zilizopo na ushirikiano unaopatikana.

AMYC inalenga kuhakikisha kuwa huduma za ustawi zinatolewa kwa utu, heshima na kwa kuzingatia haki. Lengo si kutoa msaada wa muda pekee, bali pale inapowezekana kusaidia watu na familia kupata mazingira yatakayowawezesha kuwa imara na kujitegemea zaidi.

Taasisi inatambua kuwa ustawi wa jamii ni jukumu la pamoja. Kwa hiyo, AMYC hushirikiana na jamii, wajitolea, wahisani, taasisi za misaada, wataalamu na wadau wengine katika kushughulikia mahitaji yanayotambuliwa.

AMYC inakaribisha jamii kushiriki katika kuimarisha huduma hizi kupitia kujitolea, kutoa msaada wa kijamii, utaalamu, rasilimali na kujenga ushirikiano wenye manufaa. Kwa pamoja, juhudi hizi zinaweza kusaidia kupunguza changamoto, kulinda utu wa wahitaji na kujenga utamaduni wa huruma, mshikamano na uwajibikaji.
      `,
    },
    ar: {
      name: "الرعاية الاجتماعية",
      shortDescription:
        "خدمات اجتماعية للأفراد والأسر من خلال مساعدة المحتاجين والزكاة والصدقات والإغاثة والخدمات المجتمعية.",
      description: `
يهدف برنامج الرعاية الاجتماعية في مركز أنصار الشباب المسلم إلى تعزيز الرحمة والكرامة والتكافل داخل المجتمع. ويعمل البرنامج على الاستجابة للاحتياجات الاجتماعية التي تواجه الأفراد والأسر، بما في ذلك مساعدة المحتاجين والأسر المتعففة وخدمات الزكاة والصدقات والإغاثة الطارئة وخدمات الزواج والجنائز وغيرها من الخدمات الاجتماعية.

ويُنفذ هذا البرنامج من خلال الهيكل المؤسسي للمركز عبر الولايات والفروع. ويساعد هذا النظام العاملين في المناطق المختلفة على فهم الواقع المحلي وتحديد الاحتياجات وفقاً للظروف الخاصة بكل مجتمع. ولذلك قد تختلف طبيعة وحجم الخدمات من ولاية إلى أخرى بحسب الاحتياجات والموارد المتاحة ومستوى التعاون والدعم.

ويحرص المركز على تقديم خدمات الرعاية بكرامة واحترام وعدالة. ولا يقتصر الهدف على تقديم المساعدة المؤقتة، بل يسعى المركز، حيثما أمكن، إلى مساعدة الأفراد والأسر على بناء أوضاع أكثر استقراراً وقدرة على الاعتماد على النفس.

ويؤمن المركز بأن رعاية المجتمع مسؤولية مشتركة، ولذلك يتعاون مع أفراد المجتمع والمتطوعين والمحسنين والمؤسسات الخيرية والمتخصصين والشركاء الآخرين للاستجابة للاحتياجات التي يتم تحديدها.

ويرحب المركز بكل من يرغب في دعم هذه الجهود من خلال التطوع والخبرة والموارد والمساهمات والشراكات البناءة. ومن خلال التعاون يمكن للمجتمع أن يخفف من المعاناة ويحفظ كرامة المحتاجين ويعزز ثقافة الرحمة والتكافل والمسؤولية الاجتماعية.
      `,
    },
  },

  "community-services": {
    sw: {
      name: "Huduma za Jamii",
      shortDescription:
        "Huduma na miradi ya miundombinu inayolenga kushughulikia mahitaji muhimu ya jamii na kuboresha maisha ya watu.",
      description: `
Programu ya Huduma za Jamii ya AMYC inalenga kushughulikia mahitaji ya vitendo yanayowakabili Waislamu na jamii kwa ujumla. Pamoja na kuwa elimu ya dini na elimu ya kawaida ni sehemu muhimu ya kazi za taasisi, AMYC inatambua kuwa jamii yenye ustawi inahitaji pia huduma muhimu na miundombinu inayosaidia watu kuishi kwa utu na usalama.

Kupitia Majimbo na matawi yake, AMYC hutambua mahitaji ya jamii kulingana na mazingira na vipaumbele vya eneo husika. Kulingana na hali na rasilimali zilizopo, huduma zinaweza kujumuisha kuchimba visima na kusaidia upatikanaji wa maji safi, ujenzi na ukarabati wa misikiti, miundombinu ya jamii, msaada wa dharura na miradi mingine inayoweza kuboresha maisha ya wananchi.

Huduma hizi hazitekelezwi kwa mfumo mmoja katika kila eneo. Kila Jimbo huzingatia mahitaji ya jamii, ukubwa wa changamoto, uwezekano wa utekelezaji, rasilimali zilizopo na fursa za ushirikiano. Hii huwezesha AMYC kuelekeza juhudi katika maeneo ambayo yana mahitaji halisi.

Kwa miradi kama visima, misikiti na miundombinu mingine, AMYC inaweza kushirikiana na wahisani, wafadhili, taasisi za misaada, jamii za maeneo husika, wataalamu, mamlaka za serikali na wadau wengine wa maendeleo. Ushiriki wa jamii ni muhimu kwa sababu miradi endelevu huhitaji umiliki, uangalizi na ushirikiano wa wananchi.

AMYC inakaribisha watu binafsi, taasisi na wadau mbalimbali kushiriki katika juhudi hizi kupitia utaalamu, kujitolea, rasilimali na ushirikiano. Kwa pamoja, tunaweza kusaidia jamii kukabiliana na mahitaji muhimu na kujenga mazingira bora ya maisha.
      `,
    },
    ar: {
      name: "خدمات المجتمع",
      shortDescription:
        "خدمات ومشاريع مجتمعية تهدف إلى تلبية الاحتياجات الأساسية وتحسين ظروف الحياة.",
      description: `
يركز برنامج خدمات المجتمع في مركز أنصار الشباب المسلم على الاستجابة للاحتياجات العملية التي تواجه المجتمعات المسلمة والمجتمع عامة. ومع أهمية التعليم الديني والأكاديمي في رسالة المركز، يدرك المركز أن المجتمع المستقر يحتاج أيضاً إلى الخدمات الأساسية والبنية التحتية التي تساعد الناس على العيش بكرامة وأمان.

ومن خلال الولايات والفروع، يعمل المركز على تحديد احتياجات المجتمعات وفق ظروف كل منطقة وأولوياتها. وبحسب الحاجة والموارد المتاحة، قد تشمل الخدمات حفر الآبار وتوفير المياه النظيفة وبناء المساجد وترميمها وإنشاء مرافق مجتمعية وتقديم المساعدة في حالات الطوارئ وغيرها من المبادرات التي تسهم في تحسين ظروف الحياة.

ولا تُنفذ هذه الخدمات بالطريقة نفسها في جميع المناطق، بل تنظر كل ولاية إلى احتياجات المجتمع وحجم التحديات والإمكانات المتاحة وفرص التعاون. ويساعد هذا النهج على توجيه الجهود نحو الاحتياجات الحقيقية.

وفي المشاريع مثل حفر الآبار وبناء المساجد والمرافق المجتمعية، قد يتعاون المركز مع المحسنين والمانحين والمؤسسات الخيرية والمجتمعات المحلية والمتخصصين والجهات الحكومية وشركاء التنمية الآخرين. وتعد مشاركة المجتمع أمراً مهماً لضمان استدامة المشاريع وقيام السكان بدورهم في المحافظة عليها.

ويرحب المركز بالأفراد والمؤسسات والشركاء الراغبين في دعم هذه الجهود من خلال الخبرة والتطوع والموارد والشراكات. ومن خلال التعاون يمكن للمجتمعات أن تواجه احتياجاتها الأساسية وتبني بيئة أفضل وأكثر استقراراً للحياة.
      `,
    },
  },

  healthcare: {
    sw: {
      name: "Afya",
      shortDescription:
        "Huduma na elimu ya afya zinazolenga kuimarisha ustawi wa mwili, kinga na uelewa wa afya katika jamii.",
      description: `
AMYC inatambua kuwa afya njema ni msingi muhimu wa maisha yenye tija na utu. Programu ya Afya inalenga kuchangia ustawi wa watu na jamii kupitia huduma za afya, elimu ya afya, uhamasishaji wa kinga na shughuli za kijamii zinazohusiana na afya pale huduma hizo zinapopatikana na kuwa na umuhimu katika eneo husika.

Kupitia mfumo wa Majimbo, AMYC hujibu mahitaji ya afya kulingana na mazingira ya kila jamii. Aina ya huduma inaweza kutofautiana kutoka eneo moja hadi jingine kulingana na mahitaji, upatikanaji wa vituo, wataalamu, vifaa na fursa za ushirikiano. Hii huwezesha kila eneo kuzingatia changamoto zinazohitaji kipaumbele.

Pale huduma au miradi ya afya inapotekelezwa, AMYC inalenga kukuza uelewa wa afya, kinga, huduma yenye heshima na ustawi wa jamii. Shughuli zinaweza kujumuisha huduma za msingi, elimu ya afya, uhamasishaji kuhusu afya ya mama na mtoto, kampeni za afya na shughuli nyingine zinazolenga jamii.

Miradi ya afya mara nyingi huhitaji utaalamu, vifaa, miundombinu na rasilimali. Kwa sababu hiyo, AMYC inaweza kushirikiana na wataalamu wa afya, wafadhili, taasisi za misaada, serikali, jamii na wadau wengine ili kuimarisha ubora na upatikanaji wa huduma.

AMYC inaamini kuwa afya ni jukumu la pamoja. Watu binafsi na taasisi wanaweza kushiriki kupitia utaalamu, kujitolea, rasilimali, elimu na ushirikiano. Kupitia programu hii, taasisi inalenga kuchangia jamii yenye uelewa zaidi wa afya, yenye uwezo wa kukabiliana na changamoto na yenye mshikamano katika kulinda ustawi wa watu wake.
      `,
    },
    ar: {
      name: "الرعاية الصحية",
      shortDescription:
        "خدمات وتوعية صحية تهدف إلى تعزيز الصحة والوقاية ورفع الوعي الصحي في المجتمع.",
      description: `
يدرك مركز أنصار الشباب المسلم أن الصحة الجيدة أساس مهم للحياة المنتجة والكريمة. ويهدف برنامج الرعاية الصحية إلى الإسهام في رفاه الأفراد والمجتمعات من خلال الخدمات الصحية والتوعية والوقاية والمبادرات المجتمعية المتعلقة بالصحة حيثما تتوفر الإمكانات وتكون هناك حاجة إليها.

ومن خلال نظام الولايات، يستجيب المركز للاحتياجات الصحية وفق ظروف كل مجتمع. وقد تختلف طبيعة الخدمات من منطقة إلى أخرى بحسب الاحتياجات وتوفر المرافق والكوادر والمعدات وفرص التعاون. ويساعد ذلك على توجيه الجهود نحو الأولويات الصحية الحقيقية في كل منطقة.

وعندما تُنفذ مبادرات صحية، يسعى المركز إلى تعزيز الوعي الصحي والوقاية والرعاية القائمة على احترام كرامة الإنسان. وقد تشمل الأنشطة الخدمات الصحية الأساسية والتثقيف الصحي والتوعية بصحة الأم والطفل والحملات الصحية وغيرها من المبادرات المناسبة للمجتمع.

وتحتاج المشاريع الصحية غالباً إلى الخبرة والمعدات والمرافق والموارد. ولذلك قد يتعاون المركز مع العاملين في المجال الصحي والمانحين والمؤسسات الخيرية والجهات الحكومية والمجتمعات المحلية والشركاء الآخرين لتعزيز جودة الخدمات ووصولها إلى المستفيدين.

ويؤمن المركز بأن صحة المجتمع مسؤولية مشتركة. ويمكن للأفراد والمؤسسات المساهمة من خلال الخبرة والتطوع والموارد والتوعية والشراكات. ومن خلال هذا البرنامج يسعى المركز إلى الإسهام في بناء مجتمع أكثر وعياً بالصحة وأكثر قدرة على مواجهة التحديات وأكثر تعاوناً في حماية رفاه أفراده.
      `,
    },
  },

  "youth-development": {
    sw: {
      name: "Maendeleo ya Vijana",
      shortDescription:
        "Mafunzo ya uongozi, stadi, malezi, ushauri na kujenga uwezo wa vijana kuwa viongozi na watumishi wa jamii.",
      description: `
Vijana ni sehemu muhimu ya sasa na mustakabali wa kila jamii. Programu ya Maendeleo ya Vijana ya AMYC inalenga kuwasaidia vijana Waislamu kujenga maarifa, kujiamini, uongozi, maadili mema na stadi mbalimbali zinazowawezesha kuchangia kwa njia chanya katika jamii.

Programu hii inatambua kuwa mahitaji na fursa za vijana hutofautiana kulingana na maeneo wanayoishi. Kupitia Majimbo na matawi yake, AMYC huandaa na kuunga mkono shughuli za vijana kulingana na mazingira, rasilimali na vipaumbele vya eneo husika.

Shughuli zinaweza kujumuisha mafunzo ya uongozi, ushauri na malezi, elimu ya maadili ya Kiislamu, kujenga stadi, michezo na burudani yenye manufaa, huduma za jamii, mijadala ya vijana na programu zinazohamasisha vijana kushiriki katika maendeleo.

AMYC inaamini kuwa malezi ya vijana yanahitaji ushirikiano kati ya vijana, wazazi, walimu, wanazuoni, viongozi wa jamii, wataalamu na taasisi. Kwa hiyo, taasisi inahimiza ushirikiano unaowapa vijana mazingira mazuri ya kujifunza, kupata uzoefu na kukuza uwezo wao.

Pia AMYC inahimiza vijana kuwa washiriki hai katika maendeleo badala ya kuwa wapokeaji wa huduma pekee. Kupitia kujitolea, elimu, huduma za jamii na nafasi za uongozi, vijana wanaweza kujenga uwajibikaji kwa familia zao na jamii.

AMYC inakaribisha watu binafsi na taasisi kusaidia maendeleo ya vijana kupitia ushauri, mafunzo, utaalamu, rasilimali na ushirikiano. Kuwekeza kwa vijana leo ni kujenga kizazi cha kesho chenye elimu, ujuzi, uadilifu na moyo wa kuitumikia jamii.
      `,
    },
    ar: {
      name: "تنمية الشباب",
      shortDescription:
        "التدريب والمهارات والإرشاد وبناء الشخصية القيادية للشباب وتمكينهم من خدمة مجتمعاتهم.",
      description: `
يمثل الشباب جزءاً مهماً من حاضر كل مجتمع ومستقبله. ويهدف برنامج تنمية الشباب في مركز أنصار الشباب المسلم إلى مساعدة الشباب المسلمين على بناء المعرفة والثقة بالنفس والمهارات القيادية والأخلاق والقدرات العملية التي تمكنهم من الإسهام الإيجابي في المجتمع.

ويدرك البرنامج أن احتياجات الشباب وفرصهم تختلف من منطقة إلى أخرى. ومن خلال الولايات والفروع، يعمل المركز على دعم وتنفيذ الأنشطة الشبابية وفق الظروف المحلية والموارد المتاحة والأولويات التي تحتاج إليها المجتمعات.

وقد تشمل الأنشطة التدريب على القيادة والإرشاد والتربية الإسلامية وتنمية المهارات والرياضة والأنشطة النافعة وخدمة المجتمع والحوارات الشبابية والبرامج التي تشجع على المشاركة المسؤولة في المجتمع.

ويؤمن المركز بأن تنمية الشباب تحتاج إلى تعاون الشباب وأولياء الأمور والمعلمين والعلماء وقادة المجتمع والمتخصصين والمؤسسات. ولذلك يشجع المركز الشراكات التي توفر للشباب بيئات إيجابية للتعلم واكتساب الخبرة وتنمية قدراتهم.

كما يشجع المركز الشباب على أن يكونوا شركاء فاعلين في التنمية وليسوا مجرد مستفيدين من الخدمات. فمن خلال التطوع والتعليم وخدمة المجتمع والفرص القيادية يستطيع الشباب تطوير الشعور بالمسؤولية تجاه أسرهم ومجتمعاتهم.

ويرحب المركز بالأفراد والمؤسسات الراغبين في دعم تنمية الشباب من خلال الإرشاد والتدريب والخبرة والموارد والشراكات. فالاستثمار في الشباب اليوم هو استثمار في جيل المستقبل القادر على خدمة المجتمع بالعلم والمهارة والأمانة والقيم.
      `,
    },
  },

  "development-projects": {
    sw: {
      name: "Miradi ya Maendeleo",
      shortDescription:
        "Miradi ya maji, elimu, miundombinu, misikiti na mazingira inayolenga kuboresha maisha na uwezo wa jamii.",
      description: `
Programu ya Miradi ya Maendeleo ya AMYC inalenga kusaidia juhudi za kuboresha maisha na uwezo wa jamii kupitia miradi ya vitendo. Taasisi inatambua kuwa maendeleo endelevu hayategemei msaada wa mtu mmoja mmoja pekee, bali yanahitaji miundombinu, huduma muhimu, elimu na fursa zinazowezesha jamii kujenga maisha bora.

Kupitia mfumo wa Majimbo na matawi, AMYC hutambua vipaumbele vya maendeleo kulingana na mahitaji na mazingira ya kila jamii. Miradi inaweza kujumuisha uchimbaji wa visima na upatikanaji wa maji safi, ujenzi au ukarabati wa shule, ujenzi na ukarabati wa misikiti, shughuli za usafi wa mazingira, uhifadhi wa mazingira na miundombinu mingine ya jamii.

Aina na ukubwa wa miradi vinaweza kutofautiana kutoka eneo moja hadi jingine. Kila mradi hutegemea mahitaji yaliyobainishwa, uwezekano wa utekelezaji, rasilimali, ushiriki wa jamii na fursa za kupata washirika. Mfumo huu huwezesha taasisi kuelekeza nguvu kwenye mahitaji halisi badala ya kutumia mpango mmoja kwa kila eneo.

Miradi mingi ya maendeleo huhitaji ushirikiano wa wadau mbalimbali. AMYC inaweza kushirikiana na wahisani, wafadhili, taasisi za misaada, jamii, serikali, wataalamu na wadau wengine wa maendeleo. Ushirikiano huu unaweza kutoa rasilimali, utaalamu, vifaa, fedha, kujitolea na msaada mwingine unaohitajika.

AMYC inaamini kuwa miradi yenye mafanikio inapaswa kuwa na manufaa kwa jamii na pia kujenga umiliki na uwajibikaji wa wananchi. Kwa hiyo, ushiriki wa jamii ni sehemu muhimu ya kupanga, kutekeleza na kuhifadhi miradi.

Taasisi inakaribisha watu binafsi, wafadhili, taasisi na wadau wengine kushiriki katika juhudi hizi. Kwa kushirikiana, tunaweza kukabiliana na mahitaji muhimu na kujenga jamii yenye huduma bora, uwezo na maendeleo endelevu.
      `,
    },
    ar: {
      name: "مشاريع التنمية",
      shortDescription:
        "مشاريع المياه والتعليم والبنية التحتية والمساجد والبيئة التي تهدف إلى تحسين حياة المجتمعات.",
      description: `
يهدف برنامج مشاريع التنمية في مركز أنصار الشباب المسلم إلى دعم المبادرات العملية التي تسهم في تحسين ظروف الحياة وتعزيز قدرات المجتمعات. ويدرك المركز أن التنمية المستدامة لا تقوم على المساعدات الفردية وحدها، بل تحتاج إلى البنية التحتية والخدمات الأساسية والتعليم والفرص التي تساعد المجتمعات على بناء مستقبل أفضل.

ومن خلال نظام الولايات والفروع، يعمل المركز على تحديد أولويات التنمية وفق احتياجات وظروف كل مجتمع. وقد تشمل المشاريع حفر الآبار وتوفير المياه النظيفة وبناء المدارس أو تحسينها وبناء المساجد وترميمها ومبادرات النظافة وحماية البيئة وغيرها من مشاريع البنية التحتية المجتمعية.

وقد تختلف طبيعة وحجم المشاريع من منطقة إلى أخرى بحسب الاحتياجات المحددة وإمكانية التنفيذ والموارد ومشاركة المجتمع وفرص التعاون. ويساعد هذا النهج المركز على توجيه جهوده نحو الاحتياجات الحقيقية بدلاً من تطبيق نموذج واحد على جميع المناطق.

وتحتاج كثير من المشاريع التنموية إلى تعاون مختلف الأطراف. ولذلك قد يتعاون المركز مع المحسنين والمانحين والمؤسسات الخيرية والمجتمعات المحلية والجهات الحكومية والمتخصصين وشركاء التنمية الآخرين. ويمكن لهذه الشراكات أن توفر الموارد والخبرات والمعدات والتمويل والعمل التطوعي وغيرها من أشكال الدعم.

ويؤمن المركز بأن نجاح المشاريع يرتبط بمشاركة المجتمع وملكيته للمشروع وتحمله لمسؤولية المحافظة عليه. ولذلك تعد مشاركة السكان جزءاً مهماً من التخطيط والتنفيذ والاستدامة.

ويرحب المركز بالأفراد والمانحين والمؤسسات والشركاء الآخرين للمشاركة في هذه الجهود. ومن خلال التعاون يمكن مواجهة الاحتياجات الأساسية وبناء مجتمعات تتمتع بخدمات أفضل وقدرة أكبر على تحقيق التنمية المستدامة.
      `,
    },
  },

  "media-communication": {
    sw: {
      name: "Media na Mawasiliano",
      shortDescription:
        "Redio, mitandao ya kidijitali na mawasiliano yanayowasilisha elimu, habari, mihadhara na taarifa za jamii.",
      description: `
AMYC inatambua nafasi muhimu ya vyombo vya habari na mawasiliano katika kuelimisha jamii, kusambaza maarifa yenye manufaa na kuwaunganisha watu na shughuli za taasisi. Programu ya Media na Mawasiliano hutumia njia mbalimbali zinazofaa kuwasilisha elimu ya Kiislamu, taarifa za jamii, matangazo, habari, mihadhara na maudhui mengine yenye manufaa.

Programu hii huwezesha AMYC kufikisha ujumbe wake zaidi ya maeneo yenye vituo, shule, misikiti na matawi ya taasisi. Kupitia redio, mitandao ya kijamii, majukwaa ya kidijitali na njia nyingine za mawasiliano, taasisi inaweza kuwafikia watu katika maeneo mbalimbali na kuwawezesha kupata taarifa kuhusu huduma na shughuli zake.

Majimbo na matawi ya AMYC pia yana nafasi katika mawasiliano ya jamii. Mahitaji ya taarifa yanaweza kutofautiana kutoka eneo moja hadi jingine, hivyo maudhui yanaweza kuhusisha elimu, dini, ustawi wa jamii au maendeleo kulingana na vipaumbele vya eneo husika, huku yakizingatia ujumbe na malengo ya taasisi kwa ujumla.

Vyombo vya habari pia ni muhimu katika kujenga uwazi na uelewa wa umma. Kwa kutoa taarifa kuhusu shughuli, programu, fursa za elimu na miradi ya jamii, AMYC inalenga kusaidia watu kuelewa taasisi ni nani, inafanya nini na mchango wake kwa jamii ni upi.

AMYC inahimiza matumizi ya vyombo vya habari kwa uwajibikaji, usahihi, maadili mema na maudhui yenye manufaa. Pia inakaribisha ushirikiano na wataalamu wa habari, walimu, wabunifu wa maudhui, wataalamu wa teknolojia, wajitolea na taasisi nyingine zinazoweza kuimarisha uwezo wa mawasiliano.

Kupitia programu hii, AMYC inalenga kujenga jamii yenye taarifa, elimu na mawasiliano bora huku ikiendeleza uelewa wa umma kuhusu kazi na mchango wa taasisi.
      `,
    },
    ar: {
      name: "الإعلام والاتصال",
      shortDescription:
        "الإذاعة والمنصات الرقمية ووسائل الاتصال لنشر التعليم والأخبار والمحاضرات والمعلومات المجتمعية.",
      description: `
يدرك مركز أنصار الشباب المسلم الدور المهم للإعلام والاتصال في تثقيف المجتمع ونشر المعرفة النافعة وربط الناس بأنشطة المؤسسة. ويستخدم برنامج الإعلام والاتصال وسائل مناسبة لنشر التعليم الإسلامي والمعلومات المجتمعية والإعلانات والأخبار والمحاضرات والمحتوى المفيد.

ويساعد البرنامج المركز على إيصال رسالته إلى ما وراء الأماكن التي توجد فيها مراكزه ومدارسه ومساجده وفروعه. ومن خلال الإذاعة ووسائل التواصل الاجتماعي والمنصات الرقمية وغيرها من وسائل الاتصال، يستطيع المركز الوصول إلى جمهور أوسع وتقديم المعلومات حول خدماته وأنشطته.

وتشارك الولايات والفروع في عملية التواصل مع المجتمعات المحلية. وقد تختلف احتياجات المعلومات من منطقة إلى أخرى، ولذلك يمكن أن تتناول المواد الإعلامية الجوانب التعليمية والدينية والاجتماعية والتنموية بحسب أولويات كل منطقة، مع الالتزام برسالة المؤسسة وأهدافها العامة.

ويعد الإعلام أيضاً وسيلة مهمة لتعزيز الشفافية والوعي العام. ومن خلال نشر المعلومات عن الأنشطة والبرامج والفرص التعليمية والمشاريع المجتمعية، يسعى المركز إلى مساعدة الناس على فهم هوية المؤسسة وما تقوم به وإسهامها في المجتمع.

ويشجع المركز الاستخدام المسؤول للإعلام القائم على الدقة والأخلاق والمعلومات النافعة واحترام المجتمع. كما يرحب بالتعاون مع الإعلاميين والمتخصصين في التعليم وصناع المحتوى وخبراء التقنية والمتطوعين والمؤسسات التي يمكنها الإسهام في تطوير قدرات الاتصال.

ومن خلال هذا البرنامج، يسعى المركز إلى بناء مجتمع أكثر وعياً وترابطاً، وتوسيع الوصول إلى المعرفة النافعة، وتعزيز فهم الجمهور لرسالة المؤسسة ودورها في خدمة المجتمع.
      `,
    },
  },

  "orphan-welfare": {
    sw: {
      name: "Ustawi wa Mayatima",
      shortDescription:
        "Malezi, elimu, ulinzi na msaada kwa watoto yatima ili wakue katika mazingira salama yenye kuwajenga.",
      description: `
Programu ya Ustawi wa Mayatima ya AMYC inalenga kuwasaidia watoto yatima kukua katika mazingira yanayolinda utu wao, elimu, afya, usalama na mustakabali wao. Taasisi inatambua kuwa mtoto aliyepoteza mzazi au mlezi anaweza kuhitaji msaada unaozidi mahitaji ya chakula au mahitaji ya muda mfupi.

Kupitia mfumo wa taasisi na mtandao wa jamii, AMYC hujitahidi kutambua na kuitikia mahitaji ya watoto yatima kulingana na mazingira ya kila eneo. Msaada unaweza kujumuisha elimu, chakula, mavazi, makazi pale inapohitajika, huduma za afya, malezi ya Kiislamu, msaada wa kijamii na aina nyingine za mahitaji kulingana na hali ya mtoto na rasilimali zilizopo.

Programu hii inaweka msisitizo mkubwa katika elimu na malezi kwa sababu ustawi wa muda mrefu wa mtoto yatima hauishii katika kumpatia mahitaji ya msingi. Mtoto anahitaji pia fursa ya kupata elimu, kujenga stadi, kujiamini, kuwa na maadili na kuandaliwa kwa maisha ya kujitegemea.

AMYC inatambua kuwa kuwahudumia mayatima ni jukumu la pamoja la jamii. Kwa hiyo, taasisi inaweza kushirikiana na wafadhili, wahisani, taasisi za misaada, shule, wataalamu wa afya, wajitolea, familia, jamii na wadau wengine katika kuimarisha huduma kwa watoto.

Mahitaji ya watoto yatima yanaweza kutofautiana kutoka eneo moja hadi jingine. Majimbo na matawi ya AMYC hivyo hujibu mahitaji kulingana na hali halisi ya jamii, huku yakizingatia dhamira ya taasisi ya kulinda watoto na kuwawezesha kukua kwa utu.

AMYC inakaribisha ushirikiano wenye uwajibikaji katika kusaidia watoto yatima. Kupitia elimu, malezi, huruma na ushirikiano wa jamii, tunaweza kuwasaidia watoto kukua kwa heshima, kutumia vipaji vyao na kuwa watu wenye uwezo na maadili mema katika jamii.
      `,
    },
    ar: {
      name: "رعاية الأيتام",
      shortDescription:
        "رعاية وتعليم وحماية ودعم الأطفال الأيتام لمساعدتهم على النمو في بيئة آمنة ومناسبة.",
      description: `
يهدف برنامج رعاية الأيتام في مركز أنصار الشباب المسلم إلى دعم الأطفال الأيتام ومساعدتهم على النمو في بيئة تحفظ كرامتهم وتعليمهم وصحتهم وسلامتهم ومستقبلهم. ويدرك المركز أن الطفل الذي فقد أحد والديه أو من يقوم على رعايته قد يحتاج إلى دعم يتجاوز الاحتياجات المادية المؤقتة.

ومن خلال الهيكل المؤسسي وشبكة المجتمع، يسعى المركز إلى التعرف على احتياجات الأطفال الأيتام والاستجابة لها وفق ظروف كل منطقة. وقد تشمل المساعدة التعليم والطعام والملابس والسكن عند الحاجة والرعاية الصحية والتربية الإسلامية والدعم الاجتماعي وغيرها من أشكال المساعدة بحسب حالة الطفل والموارد المتاحة.

ويركز البرنامج بصورة خاصة على التعليم والتربية، لأن رعاية اليتيم على المدى الطويل لا تقتصر على توفير الاحتياجات الأساسية، بل تحتاج أيضاً إلى توفير فرص التعليم وتنمية المهارات وبناء الثقة بالنفس والأخلاق والاستعداد للحياة المستقلة.

ويؤمن المركز بأن رعاية الأيتام مسؤولية مشتركة للمجتمع. ولذلك قد يتعاون مع المانحين والمحسنين والمؤسسات الخيرية والمدارس والمتخصصين في الصحة والمتطوعين والأسر والمجتمعات المحلية والشركاء الآخرين لتعزيز الخدمات المقدمة للأطفال.

وقد تختلف احتياجات الأيتام من مجتمع إلى آخر، ولذلك تعمل الولايات والفروع على الاستجابة للظروف المحلية مع الالتزام برسالة المؤسسة في حماية الأطفال ودعم نموهم وتنمية قدراتهم.

ويرحب المركز بالشراكات المسؤولة التي تساعد في دعم الأطفال الأيتام. ومن خلال التعليم والرعاية والرحمة وتعاون المجتمع، يمكننا مساعدة الأطفال على النمو بكرامة وتنمية قدراتهم ليصبحوا أفراداً صالحين وقادرين على خدمة مجتمعهم.
      `,
    },
  },
};


// ── Attach multilingual content ────────────────────────────────────────

const programmeSectionHeadings = {
  en: ["Overview", "How the programme serves communities", "Services and activities", "Partnership and delivery", "Community outcomes", "Get involved"],
  sw: ["Utangulizi", "Utekelezaji kupitia Majimbo", "Huduma na shughuli", "Ushirikiano na wadau", "Mchango kwa jamii", "Shiriki nasi"],
  ar: ["نبذة عن البرنامج", "خدمة المجتمعات عبر الولايات", "الخدمات والأنشطة", "التنفيذ والشراكات", "الأثر المجتمعي", "شارك معنا"],
} as const

const programmeImageGalleries: Record<string, string[]> = {
  dawah: ["/images/daawah_amyc.jpg", "/images/treasure_hq.jpeg"],
  education: ["/images/school_muzdalifah.JPG", "/images/semina_for_student_assalaf_islamic_school.jpg", "/images/student-muzdalifah.JPG"],
  "social-welfare": ["/images/Student_arafah.jpg", "/images/avicina_primary.jpg"],
  "community-services": ["/images/daarul_arqam.JPG", "/images/service_community_health.jpg"],
  healthcare: ["/images/Heaith_care.jpg", "/images/service_community_health.jpg"],
  "youth-development": ["/images/graduu.jpg", "/images/student-muzdalifah.JPG"],
  "development-projects": ["/images/school_muzdalifah.JPG", "/images/daarul_arqam.JPG"],
  "media-communication": ["/images/IMG-20261001-WA0071.jpg", "/images/treasure_hq.jpeg"],
  "orphan-welfare": ["/images/misaada.JPG", "/images/Student_arafah.jpg"],
}

function splitProgrammeSections(description: string, locale: keyof typeof programmeSectionHeadings) {
  return description.trim().split(/\n\s*\n/).map((content, index) => ({
    heading: programmeSectionHeadings[locale][Math.min(index, programmeSectionHeadings[locale].length - 1)],
    content: content.trim(),
  })).filter((section) => section.content)
}

for (const p of programmes) {
  const localized = programmeTranslations[p.slug] || {};
  const translations = {
    en: { name: p.name, shortDescription: p.shortDescription, description: p.description.trim(), sections: splitProgrammeSections(p.description, "en") },
    sw: { ...localized.sw, sections: splitProgrammeSections(localized.sw.description, "sw") },
    ar: { ...localized.ar, sections: splitProgrammeSections(localized.ar.description, "ar") },
    galleryImages: programmeImageGalleries[p.slug] || [],
  };

  const withTr = {
    ...p,
    translations: JSON.stringify(translations),
  };

  await db.programme.upsert({
    where: { slug: p.slug },
    update: withTr,
    create: withTr,
  });
}

console.log(
  `✓ ${programmes.length} programmes seeded with full English, Swahili and Arabic content`
);
  // ── Schools (verified list from amyc.or.tz) ─────────────────────────────
  const maahad = [
    ["Maahad Abubakar Swiddiq", "Named after the first Caliph, Abubakar as-Siddiq (RA)."],
    ["Maahad Daarul Arqam", "Daarul Arqam — a historic house of learning in early Islam."],
    ["Maahad Ibn Masoud", "Named after the companion Abdullah ibn Mas'ud (RA)."],
    ["Maahad Umar Ibn Khatwab", "Named after the second Caliph, Umar ibn al-Khattab (RA)."],
    ["Maahad Ibn Umar", "Named after the companion Abdullah ibn Umar (RA)."],
    ["Maahad Ummu Salamah", "Dedicated female seminary, named after Umm Salamah (RA), wife of the Prophet ﷺ."],
    ["Maahad Al Farouq", "Al-Farooq — the title of Caliph Umar (RA)."],
    ["Maahad Imam Shafi", "Named after Imam ash-Shafi'i, founder of the Shafi'i school of jurisprudence."],
  ]
  const secondary = [
    ["Ibn Hambal Islamic Seminary Secondary School", "Named after Imam Ahmad ibn Hanbal."],
    ["Al Fallah Islamic Seminary Secondary School", "Al-Fallah — success and prosperity."],
    ["Assalaf Islamic Seminary Secondary School", "As-Salaf — the pious predecessors."],
    ["Aswidiq Islamic Seminary Secondary School", "A variant spelling of As-Siddiq."],
    ["Qudus Islamic Seminary Secondary School", "Qudus — holiness."],
    ["Al Hijrah Islamic Seminary Secondary School", "Al-Hijrah — the migration."],
    ["Namirah Islamic Seminary Secondary School", "Namirah — the site of the Prophet's ﷺ farewell hajj sermon."],
    ["Arafah Islamic Seminary Secondary School", "Named after the plain of Arafat."],
  ]
  const primary = [
    ["Al Farouq Islamic Primary School", "Swahili-medium primary school."],
    ["Swafaa Islamic Primary School", "Swafaa — purity and devotion."],
    ["Muzdalifah Islamic Primary School", "Named after the Muzdalifah site of Hajj."],
    ["Al Fallah Islamic Primary School", "Swahili-medium primary school."],
    ["Qudus Islamic Primary School", "Swahili-medium primary school."],
    ["Marwah Islamic Primary School", "Named after the Marwah hill of Sa'y."],
    ["Avicenna Islamic Primary School", "Named after Ibn Sina (Avicenna)."],
    ["Jakaya Kikwete Primary School", "Named after former Tanzanian President Jakaya Kikwete."],
    ["Muadh Bin Jabal Primary School", "Named after the companion Mu'adh ibn Jabal (RA)."],
    ["Assalaf Islamic Primary School", "Swahili-medium primary school."],
    ["Al-Hijra Islamic Primary School", "Swahili-medium primary school."],
    ["Arafah Islamic English Medium Primary School", "English-medium stream of the Arafah brand."],
  ]

  let order = 0
  const amycDirectoryUrl = "https://amyc.or.tz/sw/"
  const directoryMaahad = new Set(["Maahad Abubakar Swiddiq", "Maahad Daarul Arqam", "Maahad Ibn Masoud", "Maahad Umar Ibn Khatwab", "Maahad Ibn Umar", "Maahad Ummu Salamah"])
  for (const [name] of maahad) {
    await db.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        type: "MAAHAD",
        category: "Religious",
        level: null,
        gender: name === "Maahad Ummu Salamah" ? "Girls" : null,
        medium: null,
        region: null,
        about: directoryMaahad.has(name)
          ? "Listed in the AMYC directory as a religious school. The campus location, programmes and facilities require confirmation from AMYC."
          : "This legacy entry is not in the current public AMYC schools directory. Confirm its name and status before publication.",
        history: null,
        facilities: JSON.stringify([]),
        levelsOffered: JSON.stringify([]),
        verificationStatus: directoryMaahad.has(name) ? "PARTIAL" : "UNVERIFIED",
        status: directoryMaahad.has(name) ? "PUBLISHED" : "DRAFT",
        sortOrder: order++,
        sourceUrl: amycDirectoryUrl,
        sources: JSON.stringify([{ url: amycDirectoryUrl, name: "AMYC official directory", fields: ["school name", "listing"] }]),
        sourceName: "AMYC official website — List of Schools",
      },
    })
  }
  await db.school.upsert({
    where: { slug: slug("Arafah Teachers College") },
    update: {},
    create: {
      name: "Arafah Teachers College",
      slug: slug("Arafah Teachers College"),
      type: "COLLEGE",
      category: "Environmental",
      level: null,
      gender: null,
      medium: null,
      region: null,
      about: "Listed in the AMYC directory. The campus location, programmes and facilities require confirmation from AMYC.",
      facilities: JSON.stringify([]),
      levelsOffered: JSON.stringify([]),
      verificationStatus: "PARTIAL",
      sortOrder: order++,
      sourceUrl: amycDirectoryUrl,
      sources: JSON.stringify([{ url: amycDirectoryUrl, name: "AMYC official directory", fields: ["school name", "listing"] }]),
      sourceName: "AMYC official website — List of Schools",
    },
  })
  for (const [name] of secondary) {
    await db.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        type: "SECONDARY",
        category: "Environmental",
        level: "Secondary",
        gender: null,
        medium: null,
        region: null,
        about: "Listed in the AMYC directory as an environmental school. The campus location, programmes and facilities require confirmation from AMYC.",
        facilities: JSON.stringify([]),
        levelsOffered: JSON.stringify(["Secondary"]),
        verificationStatus: "PARTIAL",
        sortOrder: order++,
        sourceUrl: amycDirectoryUrl,
        sources: JSON.stringify([{ url: amycDirectoryUrl, name: "AMYC official directory", fields: ["school name", "listing", "directory category"] }]),
        sourceName: "AMYC official website — List of Schools",
      },
    })
  }
  for (const [name] of primary) {
    await db.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        type: "PRIMARY",
        category: "Environmental",
        level: "Primary",
        gender: null,
        medium: name.includes("English Medium") ? "English medium" : null,
        region: null,
        about: "Listed in the AMYC directory as an environmental school. The campus location, programmes and facilities require confirmation from AMYC.",
        facilities: JSON.stringify([]),
        levelsOffered: JSON.stringify(["Primary"]),
        verificationStatus: "PARTIAL",
        sortOrder: order++,
        sourceUrl: amycDirectoryUrl,
        sources: JSON.stringify([{ url: amycDirectoryUrl, name: "AMYC official directory", fields: ["school name", "listing", "directory category"] }]),
        sourceName: "AMYC official website — List of Schools",
      },
    })
  }
  console.log(`  ✓ ${maahad.length + 1 + secondary.length + primary.length} schools`)

  // ── Regions / Majimbo (verified list) ───────────────────────────────────
  const regions = [
    ["Jimbo la Tanga Mjini", "Tanga City", "Tanga", "The headquarters region of AMYC, coordinating da'wah, school supervision, welfare and national administration."],
    ["Jimbo la Muheza", "Muheza", "Tanga", "Supporting schools, mosque coordination and zakat distribution in Muheza District."],
    ["Jimbo la Korogwe", "Korogwe", "Tanga", "Youth programmes, halaqah and community outreach in Korogwe Town."],
    ["Jimbo la Pangani", "Pangani", "Tanga", "Coastal da'wah and welfare for fishing communities along the Pangani coast."],
    ["Jimbo la Lushoto Mjini", "Lushoto", "Tanga", "Education and da'wah in the Usambara mountain communities."],
    ["Jimbo la Moa", "Moa", "Tanga", "Rural da'wah and school support in the Moa area."],
    ["Jimbo la Mkinga", "Mkinga", "Tanga", "Border-area community programmes in Mkinga District."],
    ["Jimbo la Handeni", "Handeni", "Tanga", "Rural development projects including well drilling and mosque construction."],
    ["Jimbo la Maramba", "Maramba", "Tanga", "Community services and mosque construction in the Maramba area."],
    ["Jimbo la Kilindi", "Kilindi", "Tanga", "Da'wah and education in the remote Kilindi District."],
    ["Jimbo la Nkamba Kidatu", "Nkamba-Kidatu", "Tanga", "Community welfare around the Nkamba-Kidatu hydro area."],
    ["Jimbo la Matui – Azimio", "Matui-Azimio", "Tanga", "Branch-level da'wah and welfare in the Matui-Azimio locality."],
    ["Jimbo la Mikunda – Mtwara", "Mikunda", "Mtwara", "Southern-region da'wah and school support."],
    ["Jimbo la Masasi", "Masasi", "Mtwara", "Community welfare and mosque building in Masasi District."],
    ["Jimbo la Mbinga", "Mbinga", "Ruvuma", "Highland da'wah and rural education in Mbinga District."],
    ["Jimbo la Karagwe", "Karagwe", "Kagera", "Western-lake region da'wah in Karagwe District."],
    ["Jimbo la Bukoba Mjini", "Bukoba City", "Kagera", "Urban da'wah and youth programmes in Bukoba."],
    ["Jimbo la Katoro", "Katoro", "Kagera", "Rural community welfare on the Geita/Kagera border."],
    ["Jimbo la Misenyi", "Misenyi", "Kagera", "Border-area mosque and school support in Misenyi District."],
    ["Jimbo la Kyaka", "Kyaka", "Kagera", "Community outreach in the Kyaka border-trade area."],
    ["Jimbo la Muleba", "Muleba", "Kagera", "Lakeside community development in Muleba District."],
    ["Jimbo la Singida", "Singida", "Singida", "Central-region da'wah and well drilling in the dry Singida area."],
    ["Jimbo la Juhudi Makonga", "Juhudi Makonga", "Tanga", "Branch-level community programmes (locality to be confirmed)."],
    ["Jimbo la Kitangili – Newara", "Kitangili-Newara", "Tanga", "Rural da'wah and welfare (locality to be confirmed)."],
    ["Jimbo la Kanda ya Kaskazini", "Northern Zone", "Zonal", "Umbrella zonal coordination across northern Tanzania branches."],
  ]
  const regionLocations: Record<string, { administrativeRegion: string; district?: string }> = {
    "Jimbo la Tanga Mjini": { administrativeRegion: "Tanga", district: "Tanga City Council" },
    "Jimbo la Muheza": { administrativeRegion: "Tanga", district: "Muheza District Council" },
    "Jimbo la Pangani": { administrativeRegion: "Tanga", district: "Pangani District Council" },
    "Jimbo la Lushoto Mjini": { administrativeRegion: "Tanga", district: "Lushoto District Council" },
    "Jimbo la Kilindi": { administrativeRegion: "Tanga", district: "Kilindi District Council" },
    "Jimbo la Moa": { administrativeRegion: "Tanga", district: "Mkinga District Council" },
    "Jimbo la Mkinga": { administrativeRegion: "Tanga", district: "Mkinga District Council" },
    "Jimbo la Handeni": { administrativeRegion: "Tanga", district: "Handeni District Council" },
    "Jimbo la Maramba": { administrativeRegion: "Tanga", district: "Mkinga District Council" },
    "Jimbo la Korogwe": { administrativeRegion: "Tanga" },
    "Jimbo la Karagwe": { administrativeRegion: "Kagera", district: "Karagwe District Council" },
    "Jimbo la Bukoba Mjini": { administrativeRegion: "Kagera", district: "Bukoba Municipal Council" },
    "Jimbo la Misenyi": { administrativeRegion: "Kagera", district: "Missenyi District Council" },
    "Jimbo la Muleba": { administrativeRegion: "Kagera", district: "Muleba District Council" },
    "Jimbo la Mbinga": { administrativeRegion: "Ruvuma", district: "Mbinga District Council" },
    "Jimbo la Masasi": { administrativeRegion: "Mtwara", district: "Masasi District Council" },
    "Jimbo la Mikunda – Mtwara": { administrativeRegion: "Mtwara" },
    "Jimbo la Singida": { administrativeRegion: "Singida" },
  }
  const regionGovernmentSources: Record<string, string> = {}

  let rOrder = 0
  for (const [name, en] of regions) {
    const location = regionLocations[name] || (name.startsWith("Jimbo la Mikunda") ? { administrativeRegion: "Mtwara" } : undefined)
    const sources = [
      { url: amycDirectoryUrl, name: "AMYC official list of Majimbo", fields: ["Jimbo name", "directory listing"] },
      ...(location && regionGovernmentSources[location.administrativeRegion]
        ? [{ url: regionGovernmentSources[location.administrativeRegion], name: `${location.administrativeRegion} Region Government`, fields: ["administrative region reference; does not verify AMYC branch location"] }]
        : []),
    ]
    await db.region.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        englishName: en,
        overview: location
          ? "This Jimbo is listed in the AMYC directory. The location shown is a preliminary name-based match; AMYC must confirm the branch address and service area."
          : "This Jimbo is listed in the AMYC directory. Its administrative location and branch address still require confirmation from AMYC.",
        administrativeRegion: location?.administrativeRegion || null,
        district: location?.district || null,
        locationVerificationStatus: location ? "PARTIAL" : "UNVERIFIED",
        sourceUrl: amycDirectoryUrl,
        sourceName: "AMYC official list of Majimbo; locality requires confirmation",
        sources: JSON.stringify(sources),
        history: null,
        leadership: JSON.stringify([]),
        activities: JSON.stringify([]),
        branches: JSON.stringify([]),
        sortOrder: rOrder++,
        status: "PUBLISHED",
      },
    })
  }
  console.log(`  ✓ ${regions.length} regions (Majimbo)`)

  // ── Articles (News + Announcements) ─────────────────────────────────────
  const now = new Date()
  const past = (days: number) => new Date(now.getTime() - days * 86400000)
  const future = (days: number) => new Date(now.getTime() + days * 86400000)

  const articles = [
    {
      kind: "NEWS",
      title: "AMYC Distributes Over 1,350 kg of Rice as Zakatul Fitr",
      slug: "amyc-distributes-zakatul-fitr-1350kg-rice",
      excerpt:
        "The Ansaar Muslim Youth Centre distributed more than 1,350 kilograms of rice as Zakatul Fitr to families across its Majimbo.",
      content:
        "As part of its annual welfare programme, the Ansaar Muslim Youth Centre (AMYC) distributed over 1,350 kilograms of rice as Zakatul Fitr to needy families across its network of Majimbo. The distribution, coordinated through regional branches, ensured that families could observe Eid al-Fitr with dignity. AMYC's welfare arm works year-round to identify vulnerable households and deliver support in a culturally appropriate manner.",
      category: "Welfare",
      author: "AMYC Media Desk",
      status: "PUBLISHED",
      featured: true,
      publishedAt: past(20),
      featuredImage: "/images/news-zakat.jpg",
      translations: JSON.stringify({
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
      }),
    },
    {
      kind: "NEWS",
      title: "Tanga Regional Administrative Secretary Speaks on the Importance of the Hijab",
      slug: "tanga-ras-speaks-on-hijab-importance",
      excerpt:
        "The Tanga Regional Administrative Secretary addressed the community on the role of the hijab in strengthening morals and safety.",
      content:
        "The Tanga Regional Administrative Secretary delivered a public lecture, organized under AMYC's da'wah programme, on the importance of the hijab in strengthening moral character and personal safety. The lecture formed part of a series of community engagements aimed at reinforcing Islamic values and public awareness.",
      category: "Da'wah",
      author: "AMYC Media Desk",
      status: "PUBLISHED",
      featured: false,
      publishedAt: past(25),
      featuredImage: "/images/news-hijab.jpg",
    },
    {
      kind: "NEWS",
      title: "Heads of AMYC Schools Receive Modern Training Guidelines",
      slug: "amyc-school-heads-receive-modern-guidelines",
      excerpt:
        "Heads of AMYC schools gathered for a capacity-building session to receive modern management and pedagogical guidelines.",
      content:
        "Heads of AMYC schools across the network convened for a capacity-building programme to receive modern management and pedagogical guidelines. The initiative reflects AMYC's commitment to continuous improvement in the quality of education across its more than 25 institutions, blending authentic Islamic knowledge with contemporary academic standards.",
      category: "Education",
      author: "AMYC Education Department",
      status: "PUBLISHED",
      featured: true,
      publishedAt: past(12),
      featuredImage: "/images/news-schools.jpg",
    },
    {
      kind: "ANNOUNCEMENT",
      title: "Eid al-Fitr to be Observed on Wednesday — Moon Not Sighted",
      slug: "eid-al-fitr-wednesday-moon-not-sighted",
      excerpt:
        "The moon was not sighted; Eid al-Fitr will be observed on Wednesday. AMYC wishes the community a blessed Eid.",
      content:
        "Following the conclusion of Ramadan and the non-sighting of the Shawwal crescent, Eid al-Fitr will be observed on Wednesday. The Ansaar Muslim Youth Centre wishes all Muslims a blessed Eid. May Allah accept our fasting, prayers and good deeds. Eid prayers will be held at AMYC mosques and designated grounds across all Majimbo.",
      category: "Announcement",
      author: "AMYC Secretariat",
      status: "PUBLISHED",
      featured: false,
      publishedAt: past(40),
      expiresAt: past(10), // auto-archived
      featuredImage: "/images/news-eid.jpg",
    },
    {
      kind: "ANNOUNCEMENT",
      title: "Community Iftar Programme — Ramadan Sponsorship Open",
      slug: "community-iftar-programme-ramadan",
      excerpt:
        "AMYC and its Majimbo are hosting community Iftars across five regions. Sponsorship is open.",
      content:
        "During the blessed month of Ramadan, AMYC and its Majimbo host community Iftar programmes across Tanga, Mtwara, Kagera, Ruvuma and Singida regions. Community members and well-wishers are invited to sponsor an Iftar. Contributions can be channelled through the AMYC headquarters or any regional branch.",
      category: "Welfare",
      author: "AMYC Welfare Department",
      status: "PUBLISHED",
      featured: false,
      publishedAt: past(5),
      expiresAt: future(30),
      featuredImage: "/images/news-iftar.jpg",
    },
    {
      kind: "NEWS",
      title: "Annual General Meeting — Call to Delegates",
      slug: "annual-general-meeting-call-to-delegates",
      excerpt:
        "All AMYC branch chairpersons and delegates are invited to the Annual General Meeting at the Tanga headquarters.",
      content:
        "The Annual General Meeting of the Ansaar Muslim Youth Centre will convene at the Tanga headquarters. All branch chairpersons and delegates are invited to attend. The agenda includes the presentation of the annual report, audited financial statements, programme reviews, and elections in accordance with AMYC's constitution and Islamic principles.",
      category: "Governance",
      author: "AMYC Secretariat",
      status: "PUBLISHED",
      featured: false,
      publishedAt: past(8),
      featuredImage: "/images/news-agm.jpg",
    },
    {
      kind: "NEWS",
      title: "Scholarships Announced for Orphaned Students",
      slug: "scholarships-announced-for-orphaned-students",
      excerpt:
        "AMYC is offering scholarships for orphaned students to continue secondary and tertiary education.",
      content:
        "As part of its Orphan Welfare programme, AMYC has announced scholarships enabling orphaned students to continue their secondary and tertiary education. Application forms are available at all AMYC branches. The scholarship covers tuition, learning materials and basic welfare support, reflecting AMYC's commitment to nurturing self-reliant, righteous young adults.",
      category: "Education",
      author: "AMYC Welfare Department",
      status: "PUBLISHED",
      featured: true,
      publishedAt: past(3),
      featuredImage: "/images/news-scholarship.jpg",
    },
  ]
  for (const a of articles) {
    await db.article.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    })
  }
  console.log(`  ✓ ${articles.length} articles`)

  // ── Events ──────────────────────────────────────────────────────────────
  const events = [
    {
      title: "Annual General Meeting 2026",
      slug: "annual-general-meeting-2026",
      description:
        "The Annual General Meeting of AMYC, convening delegates from all Majimbo for the annual report, audited accounts and elections.",
      image: "/images/event-agm.jpg",
      startDate: future(45),
      endDate: future(45),
      startTime: "09:00",
      endTime: "16:00",
      venue: "AMYC Headquarters Hall",
      location: "Tanga, Tanzania",
      organizer: "AMYC Secretariat",
      category: "Governance",
      status: "PUBLISHED",
    },
    {
      title: "National Da'wah Conference",
      slug: "national-dawah-conference-2026",
      description:
        "A gathering of du'aat and imaams from across the AMYC network to strengthen da'wah methodology and coordination.",
      image: "/images/event-dawah.jpg",
      startDate: future(20),
      endDate: future(21),
      startTime: "08:30",
      venue: "Maahad Abubakar Swiddiq Hall",
      location: "Tanga, Tanzania",
      organizer: "AMYC Da'wah Department",
      category: "Da'wah",
      status: "PUBLISHED",
    },
    {
      title: "Youth Leadership Retreat",
      slug: "youth-leadership-retreat-2026",
      description:
        "A character-building and leadership retreat for young Muslims across AMYC branches.",
      image: "/images/event-youth.jpg",
      startDate: future(60),
      startTime: "10:00",
      venue: "Lushoto Camp",
      location: "Lushoto, Tanga",
      organizer: "AMYC Youth Development",
      category: "Youth",
      status: "PUBLISHED",
    },
    {
      title: "Community Health Camp — Handeni",
      slug: "community-health-camp-handeni",
      description:
        "A free community health camp offering check-ups, maternal and child health outreach, and preventive education.",
      image: "/images/event-health.jpg",
      startDate: past(15),
      startTime: "09:00",
      venue: "Handeni Town",
      location: "Handeni, Tanga",
      organizer: "AMYC Health Department",
      category: "Healthcare",
      status: "PUBLISHED",
    },
  ]
  for (const e of events) {
    await db.event.upsert({
      where: { slug: e.slug },
      update: e,
      create: e,
    })
  }
  console.log(`  ✓ ${events.length} events`)

  // ── Documents ───────────────────────────────────────────────────────────
  const documents = [
    { title: "AMYC Annual Report 2024", category: "Annual Report", description: "Programmes, finance and impact report for the year 2024.", fileType: "pdf" },
    { title: "AMYC Strategic Plan 2025–2030", category: "Strategic Plan", description: "The six-year strategic plan outlining AMYC's institutional priorities.", fileType: "pdf" },
    { title: "Child Protection & Safeguarding Policy", category: "Policy", description: "Policy framework for the protection and safeguarding of children across AMYC institutions.", fileType: "pdf" },
    { title: "Education & Schools Standards Policy", category: "Policy", description: "Standards governing the operation and quality of AMYC schools.", fileType: "pdf" },
    { title: "Student Admission Form", category: "Form", description: "Admission application form for AMYC primary, secondary and Maahad institutions.", fileType: "pdf" },
    { title: "Orphan Sponsorship Application Form", category: "Form", description: "Application form for the AMYC orphan sponsorship programme.", fileType: "pdf" },
    { title: "Branch / Jimbo Registration Form", category: "Form", description: "Registration form for new AMYC branches and Majimbo.", fileType: "pdf" },
    { title: "Volunteer / Membership Application Form", category: "Form", description: "Application form for volunteers and new members.", fileType: "pdf" },
    { title: "AMYC Schools Prospectus", category: "Publication", description: "A prospectus introducing AMYC's network of schools and institutions.", fileType: "pdf" },
    { title: "Audited Financial Statements 2024", category: "Financial", description: "Independently audited financial statements for the year 2024.", fileType: "pdf" },
    { title: "Branch Operations Manual", category: "Guideline", description: "Operational guidelines for AMYC branches and Majimbo committees.", fileType: "pdf" },
    { title: "Quarterly Da'wah Bulletin — Q1 2026", category: "Publication", description: "The quarterly bulletin covering da'wah activities and reflections.", fileType: "pdf" },
  ]
  for (const d of documents) {
    await db.document.upsert({
      where: { slug: slug(d.title) },
      update: {},
      create: {
        ...d,
        slug: slug(d.title),
        fileName: `${slug(d.title)}.pdf`,
        filePath: `/uploads/docs/${slug(d.title)}.pdf`,
        fileSize: 0,
        mimeType: "application/pdf",
        author: "AMYC Secretariat",
        department: "Headquarters",
        status: "PUBLISHED",
        publishedAt: now,
      },
    })
  }
  console.log(`  ✓ ${documents.length} documents`)

  // ── Galleries & Media (DEMO/SEED DATA ONLY) ───────────────────────────
  // ⚠️ NOTE: These are DEMO galleries for development/testing purposes only.
  // Admin should manage real galleries via CMS at /admin/media
  const galleries = [
    { title: "Eid Celebration 2025", category: "Events" },
    { title: "School Graduation Ceremony", category: "Schools" },
    { title: "Community Well Project — Handeni", category: "Projects" },
    { title: "Da'wah Lecture Series", category: "Da'wah" },
    { title: "Orphan Care Programme", category: "Community Work" },
  ]
  for (const g of galleries) {
    const gal = await db.gallery.upsert({
      where: { slug: slug(g.title) },
      update: { category: `DEMO — ${g.category}`, status: "DRAFT" },
      create: {
        title: g.title,
        slug: slug(g.title),
        description: `DEMO CONTENT — ${g.title}. Replace or delete this development example in the Media & Gallery CMS.`,
        category: `DEMO — ${g.category}`,
        coverImage: null,
        status: "DRAFT",
      },
    })
    // Demo items are drafts and upserted by gallery + URL, so repeated seeds do not duplicate them.
    for (let i = 1; i <= 4; i++) {
      const mediaUrl = `/images/gallery-${slug(g.title)}-${i}.jpg`
      await db.galleryItem.upsert({
        where: { galleryId_mediaUrl: { galleryId: gal.id, mediaUrl } },
        update: { caption: `DEMO — ${g.title} image ${i}`, sortOrder: i },
        create: { galleryId: gal.id, mediaUrl, caption: `DEMO — ${g.title} image ${i}`, sortOrder: i },
      })
    }
  }

  // ── Leaders (placeholder — to be confirmed) ─────────────────────────────
  const leaders = [
    ["Chairperson (Mwenyekiti)", "Elected by the General Assembly"],
    ["Vice Chairperson (Naibu Mwenyekiti)", ""],
    ["Secretary General (Katibu Mkuu)", ""],
    ["Deputy Secretary General", ""],
    ["Treasurer (Mhazini)", ""],
    ["Head of Da'wah", "Oversees da'wah programmes nationwide"],
    ["Head of Education", "Oversees the 25+ schools"],
    ["Head of Social Welfare & Orphan Care", ""],
    ["Head of Health", ""],
    ["Head of Media & Communication", "Oversees Radio Ihsaan FM"],
    ["Head of Youth Development", ""],
    ["Head of Development Projects", ""],
  ]
  let lOrder = 0
  for (const [position, note] of leaders) {
    await db.leader.create({
      data: {
        name: "To be confirmed",
        position: note ? `${position} — ${note}` : position,
        category: "NATIONAL",
        bio: "Leadership details are to be confirmed with AMYC before publication.",
        sortOrder: lOrder++,
      },
    }).catch(() => {})
  }
  console.log(`  ✓ leadership structure`)

  // ── Pages (static) ──────────────────────────────────────────────────────
  const pages = [
    {
      slug: "about",
      title: "About AMYC",
      excerpt:
        "Ansaar Muslim Youth Centre (AMYC) is a pioneering Islamic organization based in Tanga, Tanzania, established in 1980.",
      content: `## Who We Are

Ansaar Muslim Youth Centre (AMYC) is a pioneering Islamic organization based in Tanga, Tanzania. It was established in **1980** with the mission of reviving the authentic teachings of Islam and fostering the holistic development of youth within the faith.

Over more than four decades of service, AMYC has grown into a multi-programme institution operating a nationwide network of schools, regional branches (*Majimbo*), community welfare initiatives, healthcare contributions, orphan care programmes, and an in-house media and communications arm — including its own radio station, **Radio Ihsaan FM**.

## Organizational Structure

AMYC operates on a structured system of branches and regions, ensuring a cohesive and efficient organizational framework. Each branch is formed by a minimum of 15 members and contributes to the collective efforts of regional development. The organization maintains a disciplined electoral system at all levels, adhering strictly to Islamic laws.

## Our Values

- **Awareness** — Being mindful and conscious of one's actions, thoughts, and intentions as per the Islamic teachings.
- **Quality** — Striving for excellence, integrity, and high standards in all aspects of life.
- **Wisdom** — Seeking, understanding and applying knowledge and sound judgment in decision-making.
- **Adherence** — Upholding steadfastness, discipline, and commitment to Islamic principles.
- **Trustworthiness** — Demonstrating honesty, integrity, and reliability in all endeavors.
- **Collaboration** — Working together effectively to achieve common goals.`,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      excerpt: "How the Ansaar Muslim Youth Centre collects, uses and protects your information.",
      content: `## Privacy Policy

The Ansaar Muslim Youth Centre (AMYC) is committed to protecting the privacy of visitors to this website. This policy describes how we collect, use and safeguard your information.

### Information We Collect

- Contact details you submit through our contact and inquiry forms (name, email, phone, subject, message).
- Anonymous analytics about website use. A first-party random browser cookie helps count unique visitors for up to one year; the database stores only a keyed hash, country-level location supplied by the hosting proxy, and page-view records. IP addresses, names and browser identifiers are not stored.
- Information you provide when registering for events or programmes.

### How We Use Information

- To respond to your inquiries and provide requested services.
- To improve our programmes and website.
- To send institutional communications where you have consented.

### Data Security

We apply appropriate technical and organizational measures to protect your information, including secure password hashing, access controls and audit logging.

### Your Rights

You may request access to, correction of, or deletion of your personal data by contacting info@amyc.or.tz.`,
    },
    {
      slug: "terms",
      title: "Terms of Use",
      excerpt: "The terms governing use of the AMYC website.",
      content: `## Terms of Use

By accessing this website you agree to the following terms:

1. Content published on this website is the property of the Ansaar Muslim Youth Centre (AMYC) unless otherwise stated.
2. Information is provided for general informational purposes and may be updated without notice.
3. External links are provided for reference; AMYC is not responsible for the content of external sites.
4. Unauthorised attempts to access or compromise this website's security are prohibited and may be subject to legal action.
5. Trademarks, logos and institutional imagery may not be used without prior written permission.`,
    },
    {
      slug: "accessibility",
      title: "Accessibility Statement",
      excerpt: "AMYC's commitment to an accessible website.",
      content: `## Accessibility Statement

The Ansaar Muslim Youth Centre is committed to making its website accessible to all users, including those with disabilities. We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.

If you encounter any accessibility barrier on this site, please contact us at info@amyc.or.tz so we can address it.`,
    },
    {
      slug: "cookie-policy",
      title: "Cookie Policy",
      excerpt: "How AMYC uses cookies.",
      content: `## Cookie Policy

This website uses essential cookies to maintain your session and preference settings. We do not use third-party tracking cookies without your consent. You can control cookies through your browser settings.`,
    },
  ]
  for (const p of pages) {
    await db.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, content: p.content, excerpt: p.excerpt, status: "PUBLISHED" },
      create: { ...p, status: "PUBLISHED" },
    })
  }

  // ── Social Links ────────────────────────────────────────────────────────
  // Upsert matching demo links without deleting CMS-managed social links.
  const socials = [
    { platform: "Facebook", url: "https://www.facebook.com/ihsaanfm", handle: "Ihsaan FM", icon: "Facebook", sortOrder: 1 },
    { platform: "YouTube", url: "https://youtube.com/@IHSAANTV", handle: "Ihsaan TV", icon: "Youtube", sortOrder: 2 },
    { platform: "Instagram - AMYC HQ", url: "https://www.instagram.com/amyc_hq", handle: "@amyc_hq", icon: "Instagram", sortOrder: 3 },
    { platform: "Instagram - Ihsaan FM", url: "https://www.instagram.com/ihsaanfmradio", handle: "@ihsaanfmradio", icon: "Instagram", sortOrder: 4 },
    { platform: "Twitter", url: "https://twitter.com/IhsaanfmRadio", handle: "@IhsaanfmRadio", icon: "Twitter", sortOrder: 5 },
  ]
  for (const s of socials) {
    const existing = await db.socialLink.findFirst({ where: { platform: s.platform, url: s.url } })
    if (existing) await db.socialLink.update({ where: { id: existing.id }, data: s })
    else await db.socialLink.create({ data: s })
  }

  // ── External Links ──────────────────────────────────────────────────────
  const extLinks = [
    { label: "Radio Ihsaan FM", url: "#", category: "Institution", sortOrder: 1 },
    { label: "AMYC Official (current site)", url: "https://amyc.or.tz/", category: "Institution", sortOrder: 2 },
  ]
  for (const l of extLinks) {
    await db.externalLink.create({ data: l }).catch(() => {})
  }

  // ── Welcome audit log ───────────────────────────────────────────────────
  await db.auditLog.create({
    data: {
      userName: "System",
      action: "SYSTEM",
      entity: "System",
      detail: "AMYC database seeded with verified institutional content.",
    },
  })

  console.log("\n✅ Seed complete.")
  console.log("   Public site → /   Admin dashboard → /admin")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

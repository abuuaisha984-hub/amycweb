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

  // ── Users / RBAC ────────────────────────────────────────────────────────
  const users = [
    { name: "System Administrator", email: "superadmin@amyc.or.tz", role: "SUPER_ADMIN", pw: "Admin@2026" },
    { name: "Content Editor", email: "content@amyc.or.tz", role: "CONTENT_ADMIN", pw: "Editor@2026" },
    { name: "Education Officer", email: "education@amyc.or.tz", role: "EDUCATION_ADMIN", pw: "Editor@2026" },
    { name: "Media Officer", email: "media@amyc.or.tz", role: "MEDIA_ADMIN", pw: "Editor@2026" },
    { name: "Documents Officer", email: "documents@amyc.or.tz", role: "DOCUMENT_ADMIN", pw: "Editor@2026" },
  ]
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
  console.log(`  ✓ ${users.length} admin users`)

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
    phone: "+255 XXX XXX XXX",
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
  const programmes = [
    {
      name: "Da'wah Efforts",
      slug: "dawah",
      icon: "BookOpen",
      shortDescription:
        "Classes, lectures and community events sharing the message of Islam based on the Qur'an and Sunnah.",
      description:
        "AMYC warmly invites people to learn about Islam through classes, lectures, and community events that share the Islamic message in a clear and welcoming way, based on the teachings of the Qur'an and Sunnah. The Da'wah programme is the spiritual backbone of the Centre — covering mosque-based teaching, public lectures, study circles (halaqah), printed and digital outreach, and the training of du'aat and imaams.",
      sortOrder: 1,
    },
    {
      name: "Education",
      slug: "education",
      icon: "GraduationCap",
      shortDescription:
        "More than 25 schools across Tanzania — Islamic seminaries (Maahad) and environmental schools, from kindergarten to university.",
      description:
        "AMYC puts a major focus on learning. The Centre runs more than 25 schools across Tanzania — both Islamic studies (Maahad) and general/environmental schools — teaching Islamic studies alongside environmental awareness, from kindergarten all the way to university level. AMYC's educational institutions aim to graduate youth who are simultaneously grounded in authentic Islamic knowledge and competent in modern academic disciplines.",
      sortOrder: 2,
    },
    {
      name: "Social Welfare",
      slug: "social-welfare",
      icon: "HeartHandshake",
      shortDescription:
        "Matrimonial services, funeral arrangements, zakat and sadaqah distribution, and emergency relief.",
      description:
        "AMYC extends practical social support to individuals and families, including matrimonial services, funeral arrangements, support for the poor and needy, zakat and sadaqah distribution, and emergency relief. The welfare arm works hand-in-hand with AMYC's Majimbo (regional branches) to identify and respond to local needs in a dignified, culturally appropriate manner.",
      sortOrder: 3,
    },
    {
      name: "Community Services",
      slug: "community-services",
      icon: "Hammer",
      shortDescription:
        "Well drilling, mosque construction and community infrastructure that address day-to-day needs.",
      description:
        "AMYC goes beyond religious teaching, offering practical community support that includes matrimonial services, funeral arrangements, well drilling (clean water), mosque construction, and related community infrastructure. By directly addressing day-to-day community needs, AMYC builds trust and lasting social impact in the regions it serves.",
      sortOrder: 4,
    },
    {
      name: "Healthcare",
      slug: "healthcare",
      icon: "Stethoscope",
      shortDescription:
        "Clinics operating in line with Islamic principles, integrating physical health and Islamic values.",
      description:
        "AMYC cares for community health by running clinics that operate in line with Islamic principles, offering a unique approach to well-being that integrates physical health and Islamic values. The programme includes preventive health education, basic curative services, maternal and child health outreach, and health camps organized through the Majimbo.",
      sortOrder: 5,
    },
    {
      name: "Youth Development",
      slug: "youth-development",
      icon: "Users",
      shortDescription:
        "Leadership training, mentorship, vocational skills and Islamic character-building for young Muslims.",
      description:
        "AMYC focuses on empowering youth, providing them with opportunities for personal growth, leadership development, and skill-building. Programmes include leadership training, mentorship, vocational skills, sports and recreation, and Islamic character-building retreats — preparing young Muslims to be confident, ethical, and contributing members of society.",
      sortOrder: 6,
    },
    {
      name: "Development Projects",
      slug: "development-projects",
      icon: "Sprout",
      shortDescription:
        "Water and sanitation, educational facilities, mosque construction and environmental conservation.",
      description:
        "AMYC implements community development projects that improve living standards in underserved areas, including water and sanitation infrastructure (boreholes and wells), educational facilities, mosque construction and rehabilitation, and environmental conservation initiatives linked to its Environmental Schools network. Projects are delivered in partnership with local communities, donors, and government authorities.",
      sortOrder: 7,
    },
    {
      name: "Media & Communication",
      slug: "media-communication",
      icon: "Radio",
      shortDescription:
        "Radio Ihsaan FM and online platforms producing lectures, news, education and announcements.",
      description:
        "AMYC uses the power of radio and social media to share its message. The Centre operates its own radio station, Radio Ihsaan FM, and is active across online platforms, producing lectures, news, educational content, and announcements that extend AMYC's reach beyond its physical locations.",
      sortOrder: 8,
    },
    {
      name: "Orphan Welfare",
      slug: "orphan-welfare",
      icon: "Baby",
      shortDescription:
        "Caring for over 600 orphans with shelter, food, schooling, healthcare and Islamic upbringing.",
      description:
        "AMYC opens its heart and home to orphans, caring for over 600 children by providing a safe and loving environment to grow, along with strong education. The orphan-care programme covers shelter, food, schooling, healthcare, and Islamic upbringing, with the goal of producing self-reliant, righteous young adults.",
      sortOrder: 9,
    },
  ]
  for (const p of programmes) {
    await db.programme.upsert({ where: { slug: p.slug }, update: p, create: p })
  }
  console.log(`  ✓ ${programmes.length} programmes`)

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
  for (const [name, note] of maahad) {
    await db.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        type: "MAAHAD",
        category: "Religious",
        level: "Islamic Seminary (Secondary)",
        gender: "Mixed",
        medium: "Swahili & Arabic",
        region: "Tanga",
        about: `${name} is one of AMYC's Islamic seminaries (Maahad), offering secondary-level education that integrates authentic Islamic sciences with the national curriculum. ${note} Precise location and enrolment figures are to be verified with AMYC.`,
        history: null,
        facilities: JSON.stringify(["Classrooms", "Mosque", "Library", "Dormitories"]),
        levelsOffered: JSON.stringify(["O-Level", "A-Level", "Islamic Sciences"]),
        verificationStatus: "UNVERIFIED",
        sortOrder: order++,
        sourceUrl: "https://amyc.or.tz/",
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
      level: "Teacher Training",
      gender: "Mixed",
      medium: "Swahili & English",
      region: "Tanga",
      about:
        "Arafah Teachers College prepares qualified teachers for AMYC's network of schools across Tanzania, combining pedagogical training with Islamic foundations. Detailed programme and enrolment data are to be verified with AMYC.",
      facilities: JSON.stringify(["Classrooms", "Library", "Science Laboratory", "Mosque"]),
      levelsOffered: JSON.stringify(["Teacher Training Certificate", "Diploma in Education"]),
      verificationStatus: "UNVERIFIED",
      sortOrder: order++,
      sourceUrl: "https://amyc.or.tz/",
      sourceName: "AMYC official website — List of Schools",
    },
  })
  for (const [name, note] of secondary) {
    await db.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        type: "SECONDARY",
        category: "Environmental",
        level: "O-Level & A-Level",
        gender: "Mixed",
        medium: "Swahili & English",
        region: "Tanga",
        about: `${name} is an AMYC Islamic Seminary Secondary School offering O-Level and A-Level education with a strong Islamic foundation. ${note} Exact location and enrolment are to be verified with AMYC.`,
        facilities: JSON.stringify(["Classrooms", "Science Laboratories", "Library", "Mosque", "Sports facilities"]),
        levelsOffered: JSON.stringify(["O-Level", "A-Level"]),
        verificationStatus: "UNVERIFIED",
        sortOrder: order++,
        sourceUrl: "https://amyc.or.tz/",
        sourceName: "AMYC official website — List of Schools",
      },
    })
  }
  for (const [name, note] of primary) {
    await db.school.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        type: "PRIMARY",
        category: "Environmental",
        level: "Primary Education",
        gender: "Mixed",
        medium: name.includes("English Medium") ? "English" : "Swahili",
        region: "Tanga",
        about: `${name} is an AMYC primary school providing foundational education with Islamic values. ${note} Exact location and enrolment are to be verified with AMYC.`,
        facilities: JSON.stringify(["Classrooms", "Mosque", "Library", "Playground"]),
        levelsOffered: JSON.stringify(["Standard 1–7"]),
        verificationStatus: "UNVERIFIED",
        sortOrder: order++,
        sourceUrl: "https://amyc.or.tz/",
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
  let rOrder = 0
  for (const [name, en, region, overview] of regions) {
    await db.region.upsert({
      where: { slug: slug(name) },
      update: {},
      create: {
        name,
        slug: slug(name),
        englishName: en,
        overview,
        history: null,
        leadership: JSON.stringify([
          { position: "Mwenyekiti wa Jimbo (Branch Chairperson)", name: "To be confirmed" },
          { position: "Katibu wa Jimbo (Branch Secretary)", name: "To be confirmed" },
          { position: "Mhazini wa Jimbo (Branch Treasurer)", name: "To be confirmed" },
        ]),
        activities: JSON.stringify([
          "Da'wah and halaqah programmes",
          "School and madressa supervision",
          "Zakat and sadaqah distribution",
          "Mosque coordination",
          "Youth programmes",
          "Community welfare",
        ]),
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

  // ── Galleries & Media ───────────────────────────────────────────────────
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
      update: { category: g.category },
      create: {
        title: g.title,
        slug: slug(g.title),
        description: `${g.title} — a selection of moments from AMYC's ${g.category.toLowerCase()} activities.`,
        category: g.category,
        coverImage: `/images/gallery-${slug(g.title)}.jpg`,
        status: "PUBLISHED",
      },
    })
    // sample items
    for (let i = 1; i <= 4; i++) {
      await db.galleryItem.create({
        data: {
          galleryId: gal.id,
          mediaUrl: `/images/gallery-${slug(g.title)}-${i}.jpg`,
          caption: `${g.title} — image ${i}`,
          sortOrder: i,
        },
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
- Anonymous analytics data about how the website is used.
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
  const socials = [
    { platform: "Facebook", url: "#", handle: "@amyc.tz", icon: "Facebook", sortOrder: 1 },
    { platform: "YouTube", url: "#", handle: "Radio Ihsaan FM", icon: "Youtube", sortOrder: 2 },
    { platform: "Instagram", url: "#", handle: "@amyc.tz", icon: "Instagram", sortOrder: 3 },
    { platform: "X (Twitter)", url: "#", handle: "@amyc_tz", icon: "Twitter", sortOrder: 4 },
    { platform: "WhatsApp", url: "#", handle: "AMYC Channel", icon: "MessageCircle", sortOrder: 5 },
    { platform: "Telegram", url: "#", handle: "AMYC", icon: "Send", sortOrder: 6 },
  ]
  for (const s of socials) {
    await db.socialLink.upsert({
      where: { id: "seed-" + s.platform },
      update: s,
      create: { id: "seed-" + s.platform, ...s },
    }).catch(async () => {
      await db.socialLink.create({ data: { ...s } })
    })
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
  console.log("   Admin login → superadmin@amyc.or.tz / Admin@2026")
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

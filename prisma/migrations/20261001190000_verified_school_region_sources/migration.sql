-- Record only directory membership and location matches supported by a public
-- AMYC directory entry plus a matching NECTA centre/list. PARTIAL is deliberate:
-- the sources do not establish that the institution is an AMYC-managed campus.
UPDATE "School"
SET "category" = CASE WHEN "type" = 'MAAHAD' THEN 'Religious' ELSE 'Environmental' END,
    "sourceUrl" = 'https://amyc.or.tz/sw/',
    "sourceName" = 'AMYC official school directory',
    "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official directory","fields":["name","directory listing","directory category"]}]'
WHERE "status" = 'PUBLISHED' AND "deletedAt" IS NULL;

UPDATE "School"
SET "region" = 'Tanga', "district" = 'Tanga City Council',
    "verificationStatus" = 'PARTIAL',
    "sourceName" = 'AMYC directory; NECTA Tanga City Council school list',
    "sourceUrl" = 'https://onlinesys.necta.go.tz/results/2024/sfna/results/distr_ps2007.htm',
    "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official directory","fields":["AMYC school name"]},{"url":"https://onlinesys.necta.go.tz/results/2024/sfna/results/distr_ps2007.htm","name":"NECTA 2024 Tanga City Council SFNA list","fields":["matching school name","Tanga City Council listing"]}]'
WHERE "slug" IN ('marwah-islamic-primary-school','avicenna-islamic-primary-school','arafah-islamic-english-medium-primary-school');

UPDATE "School"
SET "region" = 'Tanga', "district" = 'Korogwe Town Council',
    "verificationStatus" = 'PARTIAL',
    "sourceName" = 'AMYC directory; NECTA Korogwe Town Council school list',
    "sourceUrl" = 'https://onlinesys.necta.go.tz/results/2024/psle/results/distr_2009.htm',
    "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official directory","fields":["AMYC school name"]},{"url":"https://onlinesys.necta.go.tz/results/2024/psle/results/distr_2009.htm","name":"NECTA 2024 Korogwe Town Council PSLE list","fields":["matching Muzdalifah Primary name","Korogwe Town Council listing"]}]'
WHERE "slug" = 'muzdalifah-islamic-primary-school';

UPDATE "School"
SET "status" = 'DRAFT', "verificationStatus" = 'UNVERIFIED',
    "region" = NULL, "district" = NULL,
    "about" = 'This legacy entry is not present in the current public AMYC school directory. Confirm its name and status with AMYC before publication.',
    "sourceName" = 'Legacy directory entry; not found in current AMYC listing',
    "sourceUrl" = 'https://amyc.or.tz/sw/',
    "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC current public directory","fields":["checked; no matching school entry"]}]'
WHERE "slug" IN ('maahad-al-farouq','maahad-imam-shafi');

UPDATE "Region"
SET "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name","AMYC directory listing"]},{"url":"https://tanga.go.tz/","name":"Tanga Region Government","fields":["administrative region reference"]}]',
    "sourceName" = 'AMYC list of Majimbo; Tanga Region Government',
    "sourceUrl" = 'https://tanga.go.tz/'
WHERE "administrativeRegion" = 'Tanga';

UPDATE "Region"
SET "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name","AMYC directory listing"]},{"url":"https://kagera.go.tz/","name":"Kagera Region Government","fields":["administrative region reference"]}]',
    "sourceName" = 'AMYC list of Majimbo; Kagera Region Government',
    "sourceUrl" = 'https://kagera.go.tz/'
WHERE "administrativeRegion" = 'Kagera';

UPDATE "Region"
SET "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name","AMYC directory listing"]},{"url":"https://mtwara.go.tz/","name":"Mtwara Region Government","fields":["administrative region reference"]}]',
    "sourceName" = 'AMYC list of Majimbo; Mtwara Region Government',
    "sourceUrl" = 'https://mtwara.go.tz/'
WHERE "administrativeRegion" = 'Mtwara';

UPDATE "Region"
SET "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name","AMYC directory listing"]},{"url":"https://ruvuma.go.tz/","name":"Ruvuma Region Government","fields":["administrative region reference"]}]',
    "sourceName" = 'AMYC list of Majimbo; Ruvuma Region Government',
    "sourceUrl" = 'https://ruvuma.go.tz/'
WHERE "administrativeRegion" = 'Ruvuma';

UPDATE "Region"
SET "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name","AMYC directory listing"]},{"url":"https://singida.go.tz/","name":"Singida Region Government","fields":["administrative region reference"]}]',
    "sourceName" = 'AMYC list of Majimbo; Singida Region Government',
    "sourceUrl" = 'https://singida.go.tz/'
WHERE "administrativeRegion" = 'Singida';

-- A Jimbo's name is not enough to assign it to a specific district. Keep the
-- ambiguous localities blank until AMYC confirms the branch address.
UPDATE "Region"
SET "district" = NULL, "administrativeRegion" = NULL,
    "locationVerificationStatus" = 'UNVERIFIED',
    "sourceName" = 'AMYC list of Majimbo only; locality requires confirmation',
    "sourceUrl" = 'https://amyc.or.tz/sw/',
    "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name only"]}]'
WHERE "slug" IN ('jimbo-la-katoro','jimbo-la-kyaka','jimbo-la-nkamba-kidatu','jimbo-la-juhudi-makonga','jimbo-la-kitangili-newara','jimbo-la-matui-azimio','jimbo-la-kanda-ya-kaskazini');

UPDATE "Region"
SET "overview" = 'This Jimbo is listed in the AMYC directory. Its administrative location and branch address still require confirmation from AMYC.'
WHERE "locationVerificationStatus" = 'UNVERIFIED';

UPDATE "Region"
SET "overview" = 'This Jimbo is listed in the AMYC directory. The location shown is a preliminary name-based match; AMYC must confirm the branch address and service area.'
WHERE "locationVerificationStatus" = 'PARTIAL';

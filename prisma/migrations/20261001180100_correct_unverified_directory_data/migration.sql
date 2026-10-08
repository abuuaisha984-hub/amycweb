UPDATE "School"
SET
  "region" = NULL,
  "district" = NULL,
  "ward" = NULL,
  "address" = NULL,
  "verificationStatus" = 'PARTIAL',
  "sourceUrl" = 'https://amyc.or.tz/sw/',
  "sourceName" = 'AMYC official schools directory',
  "dateVerified" = '2026-10-01T00:00:00.000Z',
  "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official schools directory","fields":["school name","AMYC directory listing","directory category"]}]',
  "about" = 'This institution appears in the official AMYC schools directory. Its location, detailed programmes, facilities and contacts are not confirmed by that directory.',
  "history" = NULL,
  "facilities" = '[]',
  "levelsOffered" = CASE
    WHEN "type" = 'PRIMARY' THEN '["Primary"]'
    WHEN "type" = 'SECONDARY' THEN '["Secondary"]'
    WHEN "type" = 'COLLEGE' THEN '["Teacher training college"]'
    ELSE '[]'
  END,
  "level" = CASE
    WHEN "type" = 'PRIMARY' THEN 'Primary'
    WHEN "type" = 'SECONDARY' THEN 'Secondary'
    ELSE NULL
  END,
  "gender" = NULL,
  "medium" = CASE WHEN "name" LIKE '%English Medium%' THEN 'English medium' ELSE NULL END,
  "image" = CASE WHEN "slug" = 'muzdalifah-islamic-primary-school' THEN '/images/school_muzdalifah.JPG' ELSE NULL END,
  "updatedAt" = '2026-10-01T00:00:00.000Z';

UPDATE "School"
SET "gender" = 'Girls'
WHERE "slug" = 'maahad-ummu-salamah';

UPDATE "School"
SET
  "region" = 'Arusha',
  "district" = 'Arusha City Council',
  "verificationStatus" = 'PARTIAL',
  "sourceUrl" = 'https://onlinesys.necta.go.tz/results/2024/sfna/results/distr_ps0101.htm',
  "sourceName" = 'AMYC directory; NECTA 2024 Arusha City schools list',
  "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official schools directory","fields":["school name","AMYC directory listing"]},{"url":"https://onlinesys.necta.go.tz/results/2024/sfna/results/distr_ps0101.htm","name":"NECTA 2024 Arusha City SFNA schools list","fields":["school name","Arusha City Council"]}]'
WHERE "slug" = 'assalaf-islamic-primary-school';

UPDATE "Region"
SET
  "overview" = 'Administrative location and current regional contact details are being verified.',
  "sourceUrl" = 'https://amyc.or.tz/sw/',
  "sourceName" = 'AMYC official list of Majimbo',
  "sources" = '[{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name","AMYC directory listing"]}]',
  "dateVerified" = '2026-10-01T00:00:00.000Z',
  "administrativeRegion" = NULL,
  "district" = NULL,
  "locationVerificationStatus" = 'UNVERIFIED',
  "contact" = NULL,
  "email" = NULL,
  "phone" = NULL,
  "website" = NULL,
  "history" = NULL,
  "activities" = '[]',
  "branches" = '[]',
  "leadership" = '[]',
  "updatedAt" = '2026-10-01T00:00:00.000Z';

UPDATE "Region" SET "administrativeRegion" = 'Tanga', "district" = 'Tanga City Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-tanga-mjini';
UPDATE "Region" SET "administrativeRegion" = 'Tanga', "district" = 'Muheza District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-muheza';
UPDATE "Region" SET "administrativeRegion" = 'Tanga', "district" = 'Pangani District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-pangani';
UPDATE "Region" SET "administrativeRegion" = 'Tanga', "district" = 'Lushoto District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-lushoto-mjini';
UPDATE "Region" SET "administrativeRegion" = 'Tanga', "district" = 'Kilindi District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-kilindi';
UPDATE "Region" SET "administrativeRegion" = 'Tanga', "district" = 'Mkinga District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" IN ('jimbo-la-moa', 'jimbo-la-mkinga', 'jimbo-la-maramba');
UPDATE "Region" SET "administrativeRegion" = 'Tanga', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" IN ('jimbo-la-handeni', 'jimbo-la-korogwe');
UPDATE "Region" SET "administrativeRegion" = 'Kagera', "district" = 'Karagwe District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-karagwe';
UPDATE "Region" SET "administrativeRegion" = 'Kagera', "district" = 'Bukoba Municipal Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-bukoba-mjini';
UPDATE "Region" SET "administrativeRegion" = 'Kagera', "district" = 'Missenyi District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" IN ('jimbo-la-misenyi', 'jimbo-la-kyaka');
UPDATE "Region" SET "administrativeRegion" = 'Kagera', "district" = 'Muleba District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-muleba';
UPDATE "Region" SET "administrativeRegion" = 'Ruvuma', "district" = 'Mbinga District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-mbinga';
UPDATE "Region" SET "administrativeRegion" = 'Mtwara', "district" = 'Masasi District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-masasi';
UPDATE "Region" SET "administrativeRegion" = 'Mtwara', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-mikunda-mtwara';
UPDATE "Region" SET "administrativeRegion" = 'Singida', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-singida';
UPDATE "Region" SET "administrativeRegion" = 'Morogoro', "district" = 'Kilombero District Council', "locationVerificationStatus" = 'PARTIAL' WHERE "slug" = 'jimbo-la-nkamba-kidatu';

-- AMYC's own school region taxonomy places these schools under Singida.
-- It does not identify an individual council, ward, or physical street address.
UPDATE "School"
SET "region" = 'Singida', "district" = NULL,
    "verificationStatus" = 'PARTIAL',
    "sourceName" = 'AMYC directory and AMYC School Region: Singida page',
    "sourceUrl" = 'https://amyc.or.tz/index.php/school_regions/singida/',
    "sources" = '[{"url":"https://amyc.or.tz/index.php/school_regions/singida/","name":"AMYC School Region: Singida","fields":["school listed in AMYC Singida region"]}]'
WHERE "slug" IN ('maahad-ibn-masoud','aswidiq-islamic-seminary-secondary-school','al-farouq-islamic-primary-school')
  AND "status" = 'PUBLISHED';

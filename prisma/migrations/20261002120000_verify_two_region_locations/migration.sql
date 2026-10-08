-- These are preliminary geographic matches. Official sources identify the
-- named localities and councils, but do not verify AMYC branch boundaries.
UPDATE "Region"
SET "administrativeRegion" = 'Manyara',
    "district" = 'Kiteto District Council',
    "locationVerificationStatus" = 'PARTIAL',
    "sourceName" = 'TMDA Kiteto District Council registry; AMYC list of Majimbo',
    "sourceUrl" = 'https://www.tmda.go.tz/pages/kiteto-dc',
    "sources" = '[{"url":"https://www.tmda.go.tz/pages/kiteto-dc","name":"TMDA Kiteto District Council registry","fields":["Manyara Region","Kiteto District","Matui Ward","Azimio locality"]},{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name"]}]',
    "dateVerified" = '2026-10-02 00:00:00.000',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'jimbo-la-matui-azimio';

UPDATE "Region"
SET "administrativeRegion" = 'Mtwara',
    "district" = 'Newala Town Council',
    "locationVerificationStatus" = 'PARTIAL',
    "sourceName" = 'Newala Town Council administrative units; AMYC list of Majimbo',
    "sourceUrl" = 'https://newalatc.go.tz/storage/app/uploads/public/58d/4d9/401/58d4d940116f3137068400.pdf',
    "sources" = '[{"url":"https://newalatc.go.tz/storage/app/uploads/public/58d/4d9/401/58d4d940116f3137068400.pdf","name":"Newala Town Council administrative units","fields":["Juhudi locality","Newala Town Council"]},{"url":"https://newalatc.go.tz/storage/app/uploads/public/5d2/41b/1a8/5d241b1a8eb8f000187715.pdf","name":"Newala Town Council administrative units and population","fields":["Makonga ward","Newala Division"]},{"url":"https://amyc.or.tz/sw/","name":"AMYC official list of Majimbo","fields":["Jimbo name"]}]',
    "dateVerified" = '2026-10-02 00:00:00.000',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'jimbo-la-juhudi-makonga';

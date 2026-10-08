export const REGION_BANDS = [
  {
    key: "north-tanga",
    labelKey: "regions.band.north-tanga",
    slugs: [
      "jimbo-la-tanga-mjini",
      "jimbo-la-muheza",
      "jimbo-la-korogwe",
      "jimbo-la-pangani",
      "jimbo-la-moa",
      "jimbo-la-lushoto-mjini",
      "jimbo-la-handeni",
      "jimbo-la-mkinga",
      "jimbo-la-maramba",
      "jimbo-la-kilindi",
      "jimbo-la-kanda-ya-kaskazini",
    ],
  },
  {
    key: "south-west",
    labelKey: "regions.band.south-west",
    slugs: [
      "jimbo-la-masasi",
      "jimbo-la-mikunda-mtwara",
      "jimbo-la-kitangili-newara",
      "jimbo-la-mbinga",
    ],
  },
  {
    key: "lake",
    labelKey: "regions.band.lake",
    slugs: [
      "jimbo-la-bukoba-mjini",
      "jimbo-la-karagwe",
      "jimbo-la-misenyi",
      "jimbo-la-kyaka",
      "jimbo-la-muleba",
      "jimbo-la-katoro",
    ],
  },
  {
    key: "central-coast",
    labelKey: "regions.band.central-coast",
    slugs: [
      "jimbo-la-singida",
      "jimbo-la-matui-azimio",
      "jimbo-la-juhudi-makonga",
      "jimbo-la-nkamba-kidatu",
    ],
  },
] as const

export type RegionBandKey = (typeof REGION_BANDS)[number]["key"]

export function isRegionBandKey(value: string | undefined): value is RegionBandKey {
  return REGION_BANDS.some((band) => band.key === value)
}

export function getRegionBandForSlug(slug: string): RegionBandKey | null {
  return REGION_BANDS.find((band) => (band.slugs as readonly string[]).includes(slug))?.key ?? null
}

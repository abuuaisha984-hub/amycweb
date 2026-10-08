"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Baby, BookOpen, GraduationCap, Hammer, HeartHandshake, Radio, Sparkles, Sprout, Stethoscope, Users } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { publicImage } from "@/lib/public-image"

type Programme = {
  id: string
  slug: string
  name: string
  shortDescription: string
  image: string | null
}

const ICONS: Record<string, typeof Sparkles> = {
  dawah: BookOpen,
  education: GraduationCap,
  "social-welfare": HeartHandshake,
  "community-services": Hammer,
  healthcare: Stethoscope,
  "youth-development": Users,
  "development-projects": Sprout,
  "media-communication": Radio,
  "orphan-welfare": Baby,
}

export function ProgrammeSlider({ programmes, locale, learnMore }: { programmes: Programme[]; locale: string; learnMore: string }) {
  return (
    <Carousel opts={{ align: "start", loop: false }} className="mx-auto mt-10 max-w-[76rem] px-1 sm:px-12">
      <CarouselContent className="-ml-5">
        {programmes.map((programme) => {
          const Icon = ICONS[programme.slug] || Sparkles
          const image = publicImage(programme.image)
          return (
            <CarouselItem key={programme.id} className="basis-[86%] pl-5 sm:basis-1/2 lg:basis-1/3">
              <Link href={`/${locale}/programmes/${programme.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card">
                <div className="relative aspect-[16/10] overflow-hidden bg-primary/10">
                  {image ? <Image src={image} alt={programme.name} fill sizes="(max-width: 640px) 86vw, (max-width: 1024px) 45vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <span className="flex h-full items-center justify-center text-primary/50"><Icon className="h-10 w-10" /></span>}
                  <span className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background/90 text-primary shadow-sm backdrop-blur"><Icon className="h-4.5 w-4.5" /></span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary">{programme.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{programme.shortDescription}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">{learnMore}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" /></span>
                </div>
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden border-primary/20 bg-background text-primary shadow-soft hover:bg-primary hover:text-primary-foreground sm:inline-flex" />
      <CarouselNext className="hidden border-primary/20 bg-background text-primary shadow-soft hover:bg-primary hover:text-primary-foreground sm:inline-flex" />
    </Carousel>
  )
}

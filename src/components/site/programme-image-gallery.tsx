"use client"

import Image from "next/image"
import { useCallback, useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"

export function ProgrammeImageGallery({ images, name, label, previousLabel, nextLabel, showLabel }: { images: string[]; name: string; label: string; previousLabel: string; nextLabel: string; showLabel: string }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [api, setApi] = useState<CarouselApi>()

  const attachApi = useCallback((nextApi: CarouselApi) => {
    if (!nextApi) return
    setApi(nextApi)
    nextApi.on("select", () => setActiveSlide(nextApi.selectedScrollSnap()))
  }, [])

  if (!images.length) {
    return <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 text-center text-sm text-muted-foreground" role="img" aria-label={`${name} ${label}`}>
      <span className="px-6">{label}</span>
    </div>
  }

  return <div>
    <Carousel setApi={attachApi} opts={{ align: "start", loop: images.length > 1 }} aria-label={`${name} ${label}`}>
      <CarouselContent className="ml-0">
        {images.map((src, index) => <CarouselItem key={`${src}-${index}`} className="relative aspect-[4/3] pl-0">
          <Image src={src} alt={`${name} — ${index + 1}`} fill sizes="(max-width: 1024px) 100vw, 42vw" priority={index === 0} className="rounded-2xl object-cover" />
        </CarouselItem>)}
      </CarouselContent>
      {images.length > 1 && <>
        <CarouselPrevious aria-label={previousLabel} className="left-3 border-0 bg-background/90 text-foreground shadow-md hover:bg-background" />
        <CarouselNext aria-label={nextLabel} className="right-3 border-0 bg-background/90 text-foreground shadow-md hover:bg-background" />
        <div className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground" aria-live="polite">{activeSlide + 1} / {images.length}</div>
      </>}
    </Carousel>
    {api && images.length > 1 && <div className="mt-3 flex justify-center gap-2" role="group" aria-label={`${name} image slides`}>
      {images.map((src, index) => <button key={`${src}-${index}`} type="button" aria-label={`${showLabel} ${index + 1}`} aria-current={activeSlide === index} onClick={() => api.scrollTo(index)} className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-7 bg-primary" : "w-2.5 bg-primary/25 hover:bg-primary/50"}`} />)}
    </div>}
  </div>
}

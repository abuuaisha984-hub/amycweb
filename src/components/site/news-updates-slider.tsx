"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/i18n"

export type NewsUpdateSlide = {
  id: string
  href: string
  title: string
  excerpt: string
  image: string | null
  publishedAt: string
  isFeatured: boolean
}

type Props = {
  slides: NewsUpdateSlide[]
  locale: "en" | "sw" | "ar"
  labels: {
    region: string
    eyebrow: string
    readMore: string
    noUpdatesTitle: string
    noUpdatesDescription: string
    viewAll: string
    previous: string
    next: string
    showSlide: string
    featured: string
    of: string
  }
}

function AnimatedSlideContent({ slide, index, total, locale, labels }: { slide: NewsUpdateSlide; index: number; total: number; locale: "en" | "sw" | "ar"; labels: Props["labels"] }) {
  const [typedTitle, setTypedTitle] = useState(slide.title)
  const [contentRevealed, setContentRevealed] = useState(true)

  useEffect(() => {
    const title = slide.title
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const revealTimer = window.setTimeout(() => {
        setTypedTitle(title)
        setContentRevealed(true)
      }, 0)
      return () => window.clearTimeout(revealTimer)
    }

    let characterIndex = 0
    let revealTimer: number | undefined
    const resetTimer = window.setTimeout(() => {
      setTypedTitle("")
      setContentRevealed(false)
    }, 0)
    const typingTimer = window.setInterval(() => {
      characterIndex += 1
      setTypedTitle(title.slice(0, characterIndex))
      if (characterIndex >= title.length) {
        window.clearInterval(typingTimer)
        revealTimer = window.setTimeout(() => setContentRevealed(true), 180)
      }
    }, 60)
    return () => {
      window.clearTimeout(resetTimer)
      window.clearInterval(typingTimer)
      if (revealTimer !== undefined) window.clearTimeout(revealTimer)
    }
  }, [slide.title])

  return (
    <div className="max-w-[32rem] rounded-2xl border border-white/15 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-md sm:p-6">
      <div className="news-hero-label inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
        <Newspaper className="h-4 w-4" aria-hidden="true" />{slide.isFeatured ? labels.featured : labels.eyebrow}
        <span className="ms-1 inline-flex items-center gap-1.5 font-normal tracking-normal text-white/75"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(slide.publishedAt, locale, { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
      <h1 className="mt-3 min-h-[2.3em] font-serif text-2xl font-bold leading-[1.15] tracking-tight text-balance sm:text-[1.7rem] lg:text-4xl" aria-label={slide.title}>
        <span aria-hidden="true">{typedTitle}</span><span className="sr-only">{slide.title}</span>
      </h1>
      {slide.excerpt && <p className={`mt-3 max-w-2xl text-sm leading-relaxed text-white/80 transition-[opacity,transform] duration-500 sm:text-base ${contentRevealed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>{slide.excerpt}</p>}
      <div className={`mt-5 transition-[opacity,transform] duration-500 ${contentRevealed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <Button asChild className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"><Link href={slide.href}>{labels.readMore}<ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" /></Link></Button>
      </div>
      <span className="sr-only" aria-live="polite">{labels.showSlide} {index + 1} {labels.of} {total}</span>
    </div>
  )
}

function SlideImage({ slide, priority }: { slide: NewsUpdateSlide; priority: boolean }) {
  const [failed, setFailed] = useState(false)
  const fallback = (
    <div role="img" aria-label={slide.title} className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/70">
      <div className="absolute inset-0 bg-pattern opacity-20" />
      <div className="absolute inset-0 grid place-items-center text-primary-foreground/50">
        <Newspaper className="h-20 w-20" aria-hidden="true" />
      </div>
    </div>
  )

  if (!slide.image || failed) return fallback
  if (/^https?:\/\//i.test(slide.image)) {
    return <img src={slide.image} alt={slide.title} onError={() => setFailed(true)} loading={priority ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
  }
  return <Image src={slide.image} alt={slide.title} fill sizes="100vw" priority={priority} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} className="object-cover" />
}

export function NewsUpdatesSlider({ slides, locale, labels }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const rtl = locale === "ar"

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setActiveIndex((current) => (current + 1) % slides.length)
      }
    }, 6400)
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  if (slides.length === 0) {
    return (
      <section aria-labelledby="home-updates-title" className="relative isolate flex h-[clamp(34rem,70svh,44rem)] items-end overflow-hidden border-y-[3px] border-accent/90 bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/35 to-primary/10" />
        <div className="container-institutional relative z-10 w-full pb-20 pt-14 sm:pb-24" dir={rtl ? "rtl" : "ltr"}>
          <div className="max-w-xl rounded-2xl border border-white/15 bg-primary/75 p-6 shadow-2xl backdrop-blur-md sm:p-9">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent"><Newspaper className="h-4 w-4" aria-hidden="true" />{labels.eyebrow}</span>
            <h1 id="home-updates-title" className="mt-4 font-serif text-3xl font-semibold leading-tight text-balance sm:text-5xl">{labels.noUpdatesTitle}</h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">{labels.noUpdatesDescription}</p>
            <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"><Link href={`/${locale}/news`}>{labels.viewAll}<ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" /></Link></Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label={labels.region}
      aria-roledescription="carousel"
      tabIndex={slides.length > 1 ? 0 : undefined}
      onKeyDown={(event) => {
        if (slides.length < 2) return
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          goTo(activeIndex + (rtl ? 1 : -1))
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          goTo(activeIndex + (rtl ? -1 : 1))
        }
      }}
      className="group relative isolate h-[clamp(34rem,70svh,44rem)] overflow-hidden border-y-[3px] border-accent/90 bg-primary text-white shadow-soft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false) }}
      dir={rtl ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 bg-primary" aria-hidden="true">
        {slides.map((slide, index) => (
          <div key={slide.id} aria-hidden="true" className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none ${index === activeIndex ? "z-[1] news-hero-image-zoom opacity-100" : "opacity-0"}`}>
            <SlideImage slide={slide} priority={index === 0} />
          </div>
        ))}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-black/15 to-black/15" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/35 via-transparent to-transparent" />
      </div>

      {slides.map((slide, index) => index === activeIndex && (
        <article key={slide.id} className="absolute inset-0 z-10 mx-auto grid w-full max-w-[90rem] items-end justify-items-center px-4 pb-20 sm:px-8 sm:pb-24 lg:px-16" aria-label={`${labels.showSlide} ${index + 1} ${labels.of} ${slides.length}`}>
          <div className="news-hero-card">
            <AnimatedSlideContent key={slide.id} slide={slide} index={index} total={slides.length} locale={locale} labels={labels} />
          </div>
        </article>
      ))}

      {slides.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 pb-5 sm:pb-7" aria-label={labels.region}>
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" aria-label={`${labels.showSlide} ${index + 1}`} aria-current={activeIndex === index ? "true" : undefined} onClick={() => goTo(index)} className={`h-2 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 ${activeIndex === index ? "w-7 bg-white" : "w-2 bg-white/55 hover:bg-white/85"}`} />
            ))}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={labels.previous} onClick={() => goTo(activeIndex + (rtl ? 1 : -1))} className="absolute start-3 top-1/2 z-20 size-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/25 text-white opacity-70 backdrop-blur transition hover:bg-black/55 hover:text-white focus-visible:opacity-100 sm:start-6 sm:size-12 sm:opacity-0 sm:group-hover:opacity-100">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label={labels.next} onClick={() => goTo(activeIndex + (rtl ? -1 : 1))} className="absolute end-3 top-1/2 z-20 size-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/25 text-white opacity-70 backdrop-blur transition hover:bg-black/55 hover:text-white focus-visible:opacity-100 sm:end-6 sm:size-12 sm:opacity-0 sm:group-hover:opacity-100">
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Button>
        </>
      )}
    </section>
  )
}
